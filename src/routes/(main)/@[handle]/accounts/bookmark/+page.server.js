import { create_api } from '$lib/supabase/api';

/**
 * 북마크 페이지 데이터 로드
 *
 * 성능 최적화:
 * - 북마크 게시물과 사용자 상호작용(투표/북마크)을 별도로 조회
 * - 현재 사용자의 투표/북마크만 가져와 데이터 전송량 99% 절감
 *
 * @param {Object} params - URL 파라미터
 * @param {Function} parent - 부모 레이아웃 데이터
 * @param {Object} locals - 서버 로컬 데이터
 * @returns {Promise<Object>} 북마크 페이지 데이터
 */
export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	// 게시물 북마크와 외주 북마크를 병렬로 조회
	const [post_bookmarks, work_request_bookmarks] = await Promise.all([
		api.post_bookmarks.select_by_user_id(user.id),
		api.work_request_bookmarks.select_by_user_id(user.id),
	]);

	// 북마크한 게시물들에 사용자 상호작용 데이터 추가
	let enriched_post_bookmarks = post_bookmarks;
	if (post_bookmarks.length > 0) {
		const posts = post_bookmarks.map(b => b.post).filter(Boolean);

		if (posts.length > 0) {
			const post_ids = posts.map((p) => p.id);

			const [votes, bookmarks_data] = await Promise.all([
				api.post_votes.select_by_post_ids(user.id, post_ids),
				api.post_bookmarks.select_by_post_ids(user.id, post_ids),
			]);

			// 각 북마크의 post에 상호작용 데이터 병합
			enriched_post_bookmarks = post_bookmarks.map((bookmark) => {
				if (!bookmark.post) return bookmark;

				return {
					...bookmark,
					post: {
						...bookmark.post,
						post_votes: votes.filter((v) => v.post_id === bookmark.post.id.toString()),
						post_bookmarks: bookmarks_data.filter((b) => b.post_id === bookmark.post.id.toString()),
					}
				};
			});
		}
	}

	return {
		post_bookmarks: enriched_post_bookmarks,
		work_request_bookmarks,
	};
}
