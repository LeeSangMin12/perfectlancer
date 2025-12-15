import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	try {
		const { user } = await parent();

		// 외주 공고 상세 정보 조회
		const work_request = await api.work_requests.select_by_id(parseInt(params.id));

		if (!work_request) {
			error(404, '외주 공고를 찾을 수 없습니다.');
		}

		// 제안서 목록 조회
		const proposals = await api.work_request_proposals.select_by_work_request_id(parseInt(params.id));

		return {
			work_request,
			proposals,
			user,
		};
	} catch (err) {
		console.error('Work request detail loading error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
