import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api.js';

export async function load({ locals, params, url }) {
	const { auth_user } = await locals.get_user();
	if (!auth_user) {
		redirect(303, '/login');
	}

	const api = create_api(locals.supabase);
	const proposal_id = url.searchParams.get('proposal_id');

	if (!proposal_id) {
		redirect(303, `/work-request/${params.id}`);
	}

	// 병렬 조회
	const [work_request, proposal, bank_accounts] = await Promise.all([
		api.work_requests.select_by_id(params.id),
		api.work_request_proposals.select_by_id(proposal_id),
		api.user_bank_accounts.select_by_user_id(auth_user.id),
	]);

	if (!work_request) {
		redirect(303, '/work-request');
	}

	// 공고 소유자인지 확인
	if (work_request.requester_id !== auth_user.id) {
		redirect(303, `/work-request/${params.id}`);
	}

	if (!proposal) {
		redirect(303, `/work-request/${params.id}`);
	}

	// pending 또는 accepted(결제 거절 후 재결제) 상태만 결제 가능
	if (proposal.status !== 'pending' && proposal.status !== 'accepted') {
		redirect(303, `/work-request/${params.id}`);
	}

	return {
		user: auth_user,
		work_request,
		proposal,
		bank_accounts,
	};
}
