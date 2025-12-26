# 개발 DB → 운영 DB 동기화 가이드

## 프로젝트 정보

| 환경 | 프로젝트 이름 | Project Ref |
|------|--------------|-------------|
| 개발 | perfectlancer-local | `uqaiqevdmwlpsozwnigg` |
| 운영 | perfectlancer-production | `xgnnhfmpporixibxpeas` |

---

## 방법 1: 스키마 차이 확인 후 수동 적용 (권장)

### Step 1: 개발 DB 스키마 덤프
```bash
supabase db dump --linked --project-ref uqaiqevdmwlpsozwnigg > dev_schema.sql
```

### Step 2: 운영 DB 스키마 덤프
```bash
supabase db dump --linked --project-ref xgnnhfmpporixibxpeas > prod_schema.sql
```

### Step 3: 차이점 확인
```bash
# 터미널에서 diff 확인
diff dev_schema.sql prod_schema.sql

# 또는 VS Code에서 비교
code --diff dev_schema.sql prod_schema.sql
```

### Step 4: 차이점 SQL을 운영 DB에 적용
Supabase Dashboard → SQL Editor에서 실행하거나:
```bash
# psql로 직접 적용
psql "postgresql://postgres.xgnnhfmpporixibxpeas:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f changes.sql
```

---

## 방법 2: 전체 스키마 덮어쓰기 (주의 필요)

운영 DB를 완전히 개발 DB와 동일하게 만들 때 사용.
**주의: 운영 데이터가 삭제될 수 있음!**

### Step 1: 개발 DB 전체 덤프
```bash
# 스키마만
supabase db dump --linked --project-ref uqaiqevdmwlpsozwnigg > dev_schema.sql

# 데이터 포함
supabase db dump --linked --project-ref uqaiqevdmwlpsozwnigg --data-only > dev_data.sql
```

### Step 2: 운영 DB 초기화 후 적용
Supabase Dashboard에서 DB 리셋 후 SQL Editor에서 스키마 적용.

---

## 방법 3: MCP 도구로 마이그레이션 적용

Claude Code에서 Supabase MCP를 통해 직접 마이그레이션 적용 가능.

```
# Claude Code에서 실행
apply_migration 명령으로 SQL 적용
```

---

## 포함되는 것 vs 안 되는 것

### db dump에 포함됨
- 테이블, 컬럼, 인덱스
- 함수 (Functions)
- 트리거 (Triggers)
- RLS 정책 (Policies)
- 뷰 (Views)
- 타입/Enum
- 시퀀스

### db dump에 포함 안 됨
- 실제 데이터 (`--data-only` 옵션 필요)
- Storage 버킷 및 정책
- Edge Functions
- Auth 설정 (OAuth providers 등)
- Secrets/환경변수

---

## 자주 사용하는 명령어

```bash
# 프로젝트 연결 상태 확인
supabase projects list

# 개발 DB 연결
supabase link --project-ref uqaiqevdmwlpsozwnigg

# 운영 DB 연결
supabase link --project-ref xgnnhfmpporixibxpeas

# 마이그레이션 목록 확인
supabase migration list

# 로컬 변경사항을 마이그레이션 파일로 생성
supabase db diff -f migration_name

# 마이그레이션 적용
supabase db push
```

---

## 운영 DB 연결 정보

```
Host: aws-0-ap-northeast-2.pooler.supabase.com
Port: 5432
Database: postgres
User: postgres.xgnnhfmpporixibxpeas
Password: [Supabase Dashboard에서 확인]
```

### psql 연결 명령어
```bash
psql "postgresql://postgres.xgnnhfmpporixibxpeas:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

**참고**: 비밀번호에 특수문자(`!` 등)가 있으면 URL 인코딩 필요
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`

---

## 트러블슈팅

### 트리거가 운영에 없을 때
```sql
-- 개발 DB에서 트리거 확인
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 없는 트리거 수동 생성
CREATE TRIGGER trigger_name
  AFTER INSERT ON table_name
  FOR EACH ROW EXECUTE FUNCTION function_name();
```

### RLS 정책 문제
```sql
-- RLS 상태 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 특정 테이블 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

### Storage 정책 수동 적용
Storage는 db dump에 포함 안 되므로 수동으로 설정:
```sql
-- Storage 정책 추가 예시
CREATE POLICY "Allow all" ON storage.objects
  FOR ALL USING (true) WITH CHECK (true);
```
