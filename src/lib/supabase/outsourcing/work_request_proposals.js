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
			attachment_url: proposal_data.attachment_url,
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
			attachment_url: proposal_data.attachment_url,
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
	 * 제안 수락
	 */
	accept: async (proposal_id, work_request_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 공고 소유권 확인
		const { data: request, error: request_error } = await supabase
			.from('work_requests')
			.select('requester_id, title, status')
			.eq('id', work_request_id)
			.single();

		if (request_error || !request) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (request.requester_id !== user_id) {
			throw new Error('자신의 공고만 수락할 수 있습니다.');
		}

		if (request.status !== 'open') {
			throw new Error('열린 공고만 제안을 수락할 수 있습니다.');
		}

		// 제안서 정보 조회
		const { data: proposal } = await supabase
			.from('work_request_proposals')
			.select('expert_id')
			.eq('id', proposal_id)
			.single();

		// 제안서 상태 업데이트
		const { error: proposal_error } = await supabase
			.from('work_request_proposals')
			.update({
				status: 'accepted',
				updated_at: new Date().toISOString(),
			})
			.eq('id', proposal_id);

		if (proposal_error) {
			throw new Error(`제안 수락 실패: ${proposal_error.message}`);
		}

		// 공고 상태 업데이트
		const { data, error } = await supabase
			.from('work_requests')
			.update({
				accepted_proposal_id: proposal_id,
				status: 'in_progress',
				updated_at: new Date().toISOString(),
			})
			.eq('id', work_request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`공고 상태 업데이트 실패: ${error.message}`);
		}

		// 전문가에게 알림 전송
		if (proposal?.expert_id) {
			await supabase.from('notifications').insert({
				recipient_id: proposal.expert_id,
				type: 'proposal_accepted',
				resource_type: 'work_request',
				resource_id: work_request_id,
				payload: { title: request.title },
				link_url: `/work-request/${work_request_id}`,
			});
		}

		return data;
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
});
