/**
 * Work Request Proposals API
 * 외주 공고 제안서 관련 CRUD
 */

const EXPERT_SELECT = `users:expert_id(id, handle, name, avatar_url)`;

const WORK_REQUEST_SELECT = `
	work_requests:work_request_id(
		id,
		title,
		requester_id,
		status,
		reward_amount,
		category,
		max_applicants,
		work_location,
		posting_end_date,
		work_start_date,
		work_end_date,
		created_at,
		users:requester_id(id, handle, name, avatar_url)
	)
`;

export const create_work_request_proposals_api = (supabase) => ({
	/**
	 * 공고 ID로 제안서 목록 조회
	 */
	select_by_work_request_id: async (work_request_id) => {
		const { data, error } = await supabase
			.from('work_request_proposals')
			.select(`
				id, expert_id, message, proposed_amount, status, created_at, contact_info, attachment_url,
				quote_template_id, quote_data, completion_requested_at,
				${EXPERT_SELECT},
				work_requests:work_request_id(id, title)
			`)
			.eq('work_request_id', work_request_id)
			.order('id', { ascending: false });

		if (error) {
			throw new Error(`Failed to select proposals by work_request_id: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 전문가 ID로 제안서 목록 조회
	 */
	select_by_expert_id: async (expert_id) => {
		const { data, error } = await supabase
			.from('work_request_proposals')
			.select(`*, ${EXPERT_SELECT}, ${WORK_REQUEST_SELECT}`)
			.eq('expert_id', expert_id)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select proposals by expert_id: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * ID로 단건 조회
	 */
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('work_request_proposals')
			.select(`
				*,
				${EXPERT_SELECT},
				work_requests:work_request_id(id, title, requester_id)
			`)
			.eq('id', id)
			.single();

		if (error) {
			throw new Error(`Failed to select proposal by id: ${error.message}`);
		}
		return data;
	},

	/**
	 * 새 제안서 생성
	 */
	insert: async (proposal_data, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 공고가 존재하고 열린 상태인지 확인
		const { data: request_info, error: request_error } = await supabase
			.from('work_requests')
			.select('id, title, status, requester_id')
			.eq('id', proposal_data.work_request_id)
			.single();

		if (request_error || !request_info) {
			throw new Error('존재하지 않는 공고입니다.');
		}

		if (request_info.status !== 'open') {
			throw new Error('이미 마감된 공고입니다.');
		}

		// 자신의 공고에는 제안할 수 없음
		if (request_info.requester_id === user_id) {
			throw new Error('자신의 공고에는 제안할 수 없습니다.');
		}

		// 이미 제안했는지 확인
		const { data: existing_proposal } = await supabase
			.from('work_request_proposals')
			.select('id')
			.eq('work_request_id', proposal_data.work_request_id)
			.eq('expert_id', user_id)
			.maybeSingle();

		if (existing_proposal) {
			throw new Error('이미 해당 공고에 제안을 제출했습니다.');
		}

		const insert_data = {
			work_request_id: proposal_data.work_request_id,
			expert_id: user_id,
			message: proposal_data.message,
			proposed_amount: proposal_data.proposed_amount,
			contact_info: proposal_data.contact_info,
			quote_template_id: proposal_data.quote_template_id || null,
			quote_data: proposal_data.quote_data || null,
			status: 'pending',
		};

		const { data, error } = await supabase
			.from('work_request_proposals')
			.insert(insert_data)
			.select('id')
			.single();

		if (error) {
			if (error.code === '23505') {
				throw new Error('이미 해당 공고에 제안을 제출했습니다.');
			}
			throw new Error(`제안서 생성 실패: ${error.message}`);
		}

		// 의뢰인에게 알림 전송
		await supabase.from('notifications').insert({
			recipient_id: request_info.requester_id,
			actor_id: user_id,
			type: 'proposal_received',
			resource_type: 'work_request',
			resource_id: proposal_data.work_request_id,
			payload: { title: request_info.title },
			link_url: `/work-request/${proposal_data.work_request_id}`,
		});

		return data;
	},

	/**
	 * 제안서 수정
	 */
	update: async (proposal_id, proposal_data, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 소유권 확인
		const { data: existing, error: check_error } = await supabase
			.from('work_request_proposals')
			.select('expert_id, status')
			.eq('id', proposal_id)
			.single();

		if (check_error || !existing) {
			throw new Error('제안서를 찾을 수 없습니다.');
		}

		if (existing.expert_id !== user_id) {
			throw new Error('자신의 제안서만 수정할 수 있습니다.');
		}

		if (existing.status !== 'pending') {
			throw new Error('대기 중인 제안서만 수정할 수 있습니다.');
		}

		const update_data = {
			message: proposal_data.message,
			proposed_amount: proposal_data.proposed_amount,
			contact_info: proposal_data.contact_info,
			quote_template_id: proposal_data.quote_template_id,
			quote_data: proposal_data.quote_data,
			updated_at: new Date().toISOString(),
		};

		// undefined 값 제거
		Object.keys(update_data).forEach((key) => {
			if (update_data[key] === undefined) {
				delete update_data[key];
			}
		});

		const { data, error } = await supabase
			.from('work_request_proposals')
			.update(update_data)
			.eq('id', proposal_id)
			.select()
			.single();

		if (error) {
			throw new Error(`제안서 수정 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 제안서 삭제
	 */
	delete: async (proposal_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 소유권 확인
		const { data: existing, error: check_error } = await supabase
			.from('work_request_proposals')
			.select('expert_id, status')
			.eq('id', proposal_id)
			.single();

		if (check_error || !existing) {
			throw new Error('제안서를 찾을 수 없습니다.');
		}

		if (existing.expert_id !== user_id) {
			throw new Error('자신의 제안서만 삭제할 수 있습니다.');
		}

		const { error } = await supabase
			.from('work_request_proposals')
			.delete()
			.eq('id', proposal_id);

		if (error) {
			throw new Error(`제안서 삭제 실패: ${error.message}`);
		}
	},

	/**
	 * 결제 완료 처리
	 * - 제안서 상태를 pending → accepted로 변경
	 * - 공고 상태 업데이트
	 * - 모집 인원 도달 시 자동 마감
	 */
	complete_payment: async (proposal_id, work_request_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 제안서 정보 조회
		const { data: proposal, error: proposal_check } = await supabase
			.from('work_request_proposals')
			.select('expert_id, status, proposed_amount')
			.eq('id', proposal_id)
			.single();

		if (proposal_check || !proposal) {
			throw new Error('제안서를 찾을 수 없습니다.');
		}

		if (proposal.status !== 'pending') {
			throw new Error('대기 중인 제안서만 결제할 수 있습니다.');
		}

		// 공고 정보 조회
		const { data: request, error: request_error } = await supabase
			.from('work_requests')
			.select('requester_id, title, status, max_applicants')
			.eq('id', work_request_id)
			.single();

		if (request_error || !request) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (request.requester_id !== user_id) {
			throw new Error('자신의 공고만 처리할 수 있습니다.');
		}

		// 제안서 상태를 accepted로 변경
		const { error: update_error } = await supabase
			.from('work_request_proposals')
			.update({
				status: 'accepted',
				updated_at: new Date().toISOString(),
			})
			.eq('id', proposal_id);

		if (update_error) {
			throw new Error(`제안서 상태 업데이트 실패: ${update_error.message}`);
		}

		// 수락된 제안 수 확인
		const { count: accepted_count } = await supabase
			.from('work_request_proposals')
			.select('id', { count: 'exact', head: true })
			.eq('work_request_id', work_request_id)
			.eq('status', 'accepted');

		// 공고 상태 결정: max_applicants 도달 시 closed, 아니면 in_progress
		let new_status = 'in_progress';
		if (request.max_applicants && accepted_count >= request.max_applicants) {
			new_status = 'closed';
		}

		// 공고 상태 업데이트
		const { data, error } = await supabase
			.from('work_requests')
			.update({
				status: new_status,
				updated_at: new Date().toISOString(),
			})
			.eq('id', work_request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`공고 상태 업데이트 실패: ${error.message}`);
		}

		// 전문가에게 알림 전송
		if (proposal.expert_id) {
			await supabase.from('notifications').insert({
				recipient_id: proposal.expert_id,
				type: 'proposal_accepted',
				resource_type: 'work_request',
				resource_id: work_request_id,
				payload: { title: request.title },
				link_url: `/work-request/${work_request_id}`,
			});
		}

		return { work_request: data, auto_closed: new_status === 'closed' };
	},

	/**
	 * 제안 거절
	 */
	reject: async (proposal_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 제안서 정보 조회
		const { data: proposal, error: check_error } = await supabase
			.from('work_request_proposals')
			.select('work_request_id, work_requests:work_request_id(requester_id)')
			.eq('id', proposal_id)
			.single();

		if (check_error || !proposal) {
			throw new Error('제안서를 찾을 수 없습니다.');
		}

		if (proposal.work_requests?.requester_id !== user_id) {
			throw new Error('자신의 공고에 대한 제안만 거절할 수 있습니다.');
		}

		const { data, error } = await supabase
			.from('work_request_proposals')
			.update({
				status: 'rejected',
				updated_at: new Date().toISOString(),
			})
			.eq('id', proposal_id)
			.select()
			.single();

		if (error) {
			throw new Error(`제안 거절 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 제안 완료 처리 (의뢰인이 서비스 완료 확인)
	 * - proposal: accepted → completed
	 * - 모든 accepted proposal이 completed면 work_request도 completed
	 */
	complete_proposal: async (proposal_id, work_request_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 공고 소유자 확인
		const { data: request, error: request_error } = await supabase
			.from('work_requests')
			.select('requester_id, title, status')
			.eq('id', work_request_id)
			.single();

		if (request_error || !request) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (request.requester_id !== user_id) {
			throw new Error('자신의 공고만 완료 처리할 수 있습니다.');
		}

		// proposal 상태 확인
		const { data: proposal, error: proposal_check } = await supabase
			.from('work_request_proposals')
			.select('expert_id, status')
			.eq('id', proposal_id)
			.single();

		if (proposal_check || !proposal) {
			throw new Error('제안서를 찾을 수 없습니다.');
		}

		if (proposal.status !== 'accepted') {
			throw new Error('수락된 제안서만 완료 처리할 수 있습니다.');
		}

		// proposal 상태를 completed로 변경
		const { error: update_error } = await supabase
			.from('work_request_proposals')
			.update({
				status: 'completed',
				completed_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('id', proposal_id);

		if (update_error) {
			throw new Error(`제안 완료 처리 실패: ${update_error.message}`);
		}

		// 모든 accepted proposal이 completed인지 확인
		const { data: remaining_accepted } = await supabase
			.from('work_request_proposals')
			.select('id')
			.eq('work_request_id', work_request_id)
			.eq('status', 'accepted');

		// 남은 accepted가 없으면 work_request도 completed
		if (!remaining_accepted || remaining_accepted.length === 0) {
			await supabase
				.from('work_requests')
				.update({
					status: 'completed',
					updated_at: new Date().toISOString(),
				})
				.eq('id', work_request_id);
		}

		// 전문가에게 알림 전송
		if (proposal.expert_id) {
			await supabase.from('notifications').insert({
				recipient_id: proposal.expert_id,
				actor_id: user_id,
				type: 'proposal_completed',
				resource_type: 'work_request',
				resource_id: work_request_id,
				payload: { title: request.title },
				link_url: `/work-request/${work_request_id}`,
			});
		}

		return { success: true };
	},

	/**
	 * 전문가가 완료 요청 (7일 후 자동 완료)
	 */
	request_completion: async (proposal_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 제안서 정보 조회
		const { data: proposal, error: check_error } = await supabase
			.from('work_request_proposals')
			.select(`
				expert_id, status, completion_requested_at,
				work_requests:work_request_id(id, title, requester_id)
			`)
			.eq('id', proposal_id)
			.single();

		if (check_error || !proposal) {
			throw new Error('제안서를 찾을 수 없습니다.');
		}

		if (proposal.expert_id !== user_id) {
			throw new Error('자신의 제안서만 완료 요청할 수 있습니다.');
		}

		if (proposal.status !== 'accepted') {
			throw new Error('수락된 제안서만 완료 요청할 수 있습니다.');
		}

		if (proposal.completion_requested_at) {
			throw new Error('이미 완료 요청이 되었습니다.');
		}

		// 완료 요청 시간 기록
		const { data, error } = await supabase
			.from('work_request_proposals')
			.update({
				completion_requested_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('id', proposal_id)
			.select()
			.single();

		if (error) {
			throw new Error(`완료 요청 실패: ${error.message}`);
		}

		// 의뢰인에게 알림 전송
		if (proposal.work_requests?.requester_id) {
			await supabase.from('notifications').insert({
				recipient_id: proposal.work_requests.requester_id,
				actor_id: user_id,
				type: 'completion_requested',
				resource_type: 'work_request',
				resource_id: proposal.work_requests.id,
				payload: { title: proposal.work_requests.title },
				link_url: `/work-request/${proposal.work_requests.id}`,
			});
		}

		return data;
	},

	/**
	 * 자동 완료 처리 (7일 경과된 완료 요청)
	 * - 서버에서 페이지 로드 시 호출
	 */
	process_auto_completions: async (work_request_id) => {
		const seven_days_ago = new Date();
		seven_days_ago.setDate(seven_days_ago.getDate() - 7);

		// 7일 경과된 완료 요청 조회
		const { data: pending_completions, error: check_error } = await supabase
			.from('work_request_proposals')
			.select('id, expert_id, work_request_id')
			.eq('work_request_id', work_request_id)
			.eq('status', 'accepted')
			.not('completion_requested_at', 'is', null)
			.lt('completion_requested_at', seven_days_ago.toISOString());

		if (check_error || !pending_completions || pending_completions.length === 0) {
			return { processed: 0 };
		}

		// 공고 정보 조회
		const { data: request } = await supabase
			.from('work_requests')
			.select('requester_id, title')
			.eq('id', work_request_id)
			.single();

		let processed = 0;

		for (const proposal of pending_completions) {
			// 제안 완료 처리
			const { error: update_error } = await supabase
				.from('work_request_proposals')
				.update({
					status: 'completed',
					completed_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq('id', proposal.id);

			if (!update_error) {
				processed++;

				// 전문가에게 알림 전송
				await supabase.from('notifications').insert({
					recipient_id: proposal.expert_id,
					type: 'proposal_completed',
					resource_type: 'work_request',
					resource_id: work_request_id,
					payload: {
						title: request?.title,
						auto_completed: true
					},
					link_url: `/work-request/${work_request_id}`,
				});
			}
		}

		// 모든 accepted proposal이 completed인지 확인
		const { data: remaining_accepted } = await supabase
			.from('work_request_proposals')
			.select('id')
			.eq('work_request_id', work_request_id)
			.eq('status', 'accepted');

		// 남은 accepted가 없으면 work_request도 completed
		if (!remaining_accepted || remaining_accepted.length === 0) {
			await supabase
				.from('work_requests')
				.update({
					status: 'completed',
					completed_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq('id', work_request_id);
		}

		return { processed };
	},
});
