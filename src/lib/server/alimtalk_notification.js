/**
 * 카카오 알림톡 발송 서비스
 * 사용자에게 중요한 알림을 카카오톡으로 발송
 *
 * 참고: 알림톡 사용을 위해서는 다음이 필요합니다:
 * 1. 카카오 비즈니스 채널 생성
 * 2. 알림톡 템플릿 등록 및 검수 승인
 * 3. 비즈메시지 API 연동 (직접 또는 NHN Cloud, 솔라피 등 대행사 이용)
 *
 * 현재는 placeholder로 구현되어 있으며,
 * 실제 발송을 위해서는 API 연동 코드 추가 필요
 */

// 환경 변수 - 알림톡 설정이 없어도 빌드/실행 가능하도록 optional import
const ALIMTALK_API_KEY = process.env.ALIMTALK_API_KEY || '';
const ALIMTALK_SENDER_KEY = process.env.ALIMTALK_SENDER_KEY || '';
const ALIMTALK_TEMPLATE_WORK_REQUEST_APPROVED = process.env.ALIMTALK_TEMPLATE_WORK_REQUEST_APPROVED || 'WORK_REQUEST_APPROVED';
const ALIMTALK_TEMPLATE_PROPOSAL_RECEIVED = process.env.ALIMTALK_TEMPLATE_PROPOSAL_RECEIVED || 'PROPOSAL_RECEIVED';
const ALIMTALK_TEMPLATE_PAYMENT_CONFIRMED = process.env.ALIMTALK_TEMPLATE_PAYMENT_CONFIRMED || 'PAYMENT_CONFIRMED';
const ALIMTALK_TEMPLATE_COMPLETION_REQUESTED = process.env.ALIMTALK_TEMPLATE_COMPLETION_REQUESTED || 'COMPLETION_REQUESTED';
const ALIMTALK_TEMPLATE_AUTO_COMPLETE_WARNING = process.env.ALIMTALK_TEMPLATE_AUTO_COMPLETE_WARNING || 'AUTO_COMPLETE_WARNING';
const ALIMTALK_TEMPLATE_SERVICE_COMPLETED = process.env.ALIMTALK_TEMPLATE_SERVICE_COMPLETED || 'SERVICE_COMPLETED';
const ALIMTALK_TEMPLATE_REVIEW_RECEIVED = process.env.ALIMTALK_TEMPLATE_REVIEW_RECEIVED || 'REVIEW_RECEIVED';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://moonjin.io';

/**
 * 알림톡 발송 (공통)
 * @param {string} phone - 수신자 전화번호 (010-0000-0000 또는 01000000000)
 * @param {string} template_code - 알림톡 템플릿 코드
 * @param {object} variables - 템플릿 변수
 * @returns {Promise<boolean>}
 */
async function send_alimtalk(phone, template_code, variables) {
	if (!ALIMTALK_API_KEY || !ALIMTALK_SENDER_KEY) {
		console.warn('⚠️ Alimtalk API is not configured');
		// 개발 환경에서는 콘솔에 출력
		console.log('📱 [알림톡 발송 예정]', {
			phone,
			template_code,
			variables,
		});
		return false;
	}

	try {
		// 전화번호 정규화 (하이픈 제거)
		const normalized_phone = phone.replace(/-/g, '');

		// TODO: 실제 알림톡 API 연동
		// 아래는 NHN Cloud 알림톡 API 예시입니다.
		// 사용하시는 서비스에 맞게 수정해주세요.

		/*
		const response = await fetch('https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/{appKey}/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Secret-Key': ALIMTALK_API_KEY,
			},
			body: JSON.stringify({
				senderKey: ALIMTALK_SENDER_KEY,
				templateCode: template_code,
				recipientList: [{
					recipientNo: normalized_phone,
					templateParameter: variables,
				}],
			}),
		});

		const result = await response.json();
		if (result.header?.isSuccessful) {
			console.log('✅ 알림톡 발송 성공:', normalized_phone);
			return true;
		} else {
			console.error('❌ 알림톡 발송 실패:', result);
			return false;
		}
		*/

		// Placeholder: 현재는 콘솔 로그만 출력
		console.log('📱 [알림톡 발송]', {
			phone: normalized_phone,
			template_code,
			variables,
		});

		return true;
	} catch (error) {
		console.error('❌ 알림톡 발송 오류:', error);
		return false;
	}
}

/**
 * 1. 외주 공고 승인 완료 알림 (의뢰인에게)
 */
export async function notify_work_request_approved(phone, { requester_name, work_request_title, work_request_id }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_WORK_REQUEST_APPROVED || 'WORK_REQUEST_APPROVED', {
		requester_name,
		work_request_title,
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}

/**
 * 2. 새 견적 제안 알림 (의뢰인에게)
 */
export async function notify_proposal_received(phone, { requester_name, expert_name, work_request_title, work_request_id }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_PROPOSAL_RECEIVED || 'PROPOSAL_RECEIVED', {
		requester_name,
		expert_name,
		work_request_title,
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}

/**
 * 3. 입금 확인 알림 (전문가에게)
 */
export async function notify_payment_confirmed(phone, { expert_name, work_request_title, work_request_id, amount }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_PAYMENT_CONFIRMED || 'PAYMENT_CONFIRMED', {
		expert_name,
		work_request_title,
		amount: amount?.toLocaleString() || '0',
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}

/**
 * 4. 완료 요청 알림 (의뢰인에게)
 */
export async function notify_completion_requested(phone, { requester_name, expert_name, work_request_title, work_request_id }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_COMPLETION_REQUESTED || 'COMPLETION_REQUESTED', {
		requester_name,
		expert_name,
		work_request_title,
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}

/**
 * 5. 자동 완료 D-1 경고 알림 (의뢰인에게)
 */
export async function notify_auto_complete_warning(phone, { requester_name, expert_name, work_request_title, work_request_id }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_AUTO_COMPLETE_WARNING || 'AUTO_COMPLETE_WARNING', {
		requester_name,
		expert_name,
		work_request_title,
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}

/**
 * 6. 서비스 완료 알림 (전문가에게)
 */
export async function notify_service_completed(phone, { expert_name, work_request_title, work_request_id, payout }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_SERVICE_COMPLETED || 'SERVICE_COMPLETED', {
		expert_name,
		work_request_title,
		payout: payout?.toLocaleString() || '0',
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}

/**
 * 7. 리뷰 작성 알림 (전문가에게)
 */
export async function notify_review_received(phone, { expert_name, requester_name, work_request_title, rating }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_REVIEW_RECEIVED || 'REVIEW_RECEIVED', {
		expert_name,
		requester_name,
		work_request_title,
		rating: rating?.toString() || '5',
	});
}

/**
 * 8. 견적서 수정 알림 (의뢰인에게)
 */
export async function notify_proposal_updated(phone, { requester_name, expert_name, work_request_title, work_request_id }) {
	return send_alimtalk(phone, ALIMTALK_TEMPLATE_PROPOSAL_RECEIVED || 'PROPOSAL_UPDATED', {
		requester_name,
		expert_name,
		work_request_title,
		message: '견적서가 수정되었습니다.',
		url: `${BASE_URL}/work-request/${work_request_id}`,
	});
}
