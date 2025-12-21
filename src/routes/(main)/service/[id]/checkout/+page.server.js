import { create_api } from '$lib/supabase/api';

export async function load({ params, url, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const { user } = await parent();

	// 쿼리 파라미터에서 선택 정보 가져오기
	const quantity = parseInt(url.searchParams.get('quantity') || '1');
	const selected_option_ids = url.searchParams.get('options')
		? url.searchParams.get('options').split(',').map(id => parseInt(id))
		: [];

	// 병렬로 데이터 가져오기
	const [service, service_options, bank_accounts, user_contact] = await Promise.all([
		api.services.select_by_id(params.id),
		api.service_options.select_by_service_id(params.id),
		user ? api.user_bank_accounts.select_by_user_id(user.id) : [],
		user ? api.user_contacts.select_by_user_id(user.id) : null,
	]);

	const selected_options = service_options.filter(opt => selected_option_ids.includes(opt.id));

	return {
		service,
		quantity,
		selected_options,
		bank_accounts,
		user_contact,
	};
}
