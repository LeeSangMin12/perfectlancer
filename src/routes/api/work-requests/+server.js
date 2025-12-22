import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_work_request_created } from '$lib/server/slack_notification.js';

/**
 * 외주 공고 등록 API
 * Slack으로 관리자에게 알림 발송
 */
export async function POST({ request, locals }) {
	const user = await locals.get_user();
	if (!user) {
		error(401, '로그인이 필요합니다.');
	}

	const api = create_api(locals.supabase);

	try {
		const request_data = await request.json();

		// 1. 공고 생성
		const work_request = await api.work_requests.insert(request_data, user.id);

		// 2. 생성된 공고 상세 정보 조회
		const full_work_request = await api.work_requests.select_by_id(work_request.id);

		// 3. Slack으로 관리자에게 알림
		notify_work_request_created(full_work_request, {
			name: user.name,
			handle: user.handle,
		}).catch((err) => console.error('Slack 알림 발송 실패:', err));

		return json({ success: true, data: work_request });
	} catch (err) {
		console.error('Work request create error:', err);
		error(500, err.message || '공고 등록 중 오류가 발생했습니다.');
	}
}
