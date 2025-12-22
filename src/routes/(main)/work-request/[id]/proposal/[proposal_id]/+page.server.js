import { create_api } from '$lib/supabase/api';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	try {
		const { user } = await parent();

		// 로그인 체크
		if (!user) {
			redirect(303, '/login');
		}

		// 외주 공고 상세 정보 조회
		const work_request = await api.work_requests.select_by_id(parseInt(params.id));

		if (!work_request) {
			error(404, '외주 공고를 찾을 수 없습니다.');
		}

		// 제안 조회
		const proposals = await api.work_request_proposals.select_by_work_request_id(parseInt(params.id));
		const proposal = proposals.find(p => p.id === parseInt(params.proposal_id));

		if (!proposal) {
			error(404, '제안을 찾을 수 없습니다.');
		}

		// 권한 체크: 의뢰인 또는 제안 작성자만 열람 가능
		const is_requester = work_request.requester_id === user.id;
		const is_proposal_author = proposal.expert_id === user.id;

		if (!is_requester && !is_proposal_author) {
			error(403, '이 제안을 볼 권한이 없습니다.');
		}

		return {
			work_request,
			proposal,
			user,
			is_requester,
		};
	} catch (err) {
		if (err.status === 303 || err.status === 404 || err.status === 403) throw err;
		console.error('Proposal page loading error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
