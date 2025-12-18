<script>
	import { invalidateAll } from '$app/navigation';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';

	import colors from '$lib/config/colors';
	import { comma, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	let pending_withdrawals = $state(data.pending_withdrawals || []);
	let all_withdrawals = $state(data.recent_withdrawals || []);

	// 현재 보기 모드
	let view_mode = $state('pending'); // 'pending' | 'all'

	// 모달 상태
	let is_reject_modal_open = $state(false);
	let is_approve_modal_open = $state(false);
	let selected_withdrawal = $state(null);
	let reject_reason = $state('');

	// 날짜 포맷
	const format_date = (date_string) => {
		if (!date_string) return '-';
		return new Date(date_string).toLocaleDateString('ko-KR', {
			year: '2-digit',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// 상태 텍스트
	const get_status_text = (status) => {
		const map = {
			pending: '대기중',
			approved: '승인됨',
			rejected: '거절됨',
		};
		return map[status] || status;
	};

	// 승인 모달 열기
	const open_approve_modal = (withdrawal) => {
		selected_withdrawal = withdrawal;
		is_approve_modal_open = true;
	};

	// 출금 요청 승인
	const handle_approve = async () => {
		if (!selected_withdrawal) return;

		try {
			await api.point_withdrawals.approve(selected_withdrawal.id, me.id);
			show_toast('출금 요청이 승인되었습니다.', 'success');

			is_approve_modal_open = false;

			// 데이터 업데이트
			pending_withdrawals = pending_withdrawals.filter((w) => w.id !== selected_withdrawal.id);
			all_withdrawals = all_withdrawals.map((w) =>
				w.id === selected_withdrawal.id ? { ...w, status: 'approved' } : w,
			);
			selected_withdrawal = null;
		} catch (error) {
			show_toast(error.message, 'error');
			console.error('출금 승인 실패:', error);
		}
	};

	// 거절 모달 열기
	const open_reject_modal = (withdrawal) => {
		selected_withdrawal = withdrawal;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 출금 요청 거절
	const handle_reject = async () => {
		if (!reject_reason.trim()) {
			show_toast('거절 사유를 입력해주세요.', 'error');
			return;
		}

		if (!selected_withdrawal) return;

		try {
			await api.point_withdrawals.reject(selected_withdrawal.id, me.id, reject_reason);
			show_toast('출금 요청이 거절되었습니다.', 'success');

			is_reject_modal_open = false;

			// 데이터 업데이트
			pending_withdrawals = pending_withdrawals.filter((w) => w.id !== selected_withdrawal.id);
			all_withdrawals = all_withdrawals.map((w) =>
				w.id === selected_withdrawal.id ? { ...w, status: 'rejected', reject_reason } : w,
			);
			selected_withdrawal = null;
			reject_reason = '';
		} catch (error) {
			show_toast(error.message, 'error');
			console.error('출금 거절 실패:', error);
		}
	};

	// 상태 렌더러
	class StatusRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('span');
			const status = params.value;
			const text = get_status_text(status);

			let bgColor = 'bg-gray-100';
			let textColor = 'text-gray-600';

			if (status === 'pending') {
				bgColor = 'bg-yellow-50';
				textColor = 'text-yellow-700';
			} else if (status === 'approved') {
				bgColor = 'bg-green-50';
				textColor = 'text-green-700';
			} else if (status === 'rejected') {
				bgColor = 'bg-red-50';
				textColor = 'text-red-700';
			}

			this.eGui.className = `px-2 py-0.5 text-xs rounded ${bgColor} ${textColor}`;
			this.eGui.textContent = text;
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 사용자 정보 렌더러
	class UserRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const user = params.data.users;
			this.eGui.innerHTML = `
				<div class="text-sm">
					<div class="font-medium text-gray-900">${user?.name || '알 수 없음'}</div>
					<div class="text-gray-500">@${user?.handle || '알 수 없음'}</div>
				</div>
			`;
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 금액 렌더러 (출금은 마이너스로 표시)
	class AmountRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('span');
			this.eGui.className = 'font-medium text-red-600';
			this.eGui.textContent = `-${comma(params.value)}원`;
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 계좌 정보 렌더러 (직접 필드 사용)
	class BankAccountRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const { bank, account_number, account_holder } = params.data;
			if (bank && account_number) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium">${bank}</div>
						<div class="text-gray-500">${account_number}</div>
						<div class="text-xs text-gray-400">${account_holder || ''}</div>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">계좌 정보 없음</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 액션 버튼 렌더러
	const createActionRenderer = (isPending) => {
		return class ActionRenderer {
			eGui;
			params;

			init(params) {
				this.params = params;
				this.eGui = document.createElement('div');
				this.eGui.className = 'flex items-center gap-2';

				if (isPending) {
					// 승인 버튼
					const approveBtn = document.createElement('button');
					approveBtn.className =
						'px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700';
					approveBtn.textContent = '승인';
					approveBtn.onclick = () => open_approve_modal(params.data);

					// 거절 버튼
					const rejectBtn = document.createElement('button');
					rejectBtn.className =
						'px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100';
					rejectBtn.textContent = '거절';
					rejectBtn.onclick = () => open_reject_modal(params.data);

					this.eGui.appendChild(approveBtn);
					this.eGui.appendChild(rejectBtn);
				}
			}

			getGui() {
				return this.eGui;
			}

			refresh() {
				return false;
			}
		};
	};

	// 승인 대기 컬럼 정의
	const pending_column_defs = [
		{
			headerName: '사용자',
			cellRenderer: UserRenderer,
			flex: 1,
			minWidth: 140,
		},
		{
			headerName: '출금 금액',
			field: 'amount',
			cellRenderer: AmountRenderer,
			width: 130,
		},
		{
			headerName: '출금 계좌',
			cellRenderer: BankAccountRenderer,
			flex: 1,
			minWidth: 180,
		},
		{
			headerName: '요청일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 150,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer(true),
			width: 140,
			sortable: false,
			filter: false,
		},
	];

	// 전체 내역 컬럼 정의
	const all_column_defs = [
		{
			headerName: '사용자',
			cellRenderer: UserRenderer,
			flex: 1,
			minWidth: 140,
		},
		{
			headerName: '출금 금액',
			field: 'amount',
			cellRenderer: AmountRenderer,
			width: 130,
		},
		{
			headerName: '출금 계좌',
			cellRenderer: BankAccountRenderer,
			flex: 1,
			minWidth: 180,
		},
		{
			headerName: '상태',
			field: 'status',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '요청일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 150,
		},
		{
			headerName: '거절 사유',
			field: 'reject_reason',
			valueFormatter: (params) => params.value || '-',
			flex: 1,
			minWidth: 150,
		},
	];

	// 현재 데이터 및 컬럼
	let current_data = $derived(view_mode === 'pending' ? pending_withdrawals : all_withdrawals);
	let current_columns = $derived(view_mode === 'pending' ? pending_column_defs : all_column_defs);
</script>

<svelte:head>
	<title>포인트 출금 관리 | 관리자</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">포인트 출금 관리</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-white px-6 py-6">
	<!-- 통계 -->
	<div class="mb-6 flex gap-4">
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">승인 대기</p>
			<p class="text-xl font-semibold">
				{pending_withdrawals.length}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">대기 금액</p>
			<p class="text-xl font-semibold">
				{comma(pending_withdrawals.reduce((sum, w) => sum + w.amount, 0))}<span
					class="text-sm font-normal text-gray-400">원</span
				>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">전체 내역</p>
			<p class="text-xl font-semibold">
				{all_withdrawals.length}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
	</div>

	<!-- 탭 -->
	<div class="mb-4 flex gap-1 rounded-lg bg-gray-200 p-1">
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode ===
			'pending'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'pending')}
		>
			승인 대기 ({pending_withdrawals.length})
		</button>
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode === 'all'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'all')}
		>
			전체 내역 ({all_withdrawals.length})
		</button>
	</div>

	<!-- ag-grid 테이블 -->
	<div class="rounded-lg border border-gray-200 bg-white">
		{#if current_data.length === 0}
			<div class="py-16 text-center text-gray-400">
				{view_mode === 'pending' ? '승인 대기 중인 출금 요청이 없습니다.' : '출금 내역이 없습니다.'}
			</div>
		{:else}
			{#key view_mode}
				<AgGrid
					rowData={current_data}
					columnDefs={current_columns}
					pagination={true}
					paginationPageSize={20}
					getRowId={(params) => params.data.id}
				/>
			{/key}
		{/if}
	</div>
</main>

<!-- 승인 확인 모달 -->
<Modal bind:is_modal_open={is_approve_modal_open} modal_position="center">
	<div class="p-5">
		<h3 class="mb-4 font-semibold text-gray-900">출금 요청 승인</h3>
		{#if selected_withdrawal}
			<div class="rounded-lg bg-gray-50 p-3">
				<p class="text-sm font-medium text-gray-900">
					{selected_withdrawal.users?.name}님
				</p>
				<p class="mt-1 text-lg font-semibold text-red-600">
					-{comma(selected_withdrawal.amount)}원
				</p>
				{#if selected_withdrawal.bank && selected_withdrawal.account_number}
					<div class="mt-2 border-t pt-2">
						<p class="text-sm text-gray-600">
							{selected_withdrawal.bank}
						</p>
						<p class="text-sm text-gray-600">
							{selected_withdrawal.account_number}
						</p>
						<p class="text-sm text-gray-500">
							예금주: {selected_withdrawal.account_holder}
						</p>
					</div>
				{/if}
			</div>
			<p class="mt-3 text-xs text-gray-500">
				승인 시 위 계좌로 직접 송금해주세요.
			</p>
		{/if}
		<div class="mt-4 flex gap-2">
			<button class="btn btn-secondary flex-1" onclick={() => (is_approve_modal_open = false)}>
				취소
			</button>
			<button class="btn btn-primary flex-1" onclick={handle_approve}> 승인 </button>
		</div>
	</div>
</Modal>

<!-- 거절 모달 -->
<Modal bind:is_modal_open={is_reject_modal_open} modal_position="center">
	<div class="p-5">
		<h3 class="mb-4 font-semibold text-gray-900">출금 요청 거절</h3>
		{#if selected_withdrawal}
			<p class="mb-3 text-sm text-gray-500">
				{selected_withdrawal.users?.name}님 · {comma(selected_withdrawal.amount)}원
			</p>
		{/if}
		<textarea
			bind:value={reject_reason}
			rows="3"
			placeholder="거절 사유를 입력하세요"
			class="w-full rounded-lg border border-gray-300 p-3 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
		></textarea>
		<div class="mt-4 flex gap-2">
			<button class="btn btn-secondary flex-1" onclick={() => (is_reject_modal_open = false)}>
				취소
			</button>
			<button class="btn btn-primary flex-1" onclick={handle_reject}> 거절 </button>
		</div>
	</div>
</Modal>
