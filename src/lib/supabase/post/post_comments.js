import { create_post_comment_votes_api } from '$lib/supabase/post/post_comment_votes';

export const create_post_comments_api = (supabase) => {
	const post_comment_votes = create_post_comment_votes_api(supabase);

	return {
		select_by_post_id: async (post_id, user_id) => {
			const { data, error } = await supabase
				.from('post_comments')
				.select(
					'id, content, created_at, updated_at, user_id, post_id, parent_comment_id, gift_amount, users:user_id(id, handle, name, avatar_url)'
				)
				.eq('post_id', post_id)
				.order('id', { ascending: true });

			if (error) {
				throw new Error(`Failed to select_by_post_id: ${error.message}`);
			}

			// 댓글 ID들 추출
			const comment_ids = data.map((comment) => comment.id);

			// 투표 데이터 조회
			const [vote_counts, user_votes] = await Promise.all([
				post_comment_votes.get_vote_counts(comment_ids),
				user_id ? post_comment_votes.get_user_votes(user_id, comment_ids) : Promise.resolve([])
			]);

			// 사용자 투표를 ID별로 매핑
			const user_vote_map = {};
			user_votes.forEach((vote) => {
				user_vote_map[vote.target_id] = vote.value;
			});

			// 데이터를 트리 구조로 재구성
			const comments_with_votes = data.map((comment) => {
				const counts = vote_counts[comment.id] || { like_count: 0, dislike_count: 0 };
				const user_vote = user_vote_map[comment.id] || 0;
				return {
					...comment,
					upvotes: counts.like_count,
					downvotes: counts.dislike_count,
					user_vote
				};
			});

			const comments_by_id = {};
			const root_comments = [];

			for (const comment of comments_with_votes) {
				comments_by_id[comment.id] = { ...comment, replies: [] };
			}

			for (const comment_id in comments_by_id) {
				const comment = comments_by_id[comment_id];
				if (comment.parent_comment_id && comments_by_id[comment.parent_comment_id]) {
					comments_by_id[comment.parent_comment_id].replies.push(comment);
				} else {
					root_comments.push(comment);
				}
			}

			return root_comments;
		},

		insert: async (comment_data) => {
			const { data, error } = await supabase
				.from('post_comments')
				.insert(comment_data)
				.select('*, users(id, handle, name, avatar_url)')
				.single();

			if (error) {
				throw new Error(`댓글 생성 실패: ${error.message}`);
			}

			return data;
		},

		update: async (comment_id, user_id, new_content) => {
			const { data, error } = await supabase
				.from('post_comments')
				.update({ content: new_content, updated_at: new Date() })
				.eq('id', comment_id)
				.eq('user_id', user_id)
				.select()
				.single();

			if (error) {
				throw new Error(`댓글 업데이트 실패: ${error.message}`);
			}
			return data;
		},

		delete: async (comment_id, user_id) => {
			const { error } = await supabase
				.from('post_comments')
				.delete()
				.eq('id', comment_id)
				.eq('user_id', user_id);

			if (error) {
				throw new Error(`댓글 삭제 실패: ${error.message}`);
			}
			return true;
		},

		// 특정 사용자가 작성한 댓글 조회
		select_by_user_id: async (user_id) => {
			const { data, error } = await supabase
				.from('post_comments')
				.select(
					`
					*,
					users:user_id(id, handle, name, avatar_url),
					post:post_id(
						id,
						title,
						content,
						users:author_id(id, handle, name)
					),
					parent_comment:parent_comment_id(
						id,
						content,
						users:user_id(id, handle, name)
					)
				`
				)
				.eq('user_id', user_id)
				.order('created_at', { ascending: false });

			if (error) {
				throw new Error(`Failed to select comments by user_id: ${error.message}`);
			}

			return data;
		}
	};
};
