/**
 * Post Comment Reports API - 댓글 신고 관리
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Post comment reports API methods
 */
export const create_post_comment_reports_api = (supabase) => ({
	/**
	 * 댓글 신고하기
	 */
	create: async (reporter_id, comment_id, reason, details = null) => {
		const { data: existing } = await supabase
			.from('post_comment_reports')
			.select('id')
			.eq('reporter_id', reporter_id)
			.eq('comment_id', comment_id)
			.maybeSingle();

		if (existing) {
			throw new Error('이미 신고한 댓글입니다');
		}

		const { data, error } = await supabase
			.from('post_comment_reports')
			.insert({
				reporter_id,
				comment_id: parseInt(comment_id, 10),
				reason,
				details
			})
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	/**
	 * 댓글 신고 목록 조회 (관리자용)
	 */
	get_reports: async ({ resolved = null, limit = 50, offset = 0 } = {}) => {
		let query = supabase
			.from('post_comment_reports')
			.select(
				`
				id,
				reporter_id,
				comment_id,
				reason,
				details,
				resolved_at,
				resolved_by,
				created_at,
				post_comments!inner(id, content, user_id, post_id),
				reporter:reporter_id(id, name, handle, avatar_url)
			`
			)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (resolved === true) {
			query = query.not('resolved_at', 'is', null);
		} else if (resolved === false) {
			query = query.is('resolved_at', null);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},

	/**
	 * 특정 댓글에 대한 신고 목록 조회
	 */
	get_comment_reports: async (comment_id) => {
		const { data, error } = await supabase
			.from('post_comment_reports')
			.select(
				`
				id,
				reporter_id,
				reason,
				details,
				resolved_at,
				created_at,
				reporter:reporter_id(id, name, handle)
			`
			)
			.eq('comment_id', parseInt(comment_id, 10))
			.order('created_at', { ascending: false });

		if (error) throw error;
		return data || [];
	},

	/**
	 * 신고 처리 (관리자용)
	 */
	resolve: async (report_id, resolved_by) => {
		const { data, error } = await supabase
			.from('post_comment_reports')
			.update({
				resolved_at: new Date().toISOString(),
				resolved_by
			})
			.eq('id', report_id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	/**
	 * 신고 여부 확인
	 */
	is_reported: async (reporter_id, comment_id) => {
		const { data, error } = await supabase
			.from('post_comment_reports')
			.select('id')
			.eq('reporter_id', reporter_id)
			.eq('comment_id', parseInt(comment_id, 10))
			.maybeSingle();

		if (error) throw error;
		return !!data;
	},

	/**
	 * 사용자가 신고한 댓글 내역 조회
	 */
	get_user_reports: async (reporter_id, limit = 50, offset = 0) => {
		const { data, error } = await supabase
			.from('post_comment_reports')
			.select(
				`
				id,
				comment_id,
				reason,
				details,
				resolved_at,
				created_at,
				post_comments!inner(id, content, post_id, user_id)
			`
			)
			.eq('reporter_id', reporter_id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;
		return data || [];
	}
});
