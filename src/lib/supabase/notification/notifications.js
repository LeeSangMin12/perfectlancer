export const create_notifications_api = (supabase) => ({
	insert: async ({
		recipient_id,
		actor_id = null,
		type,
		resource_type = null,
		resource_id = null,
		payload = null,
		link_url = null,
	}) => {
		// resource_id 타입에 따라 적절한 컬럼에 저장
		let resource_id_bigint = null;
		let resource_id_uuid = null;

		if (resource_id !== null && resource_id !== undefined) {
			if (typeof resource_id === 'number' || (typeof resource_id === 'string' && /^\d+$/.test(resource_id))) {
				// 숫자 또는 숫자 문자열인 경우 bigint 컬럼에
				resource_id_bigint = parseInt(resource_id, 10);
			} else if (typeof resource_id === 'string' && resource_id.includes('-')) {
				// UUID 형태인 경우 uuid 컬럼에
				resource_id_uuid = resource_id;
			}
		}

		// 1. 알림을 데이터베이스에 저장
		const { error } = await supabase.from('notifications').insert({
			recipient_id,
			actor_id,
			type,
			resource_type,
			resource_id_bigint,
			resource_id_uuid,
			payload,
			link_url,
		});

		if (error)
			throw new Error(`Failed to insert notification: ${error.message}`);

		// 푸시 알림은 notifications.server.js에서 처리 (서버 전용)
	},
	select_list: async (user_id, limit = 50) => {
		const { data, error } = await supabase
			.from('notifications')
			.select(
				`
                id, type, resource_type, resource_id_bigint, resource_id_uuid, payload, link_url, read_at, created_at,
                actor:actor_id(id, handle, name, avatar_url)
            `,
			)
			.eq('recipient_id', user_id)
			.order('id', { ascending: false })
			.limit(limit);

		if (error)
			throw new Error(`Failed to select notifications: ${error.message}`);
		
		// 클라이언트 호환성을 위해 resource_id 필드 복원
		const processedData = (data || []).map(notification => ({
			...notification,
			resource_id: notification.resource_id_bigint || notification.resource_id_uuid || null
		}));
		
		return processedData;
	},

	select_unread_count: async (user_id) => {
		const { count, error } = await supabase
			.from('notifications')
			.select('*', { count: 'exact', head: true })
			.eq('recipient_id', user_id)
			.is('read_at', null);

		if (error)
			throw new Error(`Failed to count unread notifications: ${error.message}`);
		return count ?? 0;
	},

	mark_as_read: async (id, user_id) => {
		const { error } = await supabase
			.from('notifications')
			.update({ read_at: new Date() })
			.eq('id', id)
			.eq('recipient_id', user_id);

		if (error)
			throw new Error(`Failed to mark notification as read: ${error.message}`);
	},

	mark_all_as_read: async (user_id) => {
		const { error } = await supabase
			.from('notifications')
			.update({ read_at: new Date() })
			.eq('recipient_id', user_id)
			.is('read_at', null);

		if (error) throw new Error(`Failed to mark all as read: ${error.message}`);
	},
});
