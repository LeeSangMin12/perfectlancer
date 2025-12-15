import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	// 상위 레이아웃에서 이미 관리자 권한 체크됨

	const api = create_api(supabase);

	try {
		// 병렬로 전체 공고와 승인 대기 공고 조회
		const [all_requests, pending_requests] = await Promise.all([
			api.work_requests.select_all(),
			api.work_requests.select_pending_approval(),
		]);

		return {
			user,
			all_requests,
			pending_requests,
		};
	} catch (err) {
		console.error('Admin page load error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
