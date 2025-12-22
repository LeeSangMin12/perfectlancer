/**
 * Post Votes API - 게시물 투표 관리
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Post votes API methods
 */
export const create_post_votes_api = (supabase) => ({
	/**
	 * 사용자의 게시물 투표
	 * @param {string} user_id - 사용자 ID
	 * @param {number} post_id - 게시물 ID
	 * @param {number} vote - 투표 값 (1: 좋아요, -1: 싫어요)
	 * @returns {Promise<Object>} 투표 결과
	 */
	vote: async (user_id, post_id, vote) => {
		const { data, error } = await supabase
			.from('post_votes')
			.upsert(
				{
					user_id,
					post_id: parseInt(post_id, 10),
					value: vote,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'user_id, post_id' }
			)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	/**
	 * 투표 처리 (upsert or delete)
	 * @param {string} post_id - Post ID
	 * @param {string} user_id - User ID
	 * @param {number} new_vote - Vote value (1, -1, or 0)
	 */
	handle_vote: async (post_id, user_id, new_vote) => {
		if (new_vote === 0) {
			// 0이면 투표 취소
			const { data: existing } = await supabase
				.from('post_votes')
				.select('value')
				.eq('user_id', user_id)
				.eq('post_id', parseInt(post_id, 10))
				.maybeSingle();

			if (existing) {
				await supabase
					.from('post_votes')
					.delete()
					.eq('user_id', user_id)
					.eq('post_id', parseInt(post_id, 10));
			}
		} else {
			// 1 또는 -1로 투표
			await supabase
				.from('post_votes')
				.upsert(
					{
						user_id,
						post_id: parseInt(post_id, 10),
						value: new_vote,
						updated_at: new Date().toISOString()
					},
					{ onConflict: 'user_id, post_id' }
				);
		}
	},

	/**
	 * 사용자의 특정 게시물 투표 상태 조회
	 * @param {string} post_id - Post ID
	 * @param {string} user_id - User ID
	 * @returns {Promise<number>} Vote value (1, -1, or 0)
	 */
	get_user_vote: async (post_id, user_id) => {
		if (!user_id) return 0;

		const { data, error } = await supabase
			.from('post_votes')
			.select('value')
			.eq('user_id', user_id)
			.eq('post_id', parseInt(post_id, 10))
			.maybeSingle();

		if (error) throw error;
		return data?.value || 0;
	},

	/**
	 * 여러 게시물에 대한 사용자 투표 상태 조회
	 * @param {string} user_id - User ID
	 * @param {Array<string|number>} post_ids - Array of post IDs
	 * @returns {Promise<Array<{post_id: string, user_id: string, vote: number}>>}
	 */
	select_by_post_ids: async (user_id, post_ids) => {
		if (!user_id || !post_ids || post_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('post_votes')
			.select('post_id, value')
			.eq('user_id', user_id)
			.in('post_id', post_ids.map((id) => parseInt(id, 10)));

		if (error) throw error;

		return (data || []).map((vote) => ({
			post_id: vote.post_id.toString(),
			user_id: user_id,
			vote: vote.value
		}));
	},

	/**
	 * 여러 게시물의 투표 집계 조회
	 * @param {Array<number>} post_ids - 게시물 ID 배열
	 * @returns {Promise<Array>} 투표 집계 결과
	 */
	get_vote_counts: async (post_ids) => {
		if (!post_ids || post_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('post_votes')
			.select('post_id, value')
			.in('post_id', post_ids.map((id) => parseInt(id, 10)));

		if (error) throw error;

		// 집계 계산
		const counts = {};
		data.forEach((vote) => {
			if (!counts[vote.post_id]) {
				counts[vote.post_id] = { like_count: 0, dislike_count: 0 };
			}
			if (vote.value === 1) {
				counts[vote.post_id].like_count++;
			} else if (vote.value === -1) {
				counts[vote.post_id].dislike_count++;
			}
		});

		return Object.entries(counts).map(([post_id, c]) => ({
			target_id: parseInt(post_id, 10),
			like_count: c.like_count,
			dislike_count: c.dislike_count
		}));
	}
});
