import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';
import { notify_review_received } from '$lib/server/alimtalk_notification.js';

/**
 * 리뷰 작성 API
 * 전문가에게 알림톡 발송
 */
export async function POST({ params, request, locals }) {
	const user = await locals.get_user();
	if (!user) {
		error(401, '로그인이 필요합니다.');
	}

	const api = create_api(locals.supabase);
	const work_request_id = parseInt(params.id);
	const proposal_id = parseInt(params.proposal_id);

	try {
		const review_data = await request.json();

		// 1. 제안서 정보 조회
		const { data: proposal } = await locals.supabase
			.from('work_request_proposals')
			.select('expert_id')
			.eq('id', proposal_id)
			.single();

		if (!proposal) {
			error(404, '제안서를 찾을 수 없습니다.');
		}

		// 2. 리뷰 생성
		const review = await api.work_request_reviews.insert({
			work_request_id,
			proposal_id,
			reviewer_id: user.id,
			expert_id: proposal.expert_id,
			rating: review_data.rating,
			content: review_data.content,
		});

		// 3. 외주 공고 정보 조회
		const { data: work_request } = await locals.supabase
			.from('work_requests')
			.select('id, title')
			.eq('id', work_request_id)
			.single();

		// 4. 전문가 정보 조회
		const { data: expert } = await locals.supabase
			.from('users')
			.select('id, name, handle, phone')
			.eq('id', proposal.expert_id)
			.single();

		if (expert?.phone) {
			// 5. 전문가에게 알림톡 발송
			notify_review_received(expert.phone, {
				expert_name: expert.name || expert.handle,
				requester_name: user.name || user.handle,
				work_request_title: work_request?.title,
				rating: review_data.rating,
			}).catch((err) => console.error('알림톡 발송 실패:', err));
		}

		// 6. 인앱 알림 발송 (전문가에게)
		if (expert?.id) {
			try {
				await api.notifications.insert({
					recipient_id: expert.id,
					actor_id: user.id,
					type: 'work_request_review_created',
					resource_type: 'work_request_reviews',
					resource_id: review.id,
					payload: {
						title: work_request?.title,
						rating: review_data.rating,
					},
					link_url: `/work-request/${work_request?.id}`,
				});
			} catch (err) {
				console.error('인앱 알림 발송 실패:', err);
			}
		}

		return json({ success: true, data: review });
	} catch (err) {
		console.error('Review create error:', err);
		error(500, err.message || '리뷰 작성 중 오류가 발생했습니다.');
	}
}
