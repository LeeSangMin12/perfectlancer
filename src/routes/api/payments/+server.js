import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_payment_submitted } from '$lib/server/slack_notification.js';

/**
 * 결제 신청 API
 * Slack으로 관리자에게 입금 확인 요청 알림 발송
 */
export async function POST({ request, locals }) {
	const user = await locals.get_user();
	if (!user) {
		error(401, '로그인이 필요합니다.');
	}

	const api = create_api(locals.supabase);

	try {
		const payment_data = await request.json();

		// 1. 결제 생성
		const payment = await api.payments.insert({
			...payment_data,
			user_id: user.id,
		});

		// 2. 제안서 정보 조회 (외주 결제인 경우)
		if (payment_data.reference_type === 'work_request_proposals') {
			const { data: proposal } = await locals.supabase
				.from('work_request_proposals')
				.select(`
					*,
					work_request:work_request_id(id, title, requester_id),
					expert:expert_id(id, name, handle)
				`)
				.eq('id', payment_data.reference_id)
				.single();

			if (proposal) {
				// 3. Slack으로 관리자에게 알림
				notify_payment_submitted(
					payment,
					proposal.work_request || {},
					{ name: user.name, handle: user.handle },
					proposal.expert || {},
				).catch((err) => console.error('Slack 알림 발송 실패:', err));
			}
		}

		return json({ success: true, data: payment });
	} catch (err) {
		console.error('Payment create error:', err);
		error(500, err.message || '결제 신청 중 오류가 발생했습니다.');
	}
}
