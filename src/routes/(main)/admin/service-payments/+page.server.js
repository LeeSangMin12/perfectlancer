import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	// 상위 레이아웃에서 이미 관리자 권한 체크됨

	const api = create_api(supabase);

	try {
		const orders = await api.service_orders.select_all();

		return {
			user,
			orders,
		};
	} catch (err) {
		console.error('Admin service payments page load error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
