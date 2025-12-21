<script>
	import colors from '$lib/config/colors';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';

	import Header from '$lib/components/ui/Header.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let { data } = $props();

	const api = get_api_context();

	let orders = $state(data.orders || []);
	let active_tab = $state('all');

	// 취소/환불 모달 상태
	let show_reason_modal = $state(false);
	let reason_modal_type = $state('cancel'); // 'cancel' | 'refund'
	let reason_modal_order = $state(null);
	let reason_text = $state('');
	let is_processing = $state(false);

	const open_reason_modal = (type, order) => {
		reason_modal_type = type;
		reason_modal_order = order;
		reason_text = '';
		show_reason_modal = true;
	};

	const close_reason_modal = () => {
		show_reason_modal = false;
		reason_modal_order = null;
		reason_text = '';
	};

	const submit_reason = async () => {
		if (!reason_modal_order || is_processing) return;

		is_processing = true;
		try {
			if (reason_modal_type === 'cancel') {
				await api.service_orders.cancel(reason_modal_order.id, reason_text);
				orders = orders.map((o) =>
					o.id === reason_modal_order.id ? { ...o, status: 'cancelled' } : o
				);
				show_toast('success', '주문이 취소되었습니다.');
			} else {
				await api.service_orders.refund(reason_modal_order.id, reason_text);
				orders = orders.map((o) =>
					o.id === reason_modal_order.id ? { ...o, status: 'refunded' } : o
				);
				show_toast('success', '주문이 환불 처리되었습니다.');
			}
			close_reason_modal();
		} catch (error) {
			console.error(`${reason_modal_type} error:`, error);
			show_toast('error', reason_modal_type === 'cancel' ? '주문 취소에 실패했습니다.' : '환불 처리에 실패했습니다.');
		} finally {
			is_processing = false;
		}
	};

	const STATUS_MAP = {
		pending: '대기 중',
		paid: '결제 완료',
		in_progress: '진행 중',
		completed: '완료',
		cancelled: '취소됨',
		refunded: '환불됨',
	};

	const STATUS_COLORS = {
		pending: 'bg-yellow-100 text-yellow-800',
		paid: 'bg-blue-100 text-blue-800',
		in_progress: 'bg-purple-100 text-purple-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-gray-100 text-gray-800',
		refunded: 'bg-red-100 text-red-800',
	};

	let filtered_orders = $derived(() => {
		if (active_tab === 'all') return orders;
		return orders.filter((o) => o.status === active_tab);
	});

	const tabs = [
		{ key: 'all', label: '전체' },
		{ key: 'pending', label: '대기 중' },
		{ key: 'paid', label: '결제 완료' },
		{ key: 'in_progress', label: '진행 중' },
		{ key: 'completed', label: '완료' },
		{ key: 'cancelled', label: '취소됨' },
		{ key: 'refunded', label: '환불됨' },
	];

	const column_defs = [
		{
			headerName: 'ID',
			field: 'id',
			width: 80,
			sortable: true,
		},
		{
			headerName: '서비스',
			field: 'service.title',
			flex: 1,
			minWidth: 200,
			sortable: true,
			filter: true,
			valueGetter: (params) => params.data.service?.title || params.data.service_title || '-',
		},
		{
			headerName: '구매자',
			field: 'buyer.name',
			width: 120,
			sortable: true,
			valueGetter: (params) => params.data.buyer?.name || params.data.buyer?.handle || '-',
		},
		{
			headerName: '판매자',
			field: 'seller.name',
			width: 120,
			sortable: true,
			valueGetter: (params) => params.data.seller?.name || params.data.seller?.handle || '-',
		},
		{
			headerName: '금액',
			field: 'total_amount',
			width: 120,
			sortable: true,
			valueFormatter: (params) => {
				const amount = params.data.unit_price * (params.data.quantity || 1);
				return amount ? `₩${comma(amount)}` : '-';
			},
		},
		{
			headerName: '상태',
			field: 'status',
			width: 100,
			sortable: true,
			cellRenderer: createStatusRenderer(),
		},
		{
			headerName: '생성일',
			field: 'created_at',
			width: 120,
			sortable: true,
			valueFormatter: (params) => params.value ? format_date(params.value) : '-',
		},
		{
			headerName: '액션',
			field: 'actions',
			width: 200,
			cellRenderer: createActionRenderer(),
		},
	];

	function createStatusRenderer() {
		return class StatusRenderer {
			eGui;

			init(params) {
				this.eGui = document.createElement('span');
				const status = params.value || 'pending';
				const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
				this.eGui.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`;
				this.eGui.textContent = STATUS_MAP[status] || status;
			}

			getGui() {
				return this.eGui;
			}

			refresh() {
				return false;
			}
		};
	}

	function createActionRenderer() {
		return class ActionRenderer {
			eGui;
			params;

			init(params) {
				this.params = params;
				this.eGui = document.createElement('div');
				this.eGui.className = 'flex items-center gap-2 h-full';

				const status = params.data.status;

				// 대기 중 상태일 때 승인 버튼 표시
				if (status === 'pending') {
					const approveBtn = document.createElement('button');
					approveBtn.className = 'text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700';
					approveBtn.textContent = '승인';
					approveBtn.onclick = () => this.handleApprove(params.data);
					this.eGui.appendChild(approveBtn);
				}

				// 결제 완료 상태일 때 완료 버튼 표시
				if (status === 'paid' || status === 'in_progress') {
					const completeBtn = document.createElement('button');
					completeBtn.className = 'text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700';
					completeBtn.textContent = '완료';
					completeBtn.onclick = () => this.handleComplete(params.data);
					this.eGui.appendChild(completeBtn);
				}

				// 대기 중 또는 결제 완료 상태일 때 취소 버튼 표시
				if (status === 'pending' || status === 'paid') {
					const cancelBtn = document.createElement('button');
					cancelBtn.className = 'text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700';
					cancelBtn.textContent = '취소';
					cancelBtn.onclick = () => open_reason_modal('cancel', params.data);
					this.eGui.appendChild(cancelBtn);
				}

				// 환불 버튼 (완료된 주문에 대해)
				if (status === 'completed') {
					const refundBtn = document.createElement('button');
					refundBtn.className = 'text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700';
					refundBtn.textContent = '환불';
					refundBtn.onclick = () => open_reason_modal('refund', params.data);
					this.eGui.appendChild(refundBtn);
				}
			}

			getGui() {
				return this.eGui;
			}

			refresh() {
				return false;
			}

			async handleApprove(order) {
				if (!confirm('입금을 확인하고 이 주문을 승인하시겠습니까?')) return;

				try {
					await api.service_orders.approve(order.id);
					orders = orders.map((o) =>
						o.id === order.id ? { ...o, status: 'paid' } : o
					);
					show_toast('success', '주문이 승인되었습니다.');
				} catch (error) {
					console.error('Approve order error:', error);
					show_toast('error', '주문 승인에 실패했습니다.');
				}
			}

			async handleComplete(order) {
				if (!confirm('이 주문을 완료 처리하시겠습니까?')) return;

				try {
					await api.service_orders.complete(order.id);
					orders = orders.map((o) =>
						o.id === order.id ? { ...o, status: 'completed' } : o
					);
					show_toast('success', '주문이 완료 처리되었습니다.');
				} catch (error) {
					console.error('Complete order error:', error);
					show_toast('error', '주문 완료 처리에 실패했습니다.');
				}
			}
		};
	}

	const default_col_def = {
		resizable: true,
	};
</script>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<span class="text-lg font-semibold">서비스 결제 관리</span>
	{/snippet}
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">서비스 결제 관리</h1>
		<p class="mt-1 text-sm text-gray-500">
			총 {orders.length}개의 주문이 있습니다.
		</p>
	</div>

	<!-- 탭 -->
	<div class="mb-4 flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
		{#each tabs as tab}
			<button
				onclick={() => (active_tab = tab.key)}
				class="whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors {active_tab === tab.key
					? 'border-b-2 border-primary text-primary'
					: 'text-gray-500 hover:text-gray-700'}"
			>
				{tab.label}
				{#if tab.key === 'all'}
					<span class="ml-1 text-xs text-gray-400">({orders.length})</span>
				{:else}
					<span class="ml-1 text-xs text-gray-400">
						({orders.filter((o) => o.status === tab.key).length})
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<AgGrid
		rowData={filtered_orders()}
		columnDefs={column_defs}
		defaultColDef={default_col_def}
		pagination={true}
		paginationPageSize={20}
	/>
</div>

<!-- 취소/환불 사유 입력 모달 -->
<Modal bind:is_modal_open={show_reason_modal} modal_position="center">
	<div class="p-5">
		<h3 class="text-lg font-semibold text-gray-900">
			{reason_modal_type === 'cancel' ? '주문 취소' : '환불 처리'}
		</h3>
		<p class="mt-1 text-sm text-gray-500">
			{reason_modal_type === 'cancel' ? '취소' : '환불'} 사유를 입력해주세요.
		</p>

		<textarea
			bind:value={reason_text}
			placeholder="사유를 입력해주세요 (선택)"
			rows="3"
			class="mt-4 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
		></textarea>

		<div class="mt-5 flex gap-2">
			<button
				onclick={close_reason_modal}
				disabled={is_processing}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-700"
			>
				취소
			</button>
			<button
				onclick={submit_reason}
				disabled={is_processing}
				class="flex-1 rounded-lg py-3 text-sm font-medium text-white {reason_modal_type === 'cancel' ? 'bg-gray-600' : 'bg-red-600'}"
			>
				{#if is_processing}
					처리 중...
				{:else}
					{reason_modal_type === 'cancel' ? '주문 취소' : '환불 처리'}
				{/if}
			</button>
		</div>
	</div>
</Modal>
