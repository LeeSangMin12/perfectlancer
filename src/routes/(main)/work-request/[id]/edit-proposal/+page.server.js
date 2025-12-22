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

		// 내 제안 조회
		const proposals = await api.work_request_proposals.select_by_work_request_id(parseInt(params.id));
		const my_proposal = proposals.find(p => p.expert_id === user.id);

		if (!my_proposal) {
			redirect(303, `/work-request/${params.id}`);
		}

		// pending 상태가 아니면 수정 불가
		if (my_proposal.status !== 'pending') {
			redirect(303, `/work-request/${params.id}`);
		}

		// 내 견적서 템플릿 조회
		const my_templates = await api.quote_templates.select_by_user_id(user.id);

		return {
			work_request,
			my_proposal,
			my_templates,
			user,
		};
	} catch (err) {
		if (err.status === 303) throw err;
		console.error('Edit proposal page loading error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
