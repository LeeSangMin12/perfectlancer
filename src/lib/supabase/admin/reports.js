/**
 * 관리자용 신고 관리 API
 */
export const create_admin_reports_api = (supabase) => ({
	/**
	 * 게시물 신고 목록 조회
	 */
	async select_post_reports({ is_resolved = null, limit = 100 } = {}) {
		let query = supabase
			.from('post_reports')
			.select(`
				*,
				reporter:reporter_id(id, name, handle, avatar_url),
				post:post_id(id, title, author_id, author:author_id(id, name, handle)),
				resolver:resolved_by(id, name, handle)
			`)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (is_resolved !== null) {
			query = query.eq('is_resolved', is_resolved);
		}

		const { data, error } = await query;

		if (error) {
			console.error('Error fetching post reports:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 커뮤니티 신고 목록 조회
	 */
	async select_community_reports({ is_resolved = null, limit = 100 } = {}) {
		let query = supabase
			.from('community_reports')
			.select(`
				*,
				reporter:reporter_id(id, name, handle, avatar_url),
				community:community_id(id, title, avatar_url, slug),
				resolver:resolved_by(id, name, handle)
			`)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (is_resolved !== null) {
			query = query.eq('is_resolved', is_resolved);
		}

		const { data, error } = await query;

		if (error) {
			console.error('Error fetching community reports:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 사용자 신고 목록 조회
	 */
	async select_user_reports({ is_resolved = null, limit = 100 } = {}) {
		let query = supabase
			.from('user_reports')
			.select(`
				*,
				reporter:reporter_id(id, name, handle, avatar_url),
				reported_user:user_id(id, name, handle, avatar_url),
				resolver:resolved_by(id, name, handle)
			`)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (is_resolved !== null) {
			query = query.eq('is_resolved', is_resolved);
		}

		const { data, error } = await query;

		if (error) {
			console.error('Error fetching user reports:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 게시물 신고 처리
	 */
	async resolve_post_report(id, resolved_by) {
		const { data, error } = await supabase
			.from('post_reports')
			.update({
				is_resolved: true,
				resolved_at: new Date().toISOString(),
				resolved_by,
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error resolving post report:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 커뮤니티 신고 처리
	 */
	async resolve_community_report(id, resolved_by) {
		const { data, error } = await supabase
			.from('community_reports')
			.update({
				is_resolved: true,
				resolved_at: new Date().toISOString(),
				resolved_by,
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error resolving community report:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 사용자 신고 처리
	 */
	async resolve_user_report(id, resolved_by) {
		const { data, error } = await supabase
			.from('user_reports')
			.update({
				is_resolved: true,
				resolved_at: new Date().toISOString(),
				resolved_by,
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error resolving user report:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 신고 통계 조회
	 */
	async get_stats() {
		const [post_reports, community_reports, user_reports] = await Promise.all([
			supabase.from('post_reports').select('is_resolved', { count: 'exact' }),
			supabase.from('community_reports').select('is_resolved', { count: 'exact' }),
			supabase.from('user_reports').select('is_resolved', { count: 'exact' }),
		]);

		const count_unresolved = (data) => data?.filter((r) => !r.is_resolved).length || 0;

		return {
			post: {
				total: post_reports.data?.length || 0,
				pending: count_unresolved(post_reports.data),
			},
			community: {
				total: community_reports.data?.length || 0,
				pending: count_unresolved(community_reports.data),
			},
			user: {
				total: user_reports.data?.length || 0,
				pending: count_unresolved(user_reports.data),
			},
		};
	},
});
