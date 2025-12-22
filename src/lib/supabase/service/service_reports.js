/**
 * Service Reports API - 서비스 신고 관리
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Service reports API methods
 */
export const create_service_reports_api = (supabase) => ({
	/**
	 * 서비스 신고하기
	 */
	create: async (reporter_id, service_id, reason, details = null) => {
		const { data: existing } = await supabase
			.from('service_reports')
			.select('id')
			.eq('reporter_id', reporter_id)
			.eq('service_id', service_id)
			.maybeSingle();

		if (existing) {
			throw new Error('이미 신고한 서비스입니다');
		}

		const { data, error } = await supabase
			.from('service_reports')
			.insert({
				reporter_id,
				service_id: parseInt(service_id, 10),
				reason,
				details
			})
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	/**
	 * 서비스 신고 목록 조회 (관리자용)
	 */
	get_reports: async ({ resolved = null, limit = 50, offset = 0 } = {}) => {
		let query = supabase
			.from('service_reports')
			.select(
				`
				id,
				reporter_id,
				service_id,
				reason,
				details,
				resolved_at,
				resolved_by,
				created_at,
				services!inner(id, title, content, author_id),
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
	 * 특정 서비스에 대한 신고 목록 조회
	 */
	get_service_reports: async (service_id) => {
		const { data, error } = await supabase
			.from('service_reports')
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
			.eq('service_id', parseInt(service_id, 10))
			.order('created_at', { ascending: false });

		if (error) throw error;
		return data || [];
	},

	/**
	 * 신고 처리 (관리자용)
	 */
	resolve: async (report_id, resolved_by) => {
		const { data, error } = await supabase
			.from('service_reports')
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
	is_reported: async (reporter_id, service_id) => {
		const { data, error } = await supabase
			.from('service_reports')
			.select('id')
			.eq('reporter_id', reporter_id)
			.eq('service_id', parseInt(service_id, 10))
			.maybeSingle();

		if (error) throw error;
		return !!data;
	},

	/**
	 * 사용자가 신고한 서비스 내역 조회
	 */
	get_user_reports: async (reporter_id, limit = 50, offset = 0) => {
		const { data, error } = await supabase
			.from('service_reports')
			.select(
				`
				id,
				service_id,
				reason,
				details,
				resolved_at,
				created_at,
				services!inner(id, title, author_id)
			`
			)
			.eq('reporter_id', reporter_id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;
		return data || [];
	}
});
