export const create_work_request_reviews_api = (supabase) => ({
	/**
	 * 리뷰 작성
	 */
	insert: async (review_data) => {
		const { data, error } = await supabase
			.from('work_request_reviews')
			.insert({
				work_request_id: review_data.work_request_id,
				proposal_id: review_data.proposal_id,
				reviewer_id: review_data.reviewer_id,
				expert_id: review_data.expert_id,
				rating: review_data.rating,
				content: review_data.content,
			})
			.select('*')
			.single();

		if (error) throw new Error(`리뷰 작성 실패: ${error.message}`);
		return data;
	},

	/**
	 * 제안 ID로 리뷰 조회
	 */
	select_by_proposal_id: async (proposal_id) => {
		const { data, error } = await supabase
			.from('work_request_reviews')
			.select('*, reviewer:reviewer_id(id, name, handle, avatar_url)')
			.eq('proposal_id', proposal_id)
			.maybeSingle();

		if (error) throw new Error(`리뷰 조회 실패: ${error.message}`);
		return data;
	},

	/**
	 * 제안 ID 목록으로 리뷰 조회
	 */
	select_by_proposal_ids: async (proposal_ids) => {
		if (!proposal_ids || proposal_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('work_request_reviews')
			.select('*, reviewer:reviewer_id(id, name, handle, avatar_url)')
			.in('proposal_id', proposal_ids);

		if (error) throw new Error(`리뷰 조회 실패: ${error.message}`);
		return data || [];
	},

	/**
	 * 전문가 ID로 리뷰 목록 조회
	 */
	select_by_expert_id: async (expert_id, limit = 10) => {
		const { data, error } = await supabase
			.from('work_request_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				work_request:work_request_id(id, title)
			`,
			)
			.eq('expert_id', expert_id)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) throw new Error(`리뷰 목록 조회 실패: ${error.message}`);
		return data || [];
	},

	/**
	 * 전문가 평균 별점 조회
	 */
	select_expert_rating: async (expert_id) => {
		const { data, error } = await supabase
			.from('work_request_reviews')
			.select('rating')
			.eq('expert_id', expert_id);

		if (error) throw new Error(`평점 조회 실패: ${error.message}`);

		if (!data || data.length === 0) {
			return { average: 0, count: 0 };
		}

		const sum = data.reduce((acc, r) => acc + r.rating, 0);
		return {
			average: Math.round((sum / data.length) * 10) / 10,
			count: data.length,
		};
	},

	/**
	 * 리뷰 수정
	 */
	update: async (id, update_data) => {
		const { data, error } = await supabase
			.from('work_request_reviews')
			.update({
				rating: update_data.rating,
				content: update_data.content,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.select('*')
			.single();

		if (error) throw new Error(`리뷰 수정 실패: ${error.message}`);
		return data;
	},

	/**
	 * 리뷰 삭제
	 */
	delete: async (id) => {
		const { error } = await supabase
			.from('work_request_reviews')
			.delete()
			.eq('id', id);

		if (error) throw new Error(`리뷰 삭제 실패: ${error.message}`);
		return true;
	},
});
