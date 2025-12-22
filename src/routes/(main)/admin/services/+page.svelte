<script>
	import { goto } from '$app/navigation';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';

	import colors from '$lib/config/colors';
	import { comma, show_toast } from '$lib/utils/common';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';

	const api = get_api_context();

	let { data } = $props();
	let all_services = $state(data.all_services || []);
	let pending_services = $state(data.pending_services || []);

	// 현재 보기 모드
	let view_mode = $state('pending'); // 'pending' | 'all'

	// 거절 모달
	let is_reject_modal_open = $state(false);
	let selected_service_id = $state(null);
	let reject_reason = $state('');

	// 날짜 포맷
	const format_date = (date_string) => {
		if (!date_string) return '-';
		return new Date(date_string).toLocaleDateString('ko-KR', {
			year: '2-digit',
			month: '2-digit',
			day: '2-digit',
		});
	};

	// 상태 텍스트
	const get_status_text = (status) => {
		const map = {
			pending_approval: '승인 대기',
			open: '공개',
			rejected: '거절됨',
			closed: '비공개',
		};
		return map[status] || status;
	};

	// 서비스 승인
	const handle_approve = async (service_id) => {
		if (!confirm('이 서비스를 승인하시겠습니까?')) return;

		try {
			await api.services.approve(service_id);
			show_toast('success', '서비스가 승인되었습니다.');

			// 데이터 새로고침
			pending_services = pending_services.filter((s) => s.id !== service_id);
			all_services = all_services.map((s) =>
				s.id === service_id ? { ...s, status: 'open' } : s,
			);
		} catch (err) {
			console.error('Approve error:', err);
			show_toast('error', '승인 처리 중 오류가 발생했습니다.');
		}
	};

	// 거절 모달 열기
	const open_reject_modal = (service_id) => {
		selected_service_id = service_id;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 서비스 거절
	const handle_reject = async () => {
		try {
			await api.services.reject(selected_service_id, reject_reason || null);
			show_toast('success', '서비스가 거절되었습니다.');

			is_reject_modal_open = false;
			pending_services = pending_services.filter((s) => s.id !== selected_service_id);
			all_services = all_services.map((s) =>
				s.id === selected_service_id ? { ...s, status: 'rejected' } : s,
			);
			selected_service_id = null;
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
				viewBtn.onclick = () => goto(`/service/${params.data.id}`);

				this.eGui.appendChild(viewBtn);

				if (isPending) {
					// 승인 버튼
					const approveBtn = document.createElement('button');
					approveBtn.className =
						'px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700';
					approveBtn.textContent = '승인';
					approveBtn.onclick = () => handle_approve(params.data.id);

					// 거절 버튼
					const rejectBtn = document.createElement('button');
					rejectBtn.className =
						'px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100';
					rejectBtn.textContent = '거절';
					rejectBtn.onclick = () => open_reject_modal(params.data.id);

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

	// 상태 렌더러
	class StatusRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('span');
			const status = params.value;
			const text = get_status_text(status);

			let bgColor = 'bg-gray-100';
			let textColor = 'text-gray-600';

			if (status === 'pending_approval') {
				bgColor = 'bg-yellow-50';
				textColor = 'text-yellow-700';
			} else if (status === 'open') {
				bgColor = 'bg-green-50';
				textColor = 'text-green-700';
			} else if (status === 'rejected') {
				bgColor = 'bg-red-50';
				textColor = 'text-red-700';
			} else if (status === 'closed') {
				bgColor = 'bg-gray-100';
				textColor = 'text-gray-600';
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

	// 승인 대기 컬럼 정의
	const pending_column_defs = [
		{
			headerName: '제목',
			field: 'title',
			flex: 2,
			minWidth: 200,
		},
		{
			headerName: '판매자',
			valueGetter: (params) => params.data.users?.name || params.data.users?.handle || '-',
			flex: 1,
			minWidth: 100,
		},
		{
			headerName: '카테고리',
			field: 'category',
			width: 130,
		},
		{
			headerName: '가격',
			field: 'price',
			width: 110,
			valueFormatter: (params) => params.value ? `₩${comma(params.value)}` : '-',
		},
		{
			headerName: '등록일',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 100,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer(true),
			width: 180,
			sortable: false,
			filter: false,
		},
	];

	// 전체 서비스 컬럼 정의
	const all_column_defs = [
		{
			headerName: '제목',
			field: 'title',
			flex: 2,
			minWidth: 200,
		},
		{
			headerName: '판매자',
			valueGetter: (params) => params.data.users?.name || params.data.users?.handle || '-',
			flex: 1,
			minWidth: 100,
		},
		{
			headerName: '카테고리',
			field: 'category',
			width: 130,
		},
		{
			headerName: '상태',
			field: 'status',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '가격',
			field: 'price',
			width: 110,
			valueFormatter: (params) => params.value ? `₩${comma(params.value)}` : '-',
		},
		{
			headerName: '평점',
			field: 'rating',
			width: 80,
			valueFormatter: (params) => params.value?.toFixed(1) || '0.0',
		},
		{
			headerName: '등록일',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 100,
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
	let current_data = $derived(view_mode === 'pending' ? pending_services : all_services);
	let current_columns = $derived(view_mode === 'pending' ? pending_column_defs : all_column_defs);
</script>

<svelte:head>
	<title>서비스 관리 | 관리자</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">서비스 관리</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-white px-6 py-6">
	<!-- 통계 -->
	<div class="mb-6 flex flex-wrap gap-4">
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">승인 대기</p>
			<p class="text-xl font-semibold">
				{pending_services.length}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">전체 서비스</p>
			<p class="text-xl font-semibold">
				{all_services.length}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">공개중</p>
			<p class="text-xl font-semibold">
				{all_services.filter((s) => s.status === 'open').length}<span
					class="text-sm font-normal text-gray-400">건</span
				>
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
			승인 대기 ({pending_services.length})
		</button>
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode ===
			'all'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'all')}
		>
			전체 서비스 ({all_services.length})
		</button>
	</div>

	<!-- ag-grid 테이블 -->
	<div class="rounded-lg border border-gray-200 bg-white">
		{#if current_data.length === 0}
			<div class="py-16 text-center text-gray-400">
				{#if view_mode === 'pending'}
					승인 대기 중인 서비스가 없습니다.
				{:else}
					등록된 서비스가 없습니다.
				{/if}
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
		<h3 class="mb-4 font-semibold text-gray-900">서비스 거절</h3>
		<textarea
			bind:value={reject_reason}
			rows="3"
			placeholder="거절 사유를 입력하세요 (선택)"
			class="focus:ring-primary/20 focus:border-primary w-full rounded-lg border border-gray-300 p-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2"
		></textarea>
		<div class="mt-4 flex gap-2">
			<button class="btn btn-secondary flex-1" onclick={() => (is_reject_modal_open = false)}>
				취소
			</button>
			<button class="btn btn-primary flex-1" onclick={handle_reject}> 거절 </button>
		</div>
	</div>
</Modal>
