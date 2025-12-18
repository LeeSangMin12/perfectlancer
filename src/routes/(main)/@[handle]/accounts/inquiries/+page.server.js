export async function load({ locals: { supabase, session } }) {
	// 로그인하지 않은 경우 빈 데이터 반환
	if (!session?.user?.id) {
		return {
			received_inquiries: [],
			sent_inquiries: []
		};
	}

	try {
		// 받은 문의와 보낸 문의를 병렬로 조회
		const [received_result, sent_result] = await Promise.all([
			supabase
				.from('inquiries')
				.select(`
					*,
					sender:sender_id(id, name, handle, avatar_url)
				`)
				.eq('recipient_id', session.user.id)
				.order('created_at', { ascending: false }),

			supabase
				.from('inquiries')
				.select(`
					*,
					recipient:recipient_id(id, name, handle, avatar_url)
				`)
				.eq('sender_id', session.user.id)
				.order('created_at', { ascending: false })
		]);

		return {
			received_inquiries: received_result.data || [],
			sent_inquiries: sent_result.data || []
		};
	} catch (error) {
		console.error('Error loading inquiries:', error);
		return {
			received_inquiries: [],
			sent_inquiries: []
		};
	}
}
