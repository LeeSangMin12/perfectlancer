export const create_payments_api = (supabase) => ({
	// ===== 새 통합 payments 테이블 =====

	/**
	 * 결제 생성 (계좌이체 방식)
	 */
	insert: async (payment_data) => {
		const { data, error } = await supabase
			.from('payments')
			.insert({
				user_id: payment_data.user_id,
				amount: payment_data.amount,
				payment_type: payment_data.payment_type,
				reference_type: payment_data.reference_type,
				reference_id: payment_data.reference_id,
				payment_method: payment_data.payment_method || 'bank_transfer',
				status: 'pending',
				depositor_name: payment_data.depositor_name,
				depositor_bank: payment_data.depositor_bank,
				depositor_account_number: payment_data.depositor_account_number,
			})
			.select('*')
			.single();

		if (error) throw new Error(`결제 생성 실패: ${error.message}`);
		return data;
	},

	/**
	 * 결제 ID로 조회
	 */
	select_payment_by_id: async (id) => {
		const { data, error } = await supabase
			.from('payments')
			.select('*, user:user_id(id, name, handle, avatar_url)')
			.eq('id', id)
			.single();

		if (error) throw new Error(`결제 조회 실패: ${error.message}`);
		return data;
	},

	/**
	 * 참조로 결제 조회 (예: proposal_id로 조회)
	 */
	select_payment_by_reference: async (reference_type, reference_id) => {
		const { data, error } = await supabase
			.from('payments')
			.select('*, user:user_id(id, name, handle, avatar_url)')
			.eq('reference_type', reference_type)
			.eq('reference_id', reference_id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (error) throw new Error(`결제 조회 실패: ${error.message}`);
		return data;
	},

	/**
	 * 사용자 결제 목록 조회
	 */
	select_payments_by_user_id: async (user_id, status = null) => {
		let query = supabase
			.from('payments')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (status) {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error) throw new Error(`결제 목록 조회 실패: ${error.message}`);
		return data || [];
	},

	/**
	 * 결제 상태 업데이트
	 */
	update_payment_status: async (id, status, confirmed_by = null) => {
		const update_data = {
			status,
			updated_at: new Date().toISOString(),
		};

		if (status === 'confirmed') {
			update_data.confirmed_at = new Date().toISOString();
			if (confirmed_by) update_data.confirmed_by = confirmed_by;
		}

		const { data, error } = await supabase
			.from('payments')
			.update(update_data)
			.eq('id', id)
			.select('*')
			.single();

		if (error) throw new Error(`결제 상태 업데이트 실패: ${error.message}`);
		return data;
	},

	/**
	 * 제안 ID 목록으로 결제 조회
	 */
	select_by_proposal_ids: async (proposal_ids) => {
		const { data, error } = await supabase
			.from('payments')
			.select('*')
			.eq('reference_type', 'work_request_proposals')
			.in('reference_id', proposal_ids);

		if (error) throw new Error(`결제 조회 실패: ${error.message}`);
		return data || [];
	},

	/**
	 * 입금 대기 결제 목록 (관리자용)
	 */
	select_pending_payments: async (payment_type = null) => {
		let query = supabase
			.from('payments')
			.select('*')
			.eq('status', 'pending')
			.order('created_at', { ascending: true });

		if (payment_type) {
			query = query.eq('payment_type', payment_type);
		}

		const { data: payments, error } = await query;

		if (error) throw new Error(`대기 결제 조회 실패: ${error.message}`);
		if (!payments || payments.length === 0) return [];

		// 사용자 정보 조회
		const user_ids = [...new Set(payments.map((p) => p.user_id))];
		const { data: users } = await supabase
			.from('users')
			.select('id, name, handle, avatar_url, email')
			.in('id', user_ids);

		const user_map = (users || []).reduce((acc, u) => {
			acc[u.id] = u;
			return acc;
		}, {});

		return payments.map((p) => ({ ...p, user: user_map[p.user_id] || null }));
	},

	/**
	 * 전체 결제 목록 (관리자용)
	 */
	select_all_payments: async (payment_type = null, limit = 100) => {
		let query = supabase
			.from('payments')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (payment_type) {
			query = query.eq('payment_type', payment_type);
		}

		const { data: payments, error } = await query;

		if (error) throw new Error(`결제 목록 조회 실패: ${error.message}`);
		if (!payments || payments.length === 0) return [];

		// 사용자 정보 조회
		const user_ids = [...new Set(payments.map((p) => p.user_id))];
		const { data: users } = await supabase
			.from('users')
			.select('id, name, handle, avatar_url, email')
			.in('id', user_ids);

		const user_map = (users || []).reduce((acc, u) => {
			acc[u.id] = u;
			return acc;
		}, {});

		return payments.map((p) => ({ ...p, user: user_map[p.user_id] || null }));
	},

	/**
	 * 결제 확인 처리 (관리자)
	 */
	confirm_payment: async (payment_id, admin_id) => {
		const { data, error } = await supabase
			.from('payments')
			.update({
				status: 'confirmed',
				confirmed_at: new Date().toISOString(),
				confirmed_by: admin_id,
				updated_at: new Date().toISOString(),
			})
			.eq('id', payment_id)
			.select('*')
			.single();

		if (error) throw new Error(`결제 확인 실패: ${error.message}`);
		return data;
	},

	/**
	 * 결제 거절 처리 (관리자)
	 */
	reject_payment: async (payment_id, admin_id, reject_reason) => {
		const { data, error } = await supabase
			.from('payments')
			.update({
				status: 'rejected',
				admin_memo: reject_reason,
				confirmed_by: admin_id,
				updated_at: new Date().toISOString(),
			})
			.eq('id', payment_id)
			.select('*')
			.single();

		if (error) throw new Error(`결제 거절 실패: ${error.message}`);
		return data;
	},

	// ===== 기존 payment_transactions 테이블 (레거시) =====

	// 새 결제 거래 생성
	insert_transaction: async (transaction_data) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.insert(transaction_data)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to insert payment transaction: ${error.message}`);
		return data;
	},

	// ID로 거래 조회
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('id', id)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to select payment transaction by id: ${error.message}`);
		return data;
	},

	// merchant_uid로 거래 조회
	select_by_merchant_uid: async (merchant_uid) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('merchant_uid', merchant_uid)
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to select payment transaction by merchant_uid: ${error.message}`,
			);
		return data;
	},

	// imp_uid로 거래 조회
	select_by_imp_uid: async (imp_uid) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('imp_uid', imp_uid)
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to select payment transaction by imp_uid: ${error.message}`,
			);
		return data;
	},

	// 사용자 ID로 거래 조회
	select_by_user_id: async (user_id, status = null) => {
		let query = supabase
			.from('payment_transactions')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		// 상태 필터링
		if (status) {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select payment transactions by user id: ${error.message}`,
			);
		return data;
	},

	// 거래 상태 업데이트
	update_status: async (id, status_data) => {
		const update_payload = {
			...status_data,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('payment_transactions')
			.update(update_payload)
			.eq('id', id)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to update payment transaction: ${error.message}`);
		return data;
	},

	// merchant_uid로 상태 업데이트
	update_by_merchant_uid: async (merchant_uid, status_data) => {
		const update_payload = {
			...status_data,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('payment_transactions')
			.update(update_payload)
			.eq('merchant_uid', merchant_uid)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to update payment transaction: ${error.message}`);
		return data;
	},

	// 결제 취소/환불
	cancel_transaction: async (id, cancel_reason) => {
		const cancel_data = {
			status: 'cancelled',
			cancel_reason: cancel_reason,
			cancelled_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('payment_transactions')
			.update(cancel_data)
			.eq('id', id)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to cancel payment transaction: ${error.message}`);
		return data;
	},

	// 모든 거래 조회 (관리자용)
	select_all: async (limit = 50) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error)
			throw new Error(`Failed to select payment transactions: ${error.message}`);
		return data;
	},

	// 상태별 거래 조회
	select_by_status: async (status, user_id = null) => {
		let query = supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('status', status)
			.order('created_at', { ascending: false });

		// 특정 사용자의 거래만 조회
		if (user_id) {
			query = query.eq('user_id', user_id);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select payment transactions by status: ${error.message}`,
			);
		return data;
	},

	// 거래 통계 조회
	select_stats: async (user_id = null) => {
		let query = supabase.from('payment_transactions').select('status, amount');

		if (user_id) {
			query = query.eq('user_id', user_id);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(`Failed to select payment stats: ${error.message}`);

		// 통계 계산
		const stats = {
			total_count: data.length,
			completed_count: data.filter((t) => t.status === 'completed').length,
			pending_count: data.filter((t) => t.status === 'pending').length,
			cancelled_count: data.filter((t) => t.status === 'cancelled').length,
			refunded_count: data.filter((t) => t.status === 'refunded').length,
			total_amount: data
				.filter((t) => t.status === 'completed')
				.reduce((sum, t) => sum + t.amount, 0),
		};

		return stats;
	},
});
