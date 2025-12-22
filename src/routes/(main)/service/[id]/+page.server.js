import { create_api } from '$lib/supabase/api';

export async function load({ params, locals: { supabase } }) {
	const api = create_api(supabase);

	// 필수 데이터만 서버에서 로드 (페이지 렌더링에 즉시 필요한 것만)
	const [service, service_options] = await Promise.all([
		api.services.select_by_id(params.id),
		api.service_options.select_by_service_id(params.id)
	]);

	// 판매자 연락처 로드
	let seller_contact = null;
	if (service?.author_id) {
		seller_contact = await api.user_contacts.select_by_user_id(service.author_id);
	}

	return {
		service,
		service_options,
		seller_contact,
	};
}
