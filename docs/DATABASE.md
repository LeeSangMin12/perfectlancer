# Supabase 데이터베이스 현황 문서

> 작성일: 2025-12-18

---

## 1. 테이블 (43개)

### 핵심 테이블

| 테이블명 | 설명 | 행 수 | RLS |
|---------|------|-------|-----|
| `users` | 사용자 정보 | 95 | X |
| `posts` | 게시글 | 90 | X |
| `services` | 서비스 (판매 상품) | 21 | X |
| `communities` | 커뮤니티 | 9 | X |

### 외주 관련 (핵심 비즈니스)

| 테이블명 | 설명 | 행 수 | RLS |
|---------|------|-------|-----|
| `work_requests` | 외주 공고 | 8 | X |
| `work_request_proposals` | 전문가 견적 제안 | 4 | X |
| `work_request_reviews` | 외주 완료 후 리뷰 | 1 | X |
| `quote_templates` | 전문가 견적서 템플릿 | 2 | X |

### 결제 관련

| 테이블명 | 설명 | 행 수 | 비고 |
|---------|------|-------|------|
| `payments` | **통합 결제 테이블 (신규)** | 2 | 계좌이체 기반 |
| `payment_transactions` | PortOne 결제 내역 (레거시) | 34 | 카드결제용 |
| `cash_charges` | 문캐시 충전 요청 | 5 | |
| `cash_transactions` | 문캐시 거래 내역 | 18 | |
| `cash_withdrawals` | 문캐시 출금 요청 | 0 | |
| `moon_charges` | 문포인트 충전 (레거시?) | 3 | |
| `moon_point_transactions` | 문포인트 거래 내역 | 19 | |
| `moon_withdrawals` | 문포인트 출금 | 9 | |

### 서비스 거래 관련

| 테이블명 | 설명 | 행 수 | RLS |
|---------|------|-------|-----|
| `service_orders` | 서비스 주문 | 13 | O |
| `service_options` | 서비스 옵션 | 2 | X |
| `service_reviews` | 서비스 리뷰 | 3 | X |
| `service_likes` | 서비스 좋아요 | 11 | X |
| `order_options` | 주문별 옵션 | 0 | X |
| `seller_settlements` | 판매자 정산 | 0 | X |
| `settlement_orders` | 정산-주문 매핑 | 0 | X |

### 게시글 관련

| 테이블명 | 설명 | 행 수 |
|---------|------|-------|
| `post_comments` | 댓글 | 61 |
| `post_comment_votes` | 댓글 투표 | 23 |
| `post_votes` | 게시글 투표 | 77 |
| `post_bookmarks` | 북마크 | 13 |
| `post_reports` | 신고 | 0 |

### 커뮤니티 관련

| 테이블명 | 설명 | 행 수 |
|---------|------|-------|
| `community_members` | 멤버십 | 59 |
| `community_topics` | 토픽 매핑 | 9 |
| `community_reports` | 신고 | 0 |
| `topics` | 토픽 목록 | 37 |
| `topic_categories` | 토픽 카테고리 | 7 |

### 사용자 관련

| 테이블명 | 설명 | 행 수 |
|---------|------|-------|
| `user_follows` | 팔로우 | 15 |
| `user_bank_accounts` | 출금 계좌 | 3 |
| `user_devices` | FCM 토큰 (푸시) | 1 |
| `user_coupons` | 쿠폰 사용 내역 | 6 |
| `user_reports` | 유저 신고 | 0 |

> **Note**: 연락처 정보(phone, email)는 `users` 테이블로 통합됨

### 알림 관련

| 테이블명 | 설명 | 행 수 |
|---------|------|-------|
| `notifications` | 알림 | 218 |
| `notification_settings` | 알림 설정 | 95 |

### 기타

| 테이블명 | 설명 | 행 수 |
|---------|------|-------|
| `coffee_chats` | 커피챗 신청 | 5 |
| `coupons` | 쿠폰 마스터 | 2 |
| `proposal_attachments` | 제안서 첨부파일 | 0 |

---

## 2. Functions (26개)

### 비즈니스 로직

| 함수명 | 설명 | 파라미터 |
|--------|------|----------|
| `accept_proposal` | 제안 수락 | proposal_id, request_id, depositor_name, bank, account_number... |
| `complete_project` | 프로젝트 완료 | request_id |
| `gift_moon` | 문 선물하기 **(5% 수수료 적용됨)** | sender_id, receiver_id, amount |

### 결제/정산

| 함수명 | 설명 |
|--------|------|
| `add_cash` | 캐시 추가 |
| `deduct_cash` | 캐시 차감 |
| `approve_cash_charge` | 캐시 충전 승인 |
| `approve_cash_withdrawal` | 캐시 출금 승인 |
| `approve_moon_charge` | 문포인트 충전 승인 |
| `reject_moon_charge` | 문포인트 충전 거절 |
| `insert_cash_transaction` | 캐시 거래 기록 |
| `insert_moon_point_transaction` | 문포인트 거래 기록 |

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
| `handle_vote` | 게시글 투표 처리 |
| `update_service_rating` | 서비스 평점 업데이트 |
| `update_expert_rating` | 전문가 평점 업데이트 (트리거) |
| `increment_coupon_usage` | 쿠폰 사용 횟수 증가 |
| `handle_new_user` | 신규 유저 처리 (트리거) |
| `create_notification_settings` | 알림 설정 생성 (트리거) |
| `send_push_notification_webhook` | 푸시 알림 웹훅 (트리거) |
| `trigger_update_service_rating` | 서비스 평점 트리거 |
| `update_updated_at_column` | updated_at 자동 업데이트 |

---

## 3. Triggers (11개)

| 트리거명 | 테이블 | 이벤트 | 함수 |
|---------|--------|--------|------|
| `trigger_create_notification_settings` | users | INSERT | create_notification_settings() |
| `trigger_send_push_notification` | notifications | INSERT | send_push_notification_webhook() |
| `service_reviews_rating_update_trigger` | service_reviews | INSERT/UPDATE/DELETE | trigger_update_service_rating() |
| `update_coffee_chats_updated_at` | coffee_chats | UPDATE | update_updated_at_column() |
| `update_moon_charges_updated_at` | moon_charges | UPDATE | update_updated_at_column() |
| `update_quote_templates_updated_at` | quote_templates | UPDATE | update_updated_at_column() |
| `update_service_orders_updated_at` | service_orders | UPDATE | update_updated_at_column() |
| `update_service_reviews_updated_at` | service_reviews | UPDATE | update_updated_at_column() |
| `update_services_updated_at` | services | UPDATE | update_updated_at_column() |

---

## 4. Edge Functions (2개)

| 함수명 | 설명 | JWT 검증 |
|--------|------|----------|
| `push` | 푸시 알림 발송 | X |
| `sms-otp` | SMS OTP 인증 | X |

---

## 5. 설치된 Extensions

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

## 6. 정리가 필요한 항목

### 중복/레거시 의심

| 항목 | 문제 | 제안 |
|------|------|------|
| `moon_*` vs `cash_*` 테이블 | 이중 화폐 시스템 | 하나로 통합 검토 |
| `payment_transactions` | PortOne 레거시 (34건) | `payments`로 통합 검토 |
| `accept_proposal` 함수 2개 | 중복 오버로드 | 하나로 정리 |
| `approve_cash_charge` 함수 2개 | 중복 오버로드 | 하나로 정리 |

### 0-row 테이블 (삭제 검토)

- `cash_withdrawals` - 출금 기능 (사용 예정이면 유지)
- `order_options` - 서비스 옵션 (사용 예정이면 유지)
- `proposal_attachments` - 첨부파일 (코드 있음, 유지)
- `seller_settlements` - 정산 (사용 예정이면 유지)
- `settlement_orders` - 정산 매핑 (사용 예정이면 유지)
- `community_reports` - 신고 (필요시 유지)
- `post_reports` - 신고 (필요시 유지)
- `user_reports` - 신고 (필요시 유지)

---

## 7. 수수료 구조 (확정)

| 기능 | 수수료 | 적용 시점 |
|------|--------|----------|
| 외주 완료 | 5% | 전문가에게 입금 시 |
| 문 선물하기 | 5% | 받는 사람에게 입금 시 |
| 출금 | 0% | - |

---

## 다음 단계

1. **moon_* vs cash_* 통합 결정** - 어느 것을 메인으로?
2. **payment_transactions 정리** - payments로 완전 이관?
3. **중복 함수 정리** - accept_proposal, approve_cash_charge
4. **사용하지 않는 테이블 삭제** 검토
