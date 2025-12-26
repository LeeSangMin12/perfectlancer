# Supabase 데이터베이스 현황 문서

> 마지막 업데이트: 2025-12-26

---

## 1. 테이블 (41개)

### 핵심 테이블

| 테이블명 | 설명 | RLS |
|---------|------|-----|
| `users` | 사용자 정보 | X |
| `posts` | 게시글 | X |
| `services` | 서비스 (판매 상품) | X |
| `communities` | 커뮤니티 | X |

### 외주 관련 (핵심 비즈니스)

| 테이블명 | 설명 | RLS |
|---------|------|-----|
| `work_requests` | 외주 공고 | X |
| `work_request_proposals` | 전문가 견적 제안 | X |
| `work_request_reviews` | 외주 완료 후 리뷰 | X |
| `work_request_bookmarks` | 외주 공고 북마크 | X |
| `quote_templates` | 전문가 견적서 템플릿 | X |

### 포인트/결제 관련

| 테이블명 | 설명 | 비고 |
|---------|------|------|
| `point_charges` | 포인트 충전 요청 | |
| `point_transactions` | 포인트 거래 내역 | 충전/출금/결제/수익/선물 |
| `point_withdrawals` | 포인트 출금 요청 | |
| `payments` | 통합 결제 테이블 | 계좌이체 기반 |
| `payment_transactions` | PortOne 결제 내역 | 카드결제용 |

### 서비스 거래 관련

| 테이블명 | 설명 | RLS |
|---------|------|-----|
| `service_orders` | 서비스 주문 | O |
| `service_options` | 서비스 옵션 | X |
| `service_reviews` | 서비스 리뷰 | X |
| `service_likes` | 서비스 좋아요 | X |
| `service_bookmarks` | 서비스 북마크 | X |
| `order_options` | 주문별 옵션 | X |

### 게시글 관련

| 테이블명 | 설명 |
|---------|------|
| `post_comments` | 댓글 |
| `post_comment_votes` | 댓글 투표 |
| `post_votes` | 게시글 투표 |
| `post_bookmarks` | 게시글 북마크 |
| `post_reports` | 게시글 신고 |
| `post_comment_reports` | 댓글 신고 |

### 커뮤니티 관련

| 테이블명 | 설명 |
|---------|------|
| `community_members` | 멤버십 |
| `community_topics` | 토픽 매핑 |
| `community_reports` | 커뮤니티 신고 |
| `topics` | 토픽 목록 |
| `topic_categories` | 토픽 카테고리 |

### 사용자 관련

| 테이블명 | 설명 |
|---------|------|
| `user_follows` | 팔로우 관계 |
| `user_bank_accounts` | 출금 계좌 |
| `user_devices` | FCM 토큰 (푸시) |
| `user_coupons` | 쿠폰 사용 내역 |
| `user_reports` | 유저 신고 |
| `user_inquiries` | 문의 (구 coffee_chats) |

### 알림 관련

| 테이블명 | 설명 |
|---------|------|
| `notifications` | 알림 |
| `notification_settings` | 알림 설정 |

### 기타

| 테이블명 | 설명 |
|---------|------|
| `coupons` | 쿠폰 마스터 |
| `service_reports` | 서비스 신고 |

---

## 2. Functions (24개)

### 비즈니스 로직

| 함수명 | 설명 |
|--------|------|
| `accept_proposal` | 제안 수락 |
| `complete_project` | 프로젝트 완료 |
| `gift_point` | 포인트 선물 (5% 수수료) |

### 포인트/결제

| 함수명 | 설명 |
|--------|------|
| `add_point` | 포인트 추가 |
| `deduct_point` | 포인트 차감 |
| `approve_point_charge` | 포인트 충전 승인 |
| `approve_point_withdrawal` | 포인트 출금 승인 |

### 서비스 주문

| 함수명 | 설명 |
|--------|------|
| `approve_service_order` | 서비스 주문 승인 |
| `complete_service_order` | 서비스 주문 완료 |
| `cancel_service_order` | 서비스 주문 취소 |
| `refund_service_order` | 서비스 환불 |

### 유틸리티

| 함수명 | 설명 |
|--------|------|
| `get_user_auth_provider` | 사용자 인증 제공자 조회 |
| `update_service_rating` | 서비스 평점 업데이트 |
| `increment_coupon_usage` | 쿠폰 사용 횟수 증가 |
| `handle_new_user` | 신규 유저 처리 (트리거) |
| `create_notification_settings` | 알림 설정 생성 (트리거) |
| `send_push_notification_webhook` | 푸시 알림 웹훅 |
| `sync_post_vote_count` | 게시글 투표 카운트 동기화 |
| `sync_post_comment_count` | 댓글 카운트 동기화 |
| `sync_post_bookmark_count` | 북마크 카운트 동기화 |
| `trigger_update_service_rating` | 서비스 평점 트리거 |
| `update_updated_at_column` | updated_at 자동 업데이트 |
| `update_user_point_on_transaction` | 포인트 트랜잭션 시 유저 포인트 동기화 |

---

## 3. Edge Functions (2개)

| 함수명 | 설명 | JWT 검증 |
|--------|------|----------|
| `push` | 푸시 알림 발송 | X |
| `sms-otp` | SMS OTP 인증 | X |

---

## 4. 설치된 Extensions

| Extension | 용도 |
|-----------|------|
| `pg_trgm` | 텍스트 유사도 검색 |
| `pg_graphql` | GraphQL 지원 |
| `pg_net` | 비동기 HTTP (Edge Function 호출용) |
| `pgcrypto` | 암호화 함수 |
| `uuid-ossp` | UUID 생성 |
| `pg_stat_statements` | SQL 성능 모니터링 |
| `supabase_vault` | 비밀 저장소 |

---

## 5. 수수료 구조

| 기능 | 수수료 | 적용 시점 |
|------|--------|----------|
| 외주 완료 | 5% | 전문가에게 입금 시 |
| 포인트 선물 | 5% | 받는 사람에게 입금 시 |
| 출금 | 0% | - |

---

## 6. 프로젝트 정보

| 환경 | 프로젝트 이름 | Project Ref |
|------|--------------|-------------|
| 개발 | perfectlancer-local | `uqaiqevdmwlpsozwnigg` |
| 운영 | perfectlancer-production | `xgnnhfmpporixibxpeas` |

---

## 7. 변경 이력

### 2025-12-26
- `user_contacts` 테이블 삭제 (연락처 정보는 `users` 테이블로 통합)
- `users.marketing_consent` 컬럼 추가
- `get_user_auth_provider` 함수 추가

### 2025-12-24
- `email_otp_codes` 테이블 생성 후 삭제 (Supabase Auth 사용으로 변경)

### 2025-12-21
- 서비스 상세 필드 추가 (`duration`, `target_audience`, `work_process` 등)
- `work_request_bookmarks` 테이블 추가

### 2025-12-20
- 투표/북마크/신고 테이블 도메인별 분리
  - `votes` → `post_votes`, `post_comment_votes`
  - `bookmarks` → `post_bookmarks`, `service_bookmarks`
  - `reports` → `post_reports`, `post_comment_reports`, `service_reports`, `community_reports`, `user_reports`
- `follows` → `user_follows` 리네임
- `inquiries` → `user_inquiries` 리네임 (구 `coffee_chats`)

### 2025-12-18
- `cash_*` 테이블들 → `point_*`로 리네임
- `moon_*` 테이블들 삭제 (point로 통합)
- `gift_moon` → `gift_point` 함수 리네임
- 카운터 동기화 트리거 추가

### 2025-12-17
- `payments` 통합 결제 테이블 추가
- `work_request_reviews` 테이블 추가
