/**
 * Post bookmarks API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Post bookmarks API methods
 */
export const create_post_bookmarks_api = (supabase) => {
	return {
		/**
		 * 북마크 토글 (추가/삭제)
		 * @param {string|number} post_id - Post ID
		 * @param {string} user_id - User ID
		 * @returns {Promise<{action: 'added' | 'removed', bookmarked: boolean}>}
		 */
		toggle: async (post_id, user_id) => {
			const { data: existing } = await supabase
				.from('post_bookmarks')
				.select('id')
				.eq('user_id', user_id)
				.eq('post_id', parseInt(post_id))
				.maybeSingle();

			if (existing) {
				const { error } = await supabase
					.from('post_bookmarks')
					.delete()
					.eq('id', existing.id);

				if (error) throw error;
				return { action: 'removed', bookmarked: false };
			} else {
				const { error } = await supabase
					.from('post_bookmarks')
					.insert({ user_id, post_id: parseInt(post_id) });

				if (error) throw error;
				return { action: 'added', bookmarked: true };
			}
		},

		/**
		 * 북마크 추가
		 * @param {string|number} post_id - Post ID
		 * @param {string} user_id - User ID
		 */
		insert: async (post_id, user_id) => {
			const { data: existing } = await supabase
				.from('post_bookmarks')
				.select('id')
				.eq('user_id', user_id)
				.eq('post_id', parseInt(post_id))
				.maybeSingle();

			if (existing) return; // 이미 북마크됨

			const { error } = await supabase
				.from('post_bookmarks')
				.insert({ user_id, post_id: parseInt(post_id) });

			if (error) throw new Error(`Failed to insert: ${error.message}`);
		},

		/**
		 * 북마크 삭제
		 * @param {string|number} post_id - Post ID
		 * @param {string} user_id - User ID
		 */
		delete: async (post_id, user_id) => {
			const { error } = await supabase
				.from('post_bookmarks')
				.delete()
				.eq('user_id', user_id)
				.eq('post_id', parseInt(post_id));

			if (error) throw new Error(`Failed to delete: ${error.message}`);
		},

		/**
		 * 사용자의 모든 북마크 조회 (게시물 상세 포함)
		 * @param {string} user_id - User ID
		 * @returns {Promise<Array>} Array of bookmarks with full post data
		 */
		select_by_user_id: async (user_id) => {
			const { data, error } = await supabase
				.from('post_bookmarks')
				.select(`
					id,
					post_id,
					created_at,
					posts:post_id(
						id,
						title,
						content,
						images,
						like_count,
						created_at,
						users:author_id(id, handle, name, avatar_url),
						communities:community_id(id, title, slug),
						post_comments(count)
					)
				`)
				.eq('user_id', user_id)
				.order('created_at', { ascending: false });

			if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);

			return (data || []).map(bookmark => ({
				...bookmark,
				post: bookmark.posts
			}));
		},

		/**
		 * 사용자의 북마크 ID 목록만 조회 (경량)
		 * @param {string} user_id - User ID
		 * @returns {Promise<Array<{post_id: string, user_id: string}>>}
		 */
		select_by_user_id_lightweight: async (user_id) => {
			if (!user_id) return [];

			const { data, error } = await supabase
				.from('post_bookmarks')
				.select('post_id')
				.eq('user_id', user_id);

			if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);

			return (data || []).map(bookmark => ({
				post_id: bookmark.post_id.toString(),
				user_id: user_id
			}));
		},

		/**
		 * 특정 게시물들에 대한 사용자 북마크 상태 조회
		 * @param {string} user_id - User ID
		 * @param {Array<string|number>} post_ids - Array of post IDs
		 * @returns {Promise<Array<{post_id: string, user_id: string}>>}
		 */
		select_by_post_ids: async (user_id, post_ids) => {
			if (!user_id || !post_ids || post_ids.length === 0) return [];

			const { data, error } = await supabase
				.from('post_bookmarks')
				.select('post_id')
				.eq('user_id', user_id)
				.in('post_id', post_ids.map(id => parseInt(id)));

			if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);

			return (data || []).map(bookmark => ({
				post_id: bookmark.post_id.toString(),
				user_id: user_id
			}));
		},

		/**
		 * 북마크 여부 확인
		 * @param {string} user_id - User ID
		 * @param {string|number} post_id - Post ID
		 * @returns {Promise<boolean>}
		 */
		is_bookmarked: async (user_id, post_id) => {
			const { data, error } = await supabase
				.from('post_bookmarks')
				.select('id')
				.eq('user_id', user_id)
				.eq('post_id', parseInt(post_id))
				.maybeSingle();

			if (error) throw error;
			return !!data;
		}
	};
};
