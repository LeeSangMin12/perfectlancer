import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	// 상위 레이아웃에서 이미 관리자 권한 체크됨

	const api = create_api(supabase);

	try {
		const [all_services, pending_services] = await Promise.all([
			api.services.select_all_for_admin(),
			api.services.select_pending(),
		]);

		return {
			user,
			all_services,
			pending_services,
		};
	} catch (err) {
		console.error('Admin services page load error:', err);
		error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
