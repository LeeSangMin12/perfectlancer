/**
 * Work Requests API
 * 외주/구인 공고 관련 CRUD
 */

// proposals join 쿼리 (상세 정보)
const PROPOSALS_DETAIL_SELECT = `
	work_request_proposals!work_request_id(
		id,
		expert_id,
		message,
		status,
		created_at,
		contact_info,
		proposed_amount,
		users:expert_id(id, handle, name, avatar_url)
	)
`;

// proposals join 쿼리 (개수만)
const PROPOSALS_COUNT_SELECT = `work_request_proposals!work_request_id(count)`;

// 공통 requester 정보
const REQUESTER_SELECT = `users:requester_id(id, handle, name, avatar_url)`;

export const create_work_requests_api = (supabase) => ({
	/**
	 * 전체 목록 조회 (관리자용)
	 */
	select_all: async () => {
		const { data, error } = await supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}, ${PROPOSALS_DETAIL_SELECT}`)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select work_requests: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * ID로 단건 조회
	 */
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}, ${PROPOSALS_DETAIL_SELECT}`)
			.eq('id', id)
			.is('deleted_at', null)
			.single();

		if (error) {
			throw new Error(`Failed to select work_request by id: ${error.message}`);
		}
		return data;
	},

	/**
	 * 카테고리별 목록 조회
	 */
	select_by_category: async (category) => {
		const { data, error } = await supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}, ${PROPOSALS_COUNT_SELECT}`)
			.eq('category', category)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(
				`Failed to select work_requests by category: ${error.message}`,
			);
		}
		return data || [];
	},

	/**
	 * 검색어로 목록 조회
	 */
	select_by_search: async (search_text) => {
		const sanitized_search = search_text.replace(/[%_\\]/g, '\\$&');

		const { data, error } = await supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}, ${PROPOSALS_COUNT_SELECT}`)
			.or(
				`title.ilike.%${sanitized_search}%,description.ilike.%${sanitized_search}%,category.ilike.%${sanitized_search}%`,
			)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(
				`Failed to select work_requests by search: ${error.message}`,
			);
		}
		return data || [];
	},

	/**
	 * 무한 스크롤 조회
	 */
	select_infinite_scroll: async (
		last_request_id,
		category = '',
		limit = 20,
		job_type = '',
	) => {
		const MAX_LIMIT = 50;
		const sanitized_limit = Math.min(
			Math.max(1, parseInt(limit) || 20),
			MAX_LIMIT,
		);

		// 한국 시간 기준 오늘 날짜
		const today = new Date().toLocaleDateString('sv-SE', {
			timeZone: 'Asia/Seoul',
		});

		let query = supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}, ${PROPOSALS_COUNT_SELECT}`)
			.eq('status', 'open')
			.is('deleted_at', null)
			.lte('posting_start_date', today)
			.gte('posting_end_date', today)
			.order('created_at', { ascending: false })
			.limit(sanitized_limit);

		if (category) {
			query = query.eq('category', category);
		}

		if (job_type) {
			query = query.eq('job_type', job_type);
		}

		if (last_request_id) {
			const last_id = parseInt(last_request_id);
			if (!isNaN(last_id) && last_id > 0) {
				query = query.lt('id', last_id);
			}
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(
				`Failed to select_infinite_scroll work_requests: ${error.message}`,
			);
		}

		const has_more = data?.length === sanitized_limit;

		return {
			data: data || [],
			has_more,
			next_cursor: data?.length > 0 ? data[data.length - 1].id : null,
		};
	},

	/**
	 * 요청자 ID로 목록 조회
	 */
	select_by_requester_id: async (requester_id) => {
		const { data, error } = await supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}, ${PROPOSALS_COUNT_SELECT}`)
			.eq('requester_id', requester_id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(
				`Failed to select work_requests by requester_id: ${error.message}`,
			);
		}
		return data || [];
	},

	/**
	 * 새 공고 생성
	 */
	insert: async (request_data, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		const insert_data = {
			requester_id: user_id,
			title: request_data.title,
			category: request_data.category,
			description: request_data.description,
			reward_amount: request_data.reward_amount,
			price_unit: request_data.price_unit || 'per_project',
			job_type: request_data.job_type || 'sidejob',
			posting_start_date: request_data.posting_start_date || null,
			posting_end_date: request_data.posting_end_date || null,
			work_start_date: request_data.work_start_date || null,
			work_end_date: request_data.work_end_date || null,
			max_applicants: request_data.max_applicants || null,
			work_location: request_data.work_location || null,
			status: 'pending_approval',
		};

		const { data, error } = await supabase
			.from('work_requests')
			.insert(insert_data)
			.select('id')
			.single();

		if (error) {
			if (error.code === '23505') {
				throw new Error('이미 동일한 요청이 존재합니다.');
			}
			throw new Error(`공고 생성 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 공고 수정
	 */
	update: async (request_id, request_data, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 소유권 및 상태 확인
		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.requester_id !== user_id) {
			throw new Error('자신의 공고만 수정할 수 있습니다.');
		}

		if (!['draft', 'open'].includes(existing.status)) {
			throw new Error('진행 중이거나 완료된 공고는 수정할 수 없습니다.');
		}

		const update_data = {
			title: request_data.title,
			category: request_data.category,
			description: request_data.description,
			reward_amount: request_data.reward_amount,
			price_unit: request_data.price_unit,
			job_type: request_data.job_type,
			posting_start_date: request_data.posting_start_date,
			posting_end_date: request_data.posting_end_date,
			work_start_date: request_data.work_start_date,
			work_end_date: request_data.work_end_date,
			max_applicants: request_data.max_applicants,
			work_location: request_data.work_location,
			updated_at: new Date().toISOString(),
		};

		// undefined 값 제거 (기존 값 유지)
		Object.keys(update_data).forEach((key) => {
			if (update_data[key] === undefined) {
				delete update_data[key];
			}
		});

		const { data, error } = await supabase
			.from('work_requests')
			.update(update_data)
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`공고 수정 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 공고 삭제 (soft delete)
	 */
	delete: async (request_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 소유권 및 상태 확인
		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.requester_id !== user_id) {
			throw new Error('자신의 공고만 삭제할 수 있습니다.');
		}

		if (existing.status === 'in_progress') {
			throw new Error('진행 중인 공고는 삭제할 수 없습니다.');
		}

		const { error } = await supabase
			.from('work_requests')
			.update({
				deleted_at: new Date().toISOString(),
				status: 'cancelled',
			})
			.eq('id', request_id);

		if (error) {
			throw new Error(`공고 삭제 실패: ${error.message}`);
		}
	},

	/**
	 * 공고 상태 변경
	 */
	update_status: async (request_id, status, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('requester_id')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.requester_id !== user_id) {
			throw new Error('자신의 공고만 수정할 수 있습니다.');
		}

		const update_data = {
			status,
			updated_at: new Date().toISOString(),
		};

		if (status === 'completed') {
			update_data.completed_at = new Date().toISOString();
		}

		const { data, error } = await supabase
			.from('work_requests')
			.update(update_data)
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`상태 변경 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 제안 수락 (다중 선택 가능)
	 */
	accept_proposal: async (request_id, proposal_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.requester_id !== user_id) {
			throw new Error('자신의 공고만 수정할 수 있습니다.');
		}

		if (!['open', 'in_progress'].includes(existing.status)) {
			throw new Error('모집중이거나 진행중인 공고만 제안을 수락할 수 있습니다.');
		}

		// 제안서 상태 업데이트
		const { data, error: proposal_error } = await supabase
			.from('work_request_proposals')
			.update({
				status: 'accepted',
				updated_at: new Date().toISOString(),
			})
			.eq('id', proposal_id)
			.eq('work_request_id', request_id)
			.select()
			.single();

		if (proposal_error) {
			throw new Error(`제안서 상태 업데이트 실패: ${proposal_error.message}`);
		}

		return data;
	},

	/**
	 * 공고 마감 (더 이상 제안 안 받음)
	 */
	close: async (request_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.requester_id !== user_id) {
			throw new Error('자신의 공고만 마감할 수 있습니다.');
		}

		if (existing.status !== 'open') {
			throw new Error('모집중인 공고만 마감할 수 있습니다.');
		}

		const { data, error } = await supabase
			.from('work_requests')
			.update({
				status: 'in_progress',
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`공고 마감 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 프로젝트 완료
	 */
	complete: async (request_id, user_id) => {
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.requester_id !== user_id) {
			throw new Error('자신의 공고만 완료할 수 있습니다.');
		}

		if (existing.status !== 'in_progress') {
			throw new Error('진행중인 공고만 완료할 수 있습니다.');
		}

		const { data, error } = await supabase
			.from('work_requests')
			.update({
				status: 'completed',
				completed_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`프로젝트 완료 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 승인 대기 중인 공고 목록 조회 (관리자용)
	 */
	select_pending_approval: async () => {
		const { data, error } = await supabase
			.from('work_requests')
			.select(`*, ${REQUESTER_SELECT}`)
			.eq('status', 'pending_approval')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select pending work_requests: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 공고 승인 (관리자)
	 */
	approve: async (request_id) => {
		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.status !== 'pending_approval') {
			throw new Error('승인 대기 중인 공고만 승인할 수 있습니다.');
		}

		const { data, error } = await supabase
			.from('work_requests')
			.update({
				status: 'open',
				approved_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`공고 승인 실패: ${error.message}`);
		}

		return data;
	},

	/**
	 * 공고 거절 (관리자)
	 */
	reject: async (request_id, reject_reason = null) => {
		const { data: existing, error: check_error } = await supabase
			.from('work_requests')
			.select('status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing) {
			throw new Error('공고를 찾을 수 없습니다.');
		}

		if (existing.status !== 'pending_approval') {
			throw new Error('승인 대기 중인 공고만 거절할 수 있습니다.');
		}

		const { data, error } = await supabase
			.from('work_requests')
			.update({
				status: 'rejected',
				reject_reason: reject_reason,
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`공고 거절 실패: ${error.message}`);
		}

		return data;
	},
});
