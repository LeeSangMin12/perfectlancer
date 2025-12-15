import { create_api } from '$lib/supabase/api';
import { redirect, error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();

	if (!user) {
		redirect(303, '/login');
	}

	const api = create_api(supabase);

	try {
		const work_request = await api.work_requests.select_by_id(parseInt(params.id));

		if (!work_request) {
			error(404, '외주 공고를 찾을 수 없습니다.');
		}

		// 본인이 의뢰인인 경우만 접근 가능
		const is_requester = work_request.requester_id === user.id;

		if (!is_requester) {
			error(403, '접근 권한이 없습니다.');
		}

		// 수락된 제안 정보 가져오기
		let accepted_proposal = null;
		if (work_request.accepted_proposal_id) {
			accepted_proposal = await api.work_request_proposals.select_by_id(
				work_request.accepted_proposal_id
			);
		}

		return {
			work_request,
			accepted_proposal,
			is_requester,
		};
	} catch (err) {
		console.error('Work request detail loading error:', err);
		if (err.status) throw err;
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
