import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	try {
		const { user } = await parent();

		// 7일 경과된 완료 요청 자동 처리
		await api.work_request_proposals.process_auto_completions(parseInt(params.id));

		// 외주 공고 상세 정보 조회
		const work_request = await api.work_requests.select_by_id(parseInt(params.id));

		if (!work_request) {
			error(404, '외주 공고를 찾을 수 없습니다.');
		}

		// 제안서 목록 조회
		const proposals = await api.work_request_proposals.select_by_work_request_id(parseInt(params.id));

		// 수락된 제안들의 결제 상태 조회
		const accepted_proposal_ids = proposals
			.filter((p) => p.status === 'accepted')
			.map((p) => p.id);

		// 완료된 제안들의 리뷰 조회
		const completed_proposal_ids = proposals
			.filter((p) => p.status === 'completed')
			.map((p) => p.id);

		let payment_statuses = {};
		let reviews = {};

		// 병렬 조회
		const [payments_result, reviews_result] = await Promise.all([
			accepted_proposal_ids.length > 0
				? api.payments.select_by_proposal_ids(accepted_proposal_ids)
				: [],
			completed_proposal_ids.length > 0
				? api.work_request_reviews.select_by_proposal_ids(completed_proposal_ids)
				: [],
		]);

		payment_statuses = payments_result.reduce((acc, p) => {
			acc[p.reference_id] = p.status;
			return acc;
		}, {});

		reviews = reviews_result.reduce((acc, r) => {
			acc[r.proposal_id] = r;
			return acc;
		}, {});

		return {
			work_request,
			proposals,
			payment_statuses,
			reviews,
			user,
		};
	} catch (err) {
		console.error('Work request detail loading error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
