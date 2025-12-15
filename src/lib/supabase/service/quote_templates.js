/**
 * 견적서 템플릿 API
 * 전문가가 외주 견적서 템플릿을 작성/관리하는 기능
 */

export function create_quote_templates_api(supabase) {
	return {
		/**
		 * 사용자의 모든 견적서 템플릿 조회
		 * @param {string} user_id
		 */
		async select_by_user_id(user_id) {
			const { data, error } = await supabase
				.from('quote_templates')
				.select('*')
				.eq('user_id', user_id)
				.order('created_at', { ascending: false });

			if (error) throw error;
			return data;
		},

		/**
		 * 단일 견적서 템플릿 조회
		 * @param {number} id
		 */
		async select_by_id(id) {
			const { data, error } = await supabase
				.from('quote_templates')
				.select('*')
				.eq('id', id)
				.single();

			if (error) throw error;
			return data;
		},

		/**
		 * 견적서 템플릿 생성
		 * @param {object} template_data
		 */
		async insert(template_data) {
			const { data, error } = await supabase
				.from('quote_templates')
				.insert(template_data)
				.select()
				.single();

			if (error) throw error;
			return data;
		},

		/**
		 * 견적서 템플릿 수정
		 * @param {number} id
		 * @param {object} template_data
		 */
		async update(id, template_data) {
			const { data, error } = await supabase
				.from('quote_templates')
				.update(template_data)
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},

		/**
		 * 견적서 템플릿 삭제
		 * @param {number} id
		 */
		async delete(id) {
			const { error } = await supabase
				.from('quote_templates')
				.delete()
				.eq('id', id);

			if (error) throw error;
		},
	};
}
