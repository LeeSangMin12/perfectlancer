import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_payment_confirmed } from '$lib/server/alimtalk_notification.js';

/**
 * 결제 확인 API (관리자)
 * 입금 확인 후 전문가에게 알림톡 발송
 */
export async function POST({ params, locals }) {
	const user = await locals.get_user();
	if (!user?.is_admin) {
		error(403, '관리자 권한이 필요합니다.');
	}

	const api = create_api(locals.supabase);
	const payment_id = parseInt(params.id);

	try {
		// 1. 결제 확인 처리
		const payment = await api.payments.confirm_payment(payment_id, user.id);

		// 2. 제안서 정보 조회 (proposal_acceptance인 경우)
		if (payment.reference_type === 'work_request_proposals') {
			const { data: proposal } = await locals.supabase
				.from('work_request_proposals')
				.select(`
					*,
					work_request:work_request_id(id, title, requester_id),
					expert:expert_id(id, name, handle, phone)
				`)
				.eq('id', payment.reference_id)
				.single();

			if (proposal?.expert?.phone) {
				// 3. 전문가에게 알림톡 발송
				notify_payment_confirmed(proposal.expert.phone, {
					expert_name: proposal.expert.name || proposal.expert.handle,
					work_request_title: proposal.work_request?.title,
					work_request_id: proposal.work_request?.id,
					amount: payment.amount,
				}).catch((err) => console.error('알림톡 발송 실패:', err));
			}

			// 4. 인앱 알림 발송 (전문가에게)
			if (proposal?.expert_id) {
				try {
					await api.notifications.insert({
						recipient_id: proposal.expert_id,
						actor_id: proposal.work_request?.requester_id,
						type: 'payment_confirmed',
						resource_type: 'work_request_proposals',
						resource_id: proposal.id,
						payload: {
							title: proposal.work_request?.title,
							amount: payment.amount,
						},
						link_url: `/work-request/${proposal.work_request?.id}`,
					});
				} catch (err) {
					console.error('인앱 알림 발송 실패:', err);
				}
			}
		}

		return json({ success: true, data: payment });
	} catch (err) {
		console.error('Payment confirm error:', err);
		error(500, err.message || '결제 확인 처리 중 오류가 발생했습니다.');
	}
}
