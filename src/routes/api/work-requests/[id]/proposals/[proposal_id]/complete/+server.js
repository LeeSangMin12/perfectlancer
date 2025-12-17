import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_service_completed } from '$lib/server/alimtalk_notification.js';
import { notify_service_completed as notify_admin_service_completed } from '$lib/server/slack_notification.js';

/**
 * 서비스 완료 API (의뢰인)
 * 전문가에게 알림톡 발송, 관리자에게 Slack 알림
 */
export async function POST({ params, locals }) {
	const user = await locals.get_user();
	if (!user) {
		error(401, '로그인이 필요합니다.');
	}

	const api = create_api(locals.supabase);
	const work_request_id = parseInt(params.id);
	const proposal_id = parseInt(params.proposal_id);

	try {
		// 1. 서비스 완료 처리
		const proposal = await api.work_request_proposals.complete(proposal_id, user.id);

		// 2. 외주 공고 정보 조회
		const { data: work_request } = await locals.supabase
			.from('work_requests')
			.select('id, title')
			.eq('id', work_request_id)
			.single();

		// 3. 전문가 정보 조회
		const { data: expert } = await locals.supabase
			.from('users')
			.select('id, name, handle, phone')
			.eq('id', proposal.expert_id)
			.single();

		const payout = Math.floor(proposal.total_price * 0.9); // 10% 수수료 제외

		if (expert?.phone) {
			// 4. 전문가에게 알림톡 발송
			notify_service_completed(expert.phone, {
				expert_name: expert.name || expert.handle,
				work_request_title: work_request?.title,
				work_request_id: work_request?.id,
				payout,
			}).catch((err) => console.error('알림톡 발송 실패:', err));
		}

		// 5. 관리자에게 Slack 알림 (정산 처리 필요)
		notify_admin_service_completed(
			work_request,
			proposal,
			{ name: user.name, handle: user.handle },
			expert || {},
		).catch((err) => console.error('Slack 알림 발송 실패:', err));

		// 6. 인앱 알림 발송 (전문가에게)
		if (expert?.id) {
			try {
				await api.notifications.insert({
					recipient_id: expert.id,
					actor_id: user.id,
					type: 'proposal_completed',
					resource_type: 'work_request_proposals',
					resource_id: proposal.id,
					payload: {
						title: work_request?.title,
						payout,
					},
					link_url: `/work-request/${work_request?.id}`,
				});
			} catch (err) {
				console.error('인앱 알림 발송 실패:', err);
			}
		}

		return json({ success: true, data: proposal });
	} catch (err) {
		console.error('Service complete error:', err);
		error(500, err.message || '서비스 완료 처리 중 오류가 발생했습니다.');
	}
}
