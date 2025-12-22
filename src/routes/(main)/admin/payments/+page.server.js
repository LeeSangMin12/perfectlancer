import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	const api = create_api(supabase);

	try {
		// 병렬로 대기 중인 결제와 최근 결제 조회
		const [pending_payments, all_payments] = await Promise.all([
			api.payments.select_pending_payments('proposal_acceptance'),
			api.payments.select_all_payments('proposal_acceptance', 100),
		]);

		return {
			user,
			pending_payments,
			all_payments,
		};
	} catch (err) {
		console.error('Admin payments page load error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
