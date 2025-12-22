import { create_api } from '$lib/supabase/api';
import { redirect } from '@sveltejs/kit';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	if (!user) {
		redirect(302, '/auth');
	}

	const api = create_api(supabase);

	try {
		// 내가 등록한 외주 공고들 (내가 요청자인 경우)
		const my_requests = await api.work_requests.select_by_requester_id(user.id);

		// 내가 제안서를 제출한 공고들 (내가 전문가인 경우)
		const my_proposals = await api.work_request_proposals.select_by_expert_id(user.id);

		return {
			user,
			my_requests,
			my_proposals,
		};
	} catch (error) {
		console.error('Outsourcing accounts page load error:', error);
		return {
			user,
			my_requests: [],
			my_proposals: [],
		};
	}
}
