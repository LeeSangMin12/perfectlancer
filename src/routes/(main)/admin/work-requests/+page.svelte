<script>
	import { invalidateAll } from '$app/navigation';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';

	import colors from '$lib/config/colors';
	import { comma, show_toast } from '$lib/utils/common';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';

	const api = get_api_context();

	let { data } = $props();
	let all_requests = $state(data.all_requests || []);
	let pending_requests = $state(data.pending_requests || []);
	let completion_requests = $state(data.completion_requests || []);

	// 현재 보기 모드
	let view_mode = $state('pending'); // 'pending' | 'all' | 'completion'

	// 거절 모달
	let is_reject_modal_open = $state(false);
	let selected_request_id = $state(null);
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
			draft: '결제 대기',
			pending_approval: '승인 대기',
			open: '모집중',
			in_progress: '진행중',
			completed: '완료',
			closed: '마감',
			rejected: '거절됨',
		};
		return map[status] || status;
	};

	// 공고 승인
	const handle_approve = async (request_id) => {
		if (!confirm('이 공고를 승인하시겠습니까?')) return;

		try {
			await api.work_requests.approve(request_id);
			show_toast('공고가 승인되었습니다.', 'success');

			// 데이터 새로고침
			pending_requests = pending_requests.filter((r) => r.id !== request_id);
			all_requests = all_requests.map((r) =>
				r.id === request_id ? { ...r, status: 'open' } : r,
			);
		} catch (err) {
			console.error('Approve error:', err);
			show_toast('승인 처리 중 오류가 발생했습니다.', 'error');
		}
	};

	// 거절 모달 열기
	const open_reject_modal = (request_id) => {
		selected_request_id = request_id;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 공고 거절
	const handle_reject = async () => {
		try {
			await api.work_requests.reject(selected_request_id, reject_reason || null);
			show_toast('공고가 거절되었습니다.', 'success');

			is_reject_modal_open = false;
			pending_requests = pending_requests.filter((r) => r.id !== selected_request_id);
			all_requests = all_requests.map((r) =>
				r.id === selected_request_id ? { ...r, status: 'rejected' } : r,
			);
			selected_request_id = null;
			reject_reason = '';
		} catch (err) {
			console.error('Reject error:', err);
			show_toast('거절 처리 중 오류가 발생했습니다.', 'error');
		}
	};

	// 보상금 포맷
	const format_reward = (params) => {
		const { reward_amount, price_unit } = params.data;
		if (price_unit === 'quote' || !reward_amount) return '제안 받기';

		const unit_map = {
			per_project: '건당',
			per_hour: '시간당',
			per_day: '일당',
			per_month: '월',
			per_year: '년',
			per_page: '장당',
		};
		const unit = unit_map[price_unit] || '';
		return `${unit} ${comma(reward_amount)}원`;
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
				viewBtn.onclick = () => goto(`/work-request/${params.data.id}`);

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
			} else if (status === 'completed') {
				bgColor = 'bg-blue-50';
				textColor = 'text-blue-700';
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

	// 잡타입 렌더러
	class JobTypeRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('span');
			this.eGui.className = 'text-xs';
			this.eGui.textContent = params.value === 'sidejob' ? '사이드잡' : '풀타임잡';
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
			headerName: '의뢰인',
			valueGetter: (params) => params.data.users?.name || params.data.users?.handle || '-',
			flex: 1,
			minWidth: 100,
		},
		{
			headerName: '유형',
			field: 'job_type',
			cellRenderer: JobTypeRenderer,
			width: 90,
		},
		{
			headerName: '카테고리',
			field: 'category',
			width: 120,
		},
		{
			headerName: '보상금',
			valueGetter: format_reward,
			width: 130,
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

	// 전체 공고 컬럼 정의
	const all_column_defs = [
		{
			headerName: '제목',
			field: 'title',
			flex: 2,
			minWidth: 200,
		},
		{
			headerName: '의뢰인',
			valueGetter: (params) => params.data.users?.name || params.data.users?.handle || '-',
			flex: 1,
			minWidth: 100,
		},
		{
			headerName: '유형',
			field: 'job_type',
			cellRenderer: JobTypeRenderer,
			width: 90,
		},
		{
			headerName: '상태',
			field: 'status',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '보상금',
			valueGetter: format_reward,
			width: 130,
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

	// 완료 처리 핸들러
	const handle_complete = async (proposal_id) => {
		if (!confirm('이 제안을 완료 처리하시겠습니까?')) return;

		try {
			await api.work_request_proposals.admin_complete(proposal_id);
			show_toast('완료 처리되었습니다.', 'success');

			// 목록에서 제거
			completion_requests = completion_requests.filter((r) => r.id !== proposal_id);
		} catch (err) {
			console.error('Complete error:', err);
			show_toast('완료 처리 중 오류가 발생했습니다.', 'error');
		}
	};

	// 경과 일수 계산
	const get_days_since = (date_string) => {
		if (!date_string) return 0;
		const requested = new Date(date_string);
		const now = new Date();
		const diff = Math.floor((now - requested) / (1000 * 60 * 60 * 24));
		return diff;
	};

	// 완료 액션 렌더러 (컬럼 정의 전에 선언)
	const createCompletionActionRenderer = () => {
		return class CompletionActionRenderer {
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
				viewBtn.onclick = () => goto(`/work-request/${params.data.work_requests?.id}`);

				// 완료 버튼
				const completeBtn = document.createElement('button');
				completeBtn.className =
					'px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700';
				completeBtn.textContent = '완료 처리';
				completeBtn.onclick = () => handle_complete(params.data.id);

				this.eGui.appendChild(viewBtn);
				this.eGui.appendChild(completeBtn);
			}

			getGui() {
				return this.eGui;
			}

			refresh() {
				return false;
			}
		};
	};

	// 완료 요청 컬럼 정의
	const completion_column_defs = [
		{
			headerName: '공고',
			valueGetter: (params) => params.data.work_requests?.title || '-',
			flex: 2,
			minWidth: 180,
		},
		{
			headerName: '전문가',
			valueGetter: (params) => params.data.users?.name || params.data.users?.handle || '-',
			width: 100,
		},
		{
			headerName: '의뢰인',
			valueGetter: (params) =>
				params.data.work_requests?.users?.name ||
				params.data.work_requests?.users?.handle ||
				'-',
			width: 100,
		},
		{
			headerName: '의뢰인 연락처',
			valueGetter: (params) => params.data.work_requests?.users?.phone || '-',
			width: 120,
		},
		{
			headerName: '금액',
			valueGetter: (params) =>
				params.data.proposed_amount ? `₩${comma(params.data.proposed_amount)}` : '-',
			width: 100,
		},
		{
			headerName: '요청일',
			field: 'completion_requested_at',
			valueFormatter: (params) => format_date(params.value),
			width: 100,
		},
		{
			headerName: '경과',
			valueGetter: (params) => {
				const days = get_days_since(params.data.completion_requested_at);
				return `${days}일`;
			},
			width: 70,
			cellStyle: (params) => {
				const days = get_days_since(params.data.completion_requested_at);
				if (days >= 7) return { color: '#dc2626', fontWeight: '600' };
				if (days >= 5) return { color: '#d97706' };
				return {};
			},
		},
		{
			headerName: '',
			cellRenderer: createCompletionActionRenderer(),
			width: 150,
			sortable: false,
			filter: false,
		},
	];

	// 현재 데이터 및 컬럼
	let current_data = $derived(
		view_mode === 'pending'
			? pending_requests
			: view_mode === 'completion'
				? completion_requests
				: all_requests,
	);
	let current_columns = $derived(
		view_mode === 'pending'
			? pending_column_defs
			: view_mode === 'completion'
				? completion_column_defs
				: all_column_defs,
	);
</script>

<svelte:head>
	<title>외주 공고 관리 | 관리자</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">외주 공고 관리</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-white px-6 py-6">
	<!-- 통계 -->
	<div class="mb-6 flex flex-wrap gap-4">
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">승인 대기</p>
			<p class="text-xl font-semibold">{pending_requests.length}<span class="text-sm font-normal text-gray-400">건</span></p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">완료 요청</p>
			<p class="text-xl font-semibold">{completion_requests.length}<span class="text-sm font-normal text-gray-400">건</span></p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">전체 공고</p>
			<p class="text-xl font-semibold">{all_requests.length}<span class="text-sm font-normal text-gray-400">건</span></p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">모집중</p>
			<p class="text-xl font-semibold">{all_requests.filter((r) => r.status === 'open').length}<span class="text-sm font-normal text-gray-400">건</span></p>
		</div>
	</div>

	<!-- 탭 -->
	<div class="mb-4 flex gap-1 rounded-lg bg-gray-200 p-1">
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode === 'pending'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'pending')}
		>
			승인 대기 ({pending_requests.length})
		</button>
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode === 'completion'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'completion')}
		>
			완료 요청 ({completion_requests.length})
		</button>
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {view_mode === 'all'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (view_mode = 'all')}
		>
			전체 공고 ({all_requests.length})
		</button>
	</div>

	<!-- ag-grid 테이블 -->
	<div class="rounded-lg border border-gray-200 bg-white">
		{#if current_data.length === 0}
			<div class="py-16 text-center text-gray-400">
				{#if view_mode === 'pending'}
					승인 대기 중인 공고가 없습니다.
				{:else if view_mode === 'completion'}
					완료 요청 중인 제안이 없습니다.
				{:else}
					등록된 공고가 없습니다.
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
		<h3 class="mb-4 font-semibold text-gray-900">공고 거절</h3>
		<textarea
			bind:value={reject_reason}
			rows="3"
			placeholder="거절 사유를 입력하세요 (선택)"
			class="w-full rounded-lg border border-gray-300 p-3 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
		></textarea>
		<div class="mt-4 flex gap-2">
			<button class="btn btn-secondary flex-1" onclick={() => (is_reject_modal_open = false)}>
				취소
			</button>
			<button class="btn btn-primary flex-1" onclick={handle_reject}>
				거절
			</button>
		</div>
	</div>
</Modal>
