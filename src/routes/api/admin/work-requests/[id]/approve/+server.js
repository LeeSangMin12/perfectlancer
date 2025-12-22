import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_work_request_approved } from '$lib/server/alimtalk_notification.js';

export async function POST({ params, locals }) {
	const user = await locals.get_user();
	if (!user?.is_admin) {
		error(403, '관리자 권한이 필요합니다.');
	}

	const api = create_api(locals.supabase);
	const request_id = parseInt(params.id);

	try {
		// 1. 공고 승인
		const work_request = await api.work_requests.approve(request_id);

		// 2. 의뢰인 정보 조회
		const { data: requester } = await locals.supabase
			.from('users')
			.select('id, name, handle, phone')
			.eq('id', work_request.requester_id)
			.single();

		// 3. 의뢰인에게 알림톡 발송
		if (requester?.phone) {
			notify_work_request_approved(requester.phone, {
				requester_name: requester.name || requester.handle,
				work_request_title: work_request.title,
				work_request_id: work_request.id,
			}).catch((err) => console.error('알림톡 발송 실패:', err));
		}

		// 4. 인앱 알림 발송
		try {
			await api.notifications.insert({
				recipient_id: work_request.requester_id,
				type: 'work_request_approved',
				resource_type: 'work_request',
				resource_id: work_request.id,
				payload: {
					title: work_request.title,
				},
				link_url: `/work-request/${work_request.id}`,
			});
		} catch (err) {
			console.error('인앱 알림 발송 실패:', err);
		}

		return json({ success: true, data: work_request });
	} catch (err) {
		console.error('Work request approve error:', err);
		error(500, err.message || '승인 처리 중 오류가 발생했습니다.');
	}
}
