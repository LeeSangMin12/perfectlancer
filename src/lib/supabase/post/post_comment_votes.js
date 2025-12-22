/**
 * Post Comment Votes API - 댓글 투표 관리
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Post comment votes API methods
 */
export const create_post_comment_votes_api = (supabase) => ({
	/**
	 * 사용자의 댓글 투표 (토글 방식)
	 * @param {string} user_id - 사용자 ID
	 * @param {number} comment_id - 댓글 ID
	 * @param {number} vote - 투표 값 (1: 좋아요, -1: 싫어요)
	 * @returns {Promise<Object>} 투표 결과
	 */
	vote: async (user_id, comment_id, vote) => {
		const { data: existing } = await supabase
			.from('post_comment_votes')
			.select('value')
			.eq('user_id', user_id)
			.eq('comment_id', parseInt(comment_id, 10))
			.maybeSingle();

		if (existing && existing.value === vote) {
			// 같은 값으로 다시 투표하면 취소
			const { error } = await supabase
				.from('post_comment_votes')
				.delete()
				.eq('user_id', user_id)
				.eq('comment_id', parseInt(comment_id, 10));

			if (error) throw error;
			return { action: 'removed', value: 0 };
		} else {
			// 새 투표 또는 변경
			const { data, error } = await supabase
				.from('post_comment_votes')
				.upsert({
					user_id,
					comment_id: parseInt(comment_id, 10),
					value: vote,
					updated_at: new Date().toISOString()
				})
				.select()
				.single();

			if (error) throw error;
			return { action: existing ? 'updated' : 'created', value: data.value };
		}
	},

	/**
	 * 댓글 투표 upsert (래퍼)
	 * @param {Object} vote_data - { comment_id, user_id, vote }
	 */
	upsert: async (vote_data) => {
		const { comment_id, user_id, vote } = vote_data;

		const { data: existing } = await supabase
			.from('post_comment_votes')
			.select('value')
			.eq('user_id', user_id)
			.eq('comment_id', parseInt(comment_id, 10))
			.maybeSingle();

		if (existing && existing.value === vote) {
			const { error } = await supabase
				.from('post_comment_votes')
				.delete()
				.eq('user_id', user_id)
				.eq('comment_id', parseInt(comment_id, 10));

			if (error) throw new Error(`댓글 투표 삭제 실패: ${error.message}`);
			return { comment_id, user_id, vote: 0, action: 'removed' };
		} else {
			const { data, error } = await supabase
				.from('post_comment_votes')
				.upsert({
					user_id,
					comment_id: parseInt(comment_id, 10),
					value: vote,
					updated_at: new Date().toISOString()
				})
				.select()
				.single();

			if (error) throw new Error(`댓글 투표 업데이트 실패: ${error.message}`);
			return {
				comment_id,
				user_id,
				vote: data.value,
				action: existing ? 'updated' : 'created'
			};
		}
	},

	/**
	 * 댓글 투표 삭제
	 * @param {number} comment_id - 댓글 ID
	 * @param {string} user_id - 사용자 ID
	 */
	delete: async (comment_id, user_id) => {
		const { error } = await supabase
			.from('post_comment_votes')
			.delete()
			.eq('user_id', user_id)
			.eq('comment_id', parseInt(comment_id, 10));

		if (error) throw new Error(`댓글 투표 삭제 실패: ${error.message}`);
	},

	/**
	 * 사용자의 특정 댓글 투표 상태 조회
	 * @param {string} user_id - 사용자 ID
	 * @param {number} comment_id - 댓글 ID
	 * @returns {Promise<number|null>} 투표 값
	 */
	get_user_vote: async (user_id, comment_id) => {
		const { data, error } = await supabase
			.from('post_comment_votes')
			.select('value')
			.eq('user_id', user_id)
			.eq('comment_id', parseInt(comment_id, 10))
			.maybeSingle();

		if (error) throw error;
		return data?.value || null;
	},

	/**
	 * 여러 댓글에 대한 사용자 투표 상태 조회
	 * @param {string} user_id - 사용자 ID
	 * @param {Array<number>} comment_ids - 댓글 ID 배열
	 * @returns {Promise<Array>} 사용자 투표 상태
	 */
	get_user_votes: async (user_id, comment_ids) => {
		if (!user_id || !comment_ids || comment_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('post_comment_votes')
			.select('comment_id, value')
			.eq('user_id', user_id)
			.in('comment_id', comment_ids.map((id) => parseInt(id, 10)));

		if (error) throw error;

		return (data || []).map((vote) => ({
			target_id: vote.comment_id,
			value: vote.value
		}));
	},

	/**
	 * 여러 댓글의 투표 집계 조회
	 * @param {Array<number>} comment_ids - 댓글 ID 배열
	 * @returns {Promise<Array>} 투표 집계 결과
	 */
	get_vote_counts: async (comment_ids) => {
		if (!comment_ids || comment_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('post_comment_votes')
			.select('comment_id, value')
			.in('comment_id', comment_ids.map((id) => parseInt(id, 10)));

		if (error) throw error;

		const counts = {};
		data.forEach((vote) => {
			if (!counts[vote.comment_id]) {
				counts[vote.comment_id] = { like_count: 0, dislike_count: 0 };
			}
			if (vote.value === 1) {
				counts[vote.comment_id].like_count++;
			} else if (vote.value === -1) {
				counts[vote.comment_id].dislike_count++;
			}
		});

		return Object.entries(counts).map(([comment_id, c]) => ({
			target_id: parseInt(comment_id, 10),
			like_count: c.like_count,
			dislike_count: c.dislike_count
		}));
	}
});
