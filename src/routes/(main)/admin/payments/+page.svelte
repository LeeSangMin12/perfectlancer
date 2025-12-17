<script>
	import { goto } from '$app/navigation';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';

	import colors from '$lib/config/colors';
	import { comma, show_toast } from '$lib/utils/common';
	import { get_api_context, get_user_context } from '$lib/contexts/app_context.svelte.js';

	const api = get_api_context();
	const me = get_user_context();

	let { data } = $props();
	let all_payments = $state(data.all_payments || []);
	let pending_payments = $state(data.pending_payments || []);

	// 현재 보기 모드
	let view_mode = $state('pending'); // 'pending' | 'all'

	// 거절 모달
	let is_reject_modal_open = $state(false);
	let selected_payment = $state(null);
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
			pending: '입금 대기',
			confirmed: '확인 완료',
			rejected: '거절됨',
		};
		return map[status] || status;
	};

	// 결제 확인
	const handle_confirm = async (payment_id) => {
		if (!confirm('입금이 확인되었나요?')) return;

		try {
			await api.payments.confirm_payment(payment_id, me.id);
			show_toast('success', '결제가 확인되었습니다.');

			// 데이터 새로고침
			pending_payments = pending_payments.filter((p) => p.id !== payment_id);
			all_payments = all_payments.map((p) =>
				p.id === payment_id ? { ...p, status: 'confirmed' } : p,
			);
		} catch (err) {
			console.error('Confirm error:', err);
			show_toast('error', '확인 처리 중 오류가 발생했습니다.');
		}
	};

	// 거절 모달 열기
	const open_reject_modal = (payment) => {
		selected_payment = payment;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 결제 거절
	const handle_reject = async () => {
		if (!selected_payment) return;

		try {
			await api.payments.reject_payment(selected_payment.id, me.id, reject_reason || null);
			show_toast('success', '결제가 거절되었습니다.');

			is_reject_modal_open = false;
			pending_payments = pending_payments.filter((p) => p.id !== selected_payment.id);
			all_payments = all_payments.map((p) =>
				p.id === selected_payment.id ? { ...p, status: 'rejected' } : p,
			);
			selected_payment = null;
			reject_reason = '';
		} catch (err) {
			console.error('Reject error:', err);
			show_toast('error', '거절 처리 중 오류가 발생했습니다.');
		}
	};

	// 액션 버튼 렌더러
	const createActionRenderer = (isPending) => {
		return class ActionRenderer {
			eGui;
			params;

			init(params) {
				this.params = params;
				this.eGui = document.createElement('div');
				this.eGui.className = 'flex items-center gap-2';

				// 상세보기 버튼
				const viewBtn = document.createElement('button');
				viewBtn.className =
					'px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:underline';
				viewBtn.textContent = '상세';
				viewBtn.onclick = () => {
					if (params.data.reference_type === 'work_request_proposals') {
						// proposal의 work_request_id를 통해 상세 페이지로 이동
						// reference_id가 proposal_id이므로 직접 이동은 어려움
						// 일단 알림만 표시
						alert(`결제 ID: ${params.data.id}\n제안 ID: ${params.data.reference_id}`);
					}
				};

				this.eGui.appendChild(viewBtn);

				if (isPending) {
					// 확인 버튼
					const confirmBtn = document.createElement('button');
					confirmBtn.className =
						'px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700';
					confirmBtn.textContent = '확인';
					confirmBtn.onclick = () => handle_confirm(params.data.id);

					// 거절 버튼
					const rejectBtn = document.createElement('button');
					rejectBtn.className =
						'px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100';
					rejectBtn.textContent = '거절';
					rejectBtn.onclick = () => open_reject_modal(params.data);

					this.eGui.appendChild(confirmBtn);
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
			} else if (status === 'confirmed') {
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

	// 대기 중인 결제 컬럼 정의
	const pending_column_defs = [
		{
			headerName: '결제자',
			valueGetter: (params) => params.data.user?.name || params.data.user?.handle || '-',
			flex: 1,
			minWidth: 100,
		},
		{
			headerName: '이메일',
			valueGetter: (params) => params.data.user?.email || '-',
			flex: 1,
			minWidth: 150,
		},
		{
			headerName: '금액',
			field: 'amount',
			valueFormatter: (params) => `${comma(params.value)}원`,
			width: 120,
		},
		{
			headerName: '입금자명',
			field: 'depositor_name',
			width: 100,
		},
		{
			headerName: '입금 은행',
			field: 'depositor_bank',
			width: 100,
		},
		{
			headerName: '입금 계좌',
			field: 'depositor_account_number',
			width: 140,
		},
		{
			headerName: '요청일',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer(true),
			width: 180,
			sortable: false,
			filter: false,
		},
	];

	// 전체 결제 컬럼 정의
	const all_column_defs = [
		{
			headerName: '결제자',
			valueGetter: (params) => params.data.user?.name || params.data.user?.handle || '-',
			flex: 1,
			minWidth: 100,
		},
		{
			headerName: '금액',
			field: 'amount',
			valueFormatter: (params) => `${comma(params.value)}원`,
			width: 120,
		},
		{
			headerName: '입금자명',
			field: 'depositor_name',
			width: 100,
		},
		{
			headerName: '상태',
			field: 'status',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '요청일',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '처리일',
			field: 'confirmed_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer(false),
			width: 80,
			sortable: false,
			filter: false,
		},
	];

	// 현재 데이터 및 컬럼
	let current_data = $derived(view_mode === 'pending' ? pending_payments : all_payments);
	let current_columns = $derived(view_mode === 'pending' ? pending_column_defs : all_column_defs);

	// 통계
	const pending_total = $derived(
		pending_payments.reduce((sum, p) => sum + p.amount, 0),
	);
</script>

<svelte:head>
	<title>외주 결제 관리 | 관리자</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">외주 결제 관리</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-white px-6 py-6">
	<!-- 통계 -->
	<div class="mb-6 flex gap-4">
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">입금 대기</p>
			<p class="text-xl font-semibold">
				{pending_payments.length}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">대기 금액</p>
			<p class="text-xl font-semibold">
				{comma(pending_total)}<span class="text-sm font-normal text-gray-400">원</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">전체</p>
			<p class="text-xl font-semibold">
				{all_payments.length}<span class="text-sm font-normal text-gray-400">건</span>
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
			입금 대기 ({pending_payments.length})
		</button>
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode ===
			'all'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'all')}
		>
			전체 ({all_payments.length})
		</button>
	</div>

	<!-- ag-grid 테이블 -->
	<div class="rounded-lg border border-gray-200 bg-white">
		{#if current_data.length === 0}
			<div class="py-16 text-center text-gray-400">
				{view_mode === 'pending'
					? '입금 대기 중인 결제가 없습니다.'
					: '등록된 결제가 없습니다.'}
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

<!-- 거절 모달 -->
<Modal bind:is_modal_open={is_reject_modal_open} modal_position="center">
	<div class="p-5">
		<h3 class="mb-4 font-semibold text-gray-900">결제 거절</h3>
		{#if selected_payment}
			<p class="mb-3 text-sm text-gray-600">
				{selected_payment.user?.name || selected_payment.user?.handle}님 ·
				{comma(selected_payment.amount)}원
			</p>
		{/if}
		<textarea
			bind:value={reject_reason}
			rows="3"
			placeholder="거절 사유를 입력하세요 (선택)"
			class="w-full rounded-lg border border-gray-300 p-3 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
		></textarea>
		<div class="mt-4 flex gap-2">
			<button
				class="btn btn-secondary flex-1"
				onclick={() => (is_reject_modal_open = false)}
			>
				취소
			</button>
			<button class="btn btn-primary flex-1" onclick={handle_reject}> 거절 </button>
		</div>
	</div>
</Modal>
