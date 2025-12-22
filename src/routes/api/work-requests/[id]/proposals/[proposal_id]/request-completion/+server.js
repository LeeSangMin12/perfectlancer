import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_completion_requested } from '$lib/server/alimtalk_notification.js';

/**
 * 완료 요청 API (전문가)
 * 의뢰인에게 알림톡 발송
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
		// 1. 완료 요청 처리
		const proposal = await api.work_request_proposals.request_completion(proposal_id, user.id);

		// 2. 외주 공고 및 의뢰인 정보 조회
		const { data: work_request } = await locals.supabase
			.from('work_requests')
			.select(`
				id, title, requester_id,
				requester:requester_id(id, name, handle, phone)
			`)
			.eq('id', work_request_id)
			.single();

		if (work_request?.requester?.phone) {
			// 3. 의뢰인에게 알림톡 발송
			notify_completion_requested(work_request.requester.phone, {
				requester_name: work_request.requester.name || work_request.requester.handle,
				expert_name: user.name || user.handle,
				work_request_title: work_request.title,
				work_request_id: work_request.id,
			}).catch((err) => console.error('알림톡 발송 실패:', err));
		}

		// 4. 인앱 알림 발송
		if (work_request?.requester_id) {
			try {
				await api.notifications.insert({
					recipient_id: work_request.requester_id,
					actor_id: user.id,
					type: 'completion_requested',
					resource_type: 'work_request_proposals',
					resource_id: proposal.id,
					payload: {
						title: work_request.title,
						expert_name: user.name || user.handle,
					},
					link_url: `/work-request/${work_request.id}`,
				});
			} catch (err) {
				console.error('인앱 알림 발송 실패:', err);
			}
		}

		return json({ success: true, data: proposal });
	} catch (err) {
		console.error('Completion request error:', err);
		error(500, err.message || '완료 요청 처리 중 오류가 발생했습니다.');
	}
}
