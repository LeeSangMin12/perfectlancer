export const create_inquiries_api = (supabase) => ({
	/**
	 * 문의 생성
	 */
	async insert(inquiry_data) {
		const { data, error } = await supabase
			.from('inquiries')
			.insert([inquiry_data])
			.select('*')
			.single();

		if (error) {
			console.error('Error creating inquiry:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 특정 사용자가 받은 문의 조회
	 */
	async select_received(user_id) {
		const { data, error } = await supabase
			.from('inquiries')
			.select(`
				id, status, email, subject, content, created_at,
				sender:sender_id(id, name, handle, avatar_url)
			`)
			.eq('recipient_id', user_id)
			.order('id', { ascending: false });

		if (error) {
			console.error('Error fetching received inquiries:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 특정 사용자가 보낸 문의 조회
	 */
	async select_sent(user_id) {
		const { data, error } = await supabase
			.from('inquiries')
			.select(`
				id, status, email, subject, content, created_at,
				recipient:recipient_id(id, name, handle, avatar_url)
			`)
			.eq('sender_id', user_id)
			.order('id', { ascending: false });

		if (error) {
			console.error('Error fetching sent inquiries:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 문의 상태 업데이트
	 */
	async update_status(id, status) {
		const { data, error } = await supabase
			.from('inquiries')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select('*')
			.single();

		if (error) {
			console.error('Error updating inquiry status:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 특정 문의 조회
	 */
	async select_by_id(id) {
		const { data, error } = await supabase
			.from('inquiries')
			.select(`
				*,
				sender:sender_id(id, name, handle, avatar_url),
				recipient:recipient_id(id, name, handle, avatar_url)
			`)
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error fetching inquiry by id:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 문의 삭제
	 */
	async delete(id) {
		const { error } = await supabase
			.from('inquiries')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting inquiry:', error);
			throw error;
		}

		return true;
	}
});
