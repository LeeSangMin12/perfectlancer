/**
 * Work request bookmarks API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Work request bookmarks API methods
 */
export const create_work_request_bookmarks_api = (supabase) => {
	return {
		/**
		 * 북마크 토글 (추가/삭제)
		 * @param {string|number} work_request_id - Work request ID
		 * @param {string} user_id - User ID
		 * @returns {Promise<{action: 'added' | 'removed', bookmarked: boolean}>}
		 */
		toggle: async (work_request_id, user_id) => {
			const { data: existing } = await supabase
				.from('work_request_bookmarks')
				.select('id')
				.eq('user_id', user_id)
				.eq('work_request_id', parseInt(work_request_id))
				.maybeSingle();

			if (existing) {
				const { error } = await supabase
					.from('work_request_bookmarks')
					.delete()
					.eq('id', existing.id);

				if (error) throw error;
				return { action: 'removed', bookmarked: false };
			} else {
				const { error } = await supabase
					.from('work_request_bookmarks')
					.insert({ user_id, work_request_id: parseInt(work_request_id) });

				if (error) throw error;
				return { action: 'added', bookmarked: true };
			}
		},

		/**
		 * 북마크 추가
		 * @param {string|number} work_request_id - Work request ID
		 * @param {string} user_id - User ID
		 */
		insert: async (work_request_id, user_id) => {
			const { data: existing } = await supabase
				.from('work_request_bookmarks')
				.select('id')
				.eq('user_id', user_id)
				.eq('work_request_id', parseInt(work_request_id))
				.maybeSingle();

			if (existing) return; // 이미 북마크됨

			const { error } = await supabase
				.from('work_request_bookmarks')
				.insert({ user_id, work_request_id: parseInt(work_request_id) });

			if (error) throw new Error(`Failed to insert: ${error.message}`);
		},

		/**
		 * 북마크 삭제
		 * @param {string|number} work_request_id - Work request ID
		 * @param {string} user_id - User ID
		 */
		delete: async (work_request_id, user_id) => {
			const { error } = await supabase
				.from('work_request_bookmarks')
				.delete()
				.eq('user_id', user_id)
				.eq('work_request_id', parseInt(work_request_id));

			if (error) throw new Error(`Failed to delete: ${error.message}`);
		},

		/**
		 * 사용자의 모든 북마크 조회 (외주 공고 상세 포함)
		 * @param {string} user_id - User ID
		 * @returns {Promise<Array>} Array of bookmarks with full work request data
		 */
		select_by_user_id: async (user_id) => {
			const { data, error } = await supabase
				.from('work_request_bookmarks')
				.select(`
					id,
					work_request_id,
					created_at,
					work_request:work_request_id(
						id,
						title,
						description,
						category,
						reward_amount,
						price_unit,
						work_location,
						posting_end_date,
						status,
						created_at,
						users:requester_id(id, handle, name, avatar_url),
						work_request_proposals(count)
					)
				`)
				.eq('user_id', user_id)
				.order('created_at', { ascending: false });

			if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);

			return data || [];
		},

		/**
		 * 사용자의 북마크 ID 목록만 조회 (경량)
		 * @param {string} user_id - User ID
		 * @returns {Promise<Array<{work_request_id: string, user_id: string}>>}
		 */
		select_by_user_id_lightweight: async (user_id) => {
			if (!user_id) return [];

			const { data, error } = await supabase
				.from('work_request_bookmarks')
				.select('work_request_id')
				.eq('user_id', user_id);

			if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);

			return (data || []).map(bookmark => ({
				work_request_id: bookmark.work_request_id.toString(),
				user_id: user_id
			}));
		},

		/**
		 * 특정 외주 공고들에 대한 사용자 북마크 상태 조회
		 * @param {string} user_id - User ID
		 * @param {Array<string|number>} work_request_ids - Array of work request IDs
		 * @returns {Promise<Array<{work_request_id: string, user_id: string}>>}
		 */
		select_by_work_request_ids: async (user_id, work_request_ids) => {
			if (!user_id || !work_request_ids || work_request_ids.length === 0) return [];

			const { data, error } = await supabase
				.from('work_request_bookmarks')
				.select('work_request_id')
				.eq('user_id', user_id)
				.in('work_request_id', work_request_ids.map(id => parseInt(id)));

			if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);

			return (data || []).map(bookmark => ({
				work_request_id: bookmark.work_request_id.toString(),
				user_id: user_id
			}));
		},

		/**
		 * 북마크 여부 확인
		 * @param {string} user_id - User ID
		 * @param {string|number} work_request_id - Work request ID
		 * @returns {Promise<boolean>}
		 */
		is_bookmarked: async (user_id, work_request_id) => {
			const { data, error } = await supabase
				.from('work_request_bookmarks')
				.select('id')
				.eq('user_id', user_id)
				.eq('work_request_id', parseInt(work_request_id))
				.maybeSingle();

			if (error) throw error;
			return !!data;
		}
	};
};
