import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase } }) => {
	const api = create_api(supabase);

	const [post_reports, comment_reports, user_reports, service_reports, community_reports] = await Promise.all([
		api.admin_reports.select_post_reports(),
		api.admin_reports.select_comment_reports(),
		api.admin_reports.select_user_reports(),
		api.admin_reports.select_service_reports(),
		api.admin_reports.select_community_reports(),
	]);

	return {
		post_reports: post_reports || [],
		comment_reports: comment_reports || [],
		user_reports: user_reports || [],
		service_reports: service_reports || [],
		community_reports: community_reports || [],
	};
};
