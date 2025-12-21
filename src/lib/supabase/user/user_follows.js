/**
 * User Follows API - 팔로우 관계 관리
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} User follows API methods
 */
export const create_user_follows_api = (supabase) => ({
	/**
	 * 팔로우 토글 (팔로우/언팔로우)
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 팔로우 대상 사용자 ID
	 * @returns {Promise<Object>} { action: 'followed' | 'unfollowed', following: boolean }
	 */
	toggle: async (follower_id, following_id) => {
		if (follower_id === following_id) {
			throw new Error('자기 자신을 팔로우할 수 없습니다');
		}

		const { data: existing } = await supabase
			.from('user_follows')
			.select('id')
			.eq('follower_id', follower_id)
			.eq('following_id', following_id)
			.maybeSingle();

		if (existing) {
			const { error } = await supabase.from('user_follows').delete().eq('id', existing.id);

			if (error) throw error;
			return { action: 'unfollowed', following: false };
		} else {
			const { error } = await supabase.from('user_follows').insert({ follower_id, following_id });

			if (error) throw error;
			return { action: 'followed', following: true };
		}
	},

	/**
	 * 사용자 팔로우
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 팔로우 대상 사용자 ID
	 */
	follow: async (follower_id, following_id) => {
		if (follower_id === following_id) {
			throw new Error('자기 자신을 팔로우할 수 없습니다');
		}

		const { data: existing } = await supabase
			.from('user_follows')
			.select('id')
			.eq('follower_id', follower_id)
			.eq('following_id', following_id)
			.maybeSingle();

		if (!existing) {
			const { error } = await supabase.from('user_follows').insert({ follower_id, following_id });
			if (error) throw error;
		}
	},

	/**
	 * 사용자 언팔로우
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 언팔로우할 사용자 ID
	 */
	unfollow: async (follower_id, following_id) => {
		const { error } = await supabase
			.from('user_follows')
			.delete()
			.eq('follower_id', follower_id)
			.eq('following_id', following_id);

		if (error) throw error;
	},

	/**
	 * 팔로우 여부 확인
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 확인할 사용자 ID
	 * @returns {Promise<boolean>}
	 */
	is_following: async (follower_id, following_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('id')
			.eq('follower_id', follower_id)
			.eq('following_id', following_id)
			.maybeSingle();

		if (error) throw error;
		return !!data;
	},

	/**
	 * 팔로워 목록 조회 (나를 팔로우하는 사람들)
	 * @param {string} user_id - 사용자 ID
	 * @param {number} limit - 조회 개수
	 * @param {number} offset - 오프셋
	 * @returns {Promise<Array>}
	 */
	get_followers: async (user_id, limit = 50, offset = 0) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('follower_id, created_at')
			.eq('following_id', user_id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;
		return data || [];
	},

	/**
	 * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
	 * @param {string} user_id - 사용자 ID
	 * @param {number} limit - 조회 개수
	 * @param {number} offset - 오프셋
	 * @returns {Promise<Array>}
	 */
	get_following: async (user_id, limit = 50, offset = 0) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('following_id, created_at')
			.eq('follower_id', user_id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;
		return data || [];
	},

	/**
	 * 팔로워/팔로잉 수 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<{followers_count: number, following_count: number}>}
	 */
	get_follow_counts: async (user_id) => {
		const [followers_result, following_result] = await Promise.all([
			supabase
				.from('user_follows')
				.select('id', { count: 'exact', head: true })
				.eq('following_id', user_id),
			supabase
				.from('user_follows')
				.select('id', { count: 'exact', head: true })
				.eq('follower_id', user_id)
		]);

		if (followers_result.error) throw followers_result.error;
		if (following_result.error) throw following_result.error;

		return {
			followers_count: followers_result.count || 0,
			following_count: following_result.count || 0
		};
	},

	/**
	 * 사용자가 팔로우하는 목록 조회 (ID만)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array<{following_id: string}>>}
	 */
	select_user_follows: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('following_id')
			.eq('follower_id', user_id);

		if (error) throw error;
		return (data || []).map((f) => ({ following_id: f.following_id }));
	},

	/**
	 * 사용자를 팔로우하는 목록 조회 (ID만)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array<{follower_id: string}>>}
	 */
	select_user_followers: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('follower_id')
			.eq('following_id', user_id);

		if (error) throw error;
		return (data || []).map((f) => ({ follower_id: f.follower_id }));
	},

	/**
	 * 팔로워 수 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<number>}
	 */
	get_follower_count: async (user_id) => {
		const { count, error } = await supabase
			.from('user_follows')
			.select('id', { count: 'exact', head: true })
			.eq('following_id', user_id);

		if (error) throw error;
		return count || 0;
	},

	/**
	 * 팔로잉 수 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<number>}
	 */
	get_following_count: async (user_id) => {
		const { count, error } = await supabase
			.from('user_follows')
			.select('id', { count: 'exact', head: true })
			.eq('follower_id', user_id);

		if (error) throw error;
		return count || 0;
	},

	/**
	 * 팔로워 목록 조회 (사용자 정보 포함)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>}
	 */
	select_followers: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select(
				`
				follower_id,
				created_at,
				user:follower_id(id, handle, avatar_url)
			`
			)
			.eq('following_id', user_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to fetch followers: ${error.message}`);
		return data || [];
	},

	/**
	 * 팔로잉 목록 조회 (사용자 정보 포함)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>}
	 */
	select_followings: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select(
				`
				following_id,
				created_at,
				user:following_id(id, handle, avatar_url)
			`
			)
			.eq('follower_id', user_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to fetch followings: ${error.message}`);
		return data || [];
	},

	/**
	 * 여러 사용자의 팔로우 상태 일괄 조회
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {Array<string>} user_ids - 확인할 사용자 ID 배열
	 * @returns {Promise<Object>} { user_id: boolean, ... }
	 */
	get_follow_status: async (follower_id, user_ids) => {
		if (!Array.isArray(user_ids) || user_ids.length === 0) return {};

		const { data, error } = await supabase
			.from('user_follows')
			.select('following_id')
			.eq('follower_id', follower_id)
			.in('following_id', user_ids);

		if (error) throw error;

		const status = {};
		user_ids.forEach((id) => {
			status[id] = false;
		});
		data.forEach((follow) => {
			status[follow.following_id] = true;
		});

		return status;
	},

	/**
	 * 최근 팔로워 조회
	 * @param {string} user_id - 사용자 ID
	 * @param {number} limit - 조회 개수
	 * @returns {Promise<Array>}
	 */
	get_recent_followers: async (user_id, limit = 5) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('follower_id, created_at')
			.eq('following_id', user_id)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) throw error;
		return data || [];
	}
});
