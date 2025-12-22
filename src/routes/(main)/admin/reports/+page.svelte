<script>
	import { goto } from '$app/navigation';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';

	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	let post_reports = $state(data.post_reports || []);
	let comment_reports = $state(data.comment_reports || []);
	let user_reports = $state(data.user_reports || []);
	let service_reports = $state(data.service_reports || []);
	let community_reports = $state(data.community_reports || []);

	// 탭 상태: 'post' | 'comment' | 'user' | 'service' | 'community'
	let active_tab = $state('post');
	// 필터 상태: 'pending' | 'resolved' | 'all'
	let filter = $state('pending');

	// 모달 상태
	let is_resolve_modal_open = $state(false);
	let selected_report = $state(null);
	let selected_type = $state('');

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

	// 필터된 데이터
	const filter_data = (data) => {
		if (filter === 'pending') return data.filter((r) => !r.resolved_at);
		if (filter === 'resolved') return data.filter((r) => r.resolved_at);
		return data;
	};

	let filtered_post_reports = $derived(filter_data(post_reports));
	let filtered_comment_reports = $derived(filter_data(comment_reports));
	let filtered_user_reports = $derived(filter_data(user_reports));
	let filtered_service_reports = $derived(filter_data(service_reports));
	let filtered_community_reports = $derived(filter_data(community_reports));

	// 미처리 개수
	let pending_post_count = $derived(post_reports.filter((r) => !r.resolved_at).length);
	let pending_comment_count = $derived(comment_reports.filter((r) => !r.resolved_at).length);
	let pending_user_count = $derived(user_reports.filter((r) => !r.resolved_at).length);
	let pending_service_count = $derived(service_reports.filter((r) => !r.resolved_at).length);
	let pending_community_count = $derived(community_reports.filter((r) => !r.resolved_at).length);
	let total_pending = $derived(pending_post_count + pending_comment_count + pending_user_count + pending_service_count + pending_community_count);

	// 현재 탭의 데이터
	let current_data = $derived(
		active_tab === 'post'
			? filtered_post_reports
			: active_tab === 'comment'
				? filtered_comment_reports
				: active_tab === 'user'
					? filtered_user_reports
					: active_tab === 'service'
						? filtered_service_reports
						: filtered_community_reports,
	);

	// 처리 모달 열기
	const open_resolve_modal = (report, type) => {
		selected_report = report;
		selected_type = type;
		is_resolve_modal_open = true;
	};

	// 신고 처리
	const handle_resolve = async () => {
		if (!selected_report || !selected_type) return;

		try {
			const now = new Date().toISOString();
			if (selected_type === 'post') {
				await api.admin_reports.resolve_post_report(selected_report.id, me.id);
				post_reports = post_reports.map((r) =>
					r.id === selected_report.id ? { ...r, resolved_at: now, resolved_by: me.id } : r,
				);
			} else if (selected_type === 'comment') {
				await api.admin_reports.resolve_comment_report(selected_report.id, me.id);
				comment_reports = comment_reports.map((r) =>
					r.id === selected_report.id ? { ...r, resolved_at: now, resolved_by: me.id } : r,
				);
			} else if (selected_type === 'user') {
				await api.admin_reports.resolve_user_report(selected_report.id, me.id);
				user_reports = user_reports.map((r) =>
					r.id === selected_report.id ? { ...r, resolved_at: now, resolved_by: me.id } : r,
				);
			} else if (selected_type === 'service') {
				await api.admin_reports.resolve_service_report(selected_report.id, me.id);
				service_reports = service_reports.map((r) =>
					r.id === selected_report.id ? { ...r, resolved_at: now, resolved_by: me.id } : r,
				);
			} else if (selected_type === 'community') {
				await api.admin_reports.resolve_community_report(selected_report.id, me.id);
				community_reports = community_reports.map((r) =>
					r.id === selected_report.id ? { ...r, resolved_at: now, resolved_by: me.id } : r,
				);
			}

			show_toast('신고가 처리되었습니다.', 'success');
			is_resolve_modal_open = false;
			selected_report = null;
			selected_type = '';
		} catch (error) {
			show_toast('처리 중 오류가 발생했습니다.', 'error');
			console.error('신고 처리 실패:', error);
		}
	};

	// 상태 렌더러
	class StatusRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('span');
			const resolved_at = params.value;

			if (resolved_at) {
				this.eGui.className = 'px-2 py-0.5 text-xs rounded bg-green-50 text-green-700';
				this.eGui.textContent = '처리완료';
			} else {
				this.eGui.className = 'px-2 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700';
				this.eGui.textContent = '미처리';
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 신고자 렌더러
	class ReporterRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const reporter = params.data.reporter;
			if (reporter) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium text-gray-900">${reporter.name || '알 수 없음'}</div>
						<div class="text-gray-500">@${reporter.handle || '-'}</div>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">알 수 없음</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 게시물 렌더러
	class PostRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const post = params.data.post;
			if (post) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium text-gray-900 truncate max-w-[200px]">${post.title || '제목 없음'}</div>
						<div class="text-gray-500">@${post.author?.handle || '-'}</div>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">삭제된 게시물</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 커뮤니티 렌더러
	class CommunityRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const community = params.data.community;
			if (community) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium text-gray-900">${community.title || '알 수 없음'}</div>
						<a href="/community/${community.slug || community.id}" 
							class="text-xs text-blue-600 hover:text-blue-800 hover:underline"
							target="_blank">
							커뮤니티 보기 →
						</a>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">삭제된 커뮤니티</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 신고된 사용자 렌더러
	class ReportedUserRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const user = params.data.reported_user;
			if (user) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium text-gray-900">${user.name || '알 수 없음'}</div>
						<div class="text-gray-500">@${user.handle || '-'}</div>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">탈퇴한 사용자</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 댓글 렌더러
	class CommentRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const comment = params.data.post_comments;
			if (comment) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium text-gray-900 truncate max-w-[200px]">${comment.content?.substring(0, 50) || '댓글 내용'}...</div>
						<a href="/post/${comment.post_id}" 
							class="text-xs text-blue-600 hover:text-blue-800 hover:underline"
							target="_blank">
							게시물 보기 →
						</a>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">삭제된 댓글</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 서비스 렌더러
	class ServiceRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const service = params.data.services;
			if (service) {
				this.eGui.innerHTML = `
					<div class="text-sm">
						<div class="font-medium text-gray-900 truncate max-w-[200px]">${service.title || '서비스 제목'}</div>
						<a href="/service/${service.id}" 
							class="text-xs text-blue-600 hover:text-blue-800 hover:underline"
							target="_blank">
							서비스 보기 →
						</a>
					</div>
				`;
			} else {
				this.eGui.innerHTML = `<span class="text-gray-400 text-sm">삭제된 서비스</span>`;
			}
		}

		getGui() {
			return this.eGui;
		}

		refresh() {
			return false;
		}
	}

	// 사유 렌더러
	class ReasonRenderer {
		eGui;

		init(params) {
			this.eGui = document.createElement('div');
			const reason = params.data.reason || '';
			const details = params.data.details || '';

			this.eGui.innerHTML = `
				<div class="text-sm">
					<div class="font-medium text-gray-900">${reason}</div>
					${details ? `<div class="text-gray-500 truncate max-w-[200px]">${details}</div>` : ''}
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

	// 액션 버튼 렌더러 생성
	const createActionRenderer = (type) => {
		return class ActionRenderer {
			eGui;

			init(params) {
				this.eGui = document.createElement('div');
				this.eGui.className = 'flex items-center gap-2';

				if (!params.data.resolved_at) {
					const resolveBtn = document.createElement('button');
					resolveBtn.className =
						'px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700';
					resolveBtn.textContent = '처리완료';
					resolveBtn.onclick = () => open_resolve_modal(params.data, type);
					this.eGui.appendChild(resolveBtn);
				} else {
					const text = document.createElement('span');
					text.className = 'text-xs text-gray-400';
					text.textContent = '처리됨';
					this.eGui.appendChild(text);
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

	// 게시물 신고 컬럼
	const post_column_defs = [
		{
			headerName: '신고자',
			cellRenderer: ReporterRenderer,
			width: 140,
		},
		{
			headerName: '신고된 게시물',
			cellRenderer: PostRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '신고 사유',
			cellRenderer: ReasonRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '상태',
			field: 'resolved_at',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '신고일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer('post'),
			width: 100,
			sortable: false,
			filter: false,
		},
	];

	// 커뮤니티 신고 컬럼
	const community_column_defs = [
		{
			headerName: '신고자',
			cellRenderer: ReporterRenderer,
			width: 140,
		},
		{
			headerName: '신고된 커뮤니티',
			cellRenderer: CommunityRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '신고 사유',
			cellRenderer: ReasonRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '상태',
			field: 'resolved_at',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '신고일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer('community'),
			width: 100,
			sortable: false,
			filter: false,
		},
	];

	// 댓글 신고 컬럼
	const comment_column_defs = [
		{
			headerName: '신고자',
			cellRenderer: ReporterRenderer,
			width: 140,
		},
		{
			headerName: '신고된 댓글',
			cellRenderer: CommentRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '신고 사유',
			cellRenderer: ReasonRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '상태',
			field: 'resolved_at',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '신고일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer('comment'),
			width: 100,
			sortable: false,
			filter: false,
		},
	];

	// 사용자 신고 컬럼
	const user_column_defs = [
		{
			headerName: '신고자',
			cellRenderer: ReporterRenderer,
			width: 140,
		},
		{
			headerName: '신고된 사용자',
			cellRenderer: ReportedUserRenderer,
			flex: 1,
			minWidth: 150,
		},
		{
			headerName: '신고 사유',
			cellRenderer: ReasonRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '상태',
			field: 'resolved_at',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '신고일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer('user'),
			width: 100,
			sortable: false,
			filter: false,
		},
	];

	// 서비스 신고 컬럼
	const service_column_defs = [
		{
			headerName: '신고자',
			cellRenderer: ReporterRenderer,
			width: 140,
		},
		{
			headerName: '신고된 서비스',
			cellRenderer: ServiceRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '신고 사유',
			cellRenderer: ReasonRenderer,
			flex: 1,
			minWidth: 200,
		},
		{
			headerName: '상태',
			field: 'resolved_at',
			cellRenderer: StatusRenderer,
			width: 100,
		},
		{
			headerName: '신고일시',
			field: 'created_at',
			valueFormatter: (params) => format_date(params.value),
			width: 140,
		},
		{
			headerName: '',
			cellRenderer: createActionRenderer('service'),
			width: 100,
			sortable: false,
			filter: false,
		},
	];

	// 현재 컬럼
	let current_columns = $derived(
		active_tab === 'post'
			? post_column_defs
			: active_tab === 'comment'
				? comment_column_defs
				: active_tab === 'user'
					? user_column_defs
					: active_tab === 'service'
						? service_column_defs
						: community_column_defs,
	);
</script>

<svelte:head>
	<title>신고 관리 | 관리자</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">신고 관리</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-white px-6 py-6">
	<!-- 통계 -->
	<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">전체 미처리</p>
			<p class="text-xl font-semibold text-red-600">
				{total_pending}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">게시물 신고</p>
			<p class="text-xl font-semibold">
				{pending_post_count}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">댓글 신고</p>
			<p class="text-xl font-semibold">
				{pending_comment_count}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">사용자 신고</p>
			<p class="text-xl font-semibold">
				{pending_user_count}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">서비스 신고</p>
			<p class="text-xl font-semibold">
				{pending_service_count}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<p class="text-xs text-gray-500">커뮤니티 신고</p>
			<p class="text-xl font-semibold">
				{pending_community_count}<span class="text-sm font-normal text-gray-400">건</span>
			</p>
		</div>
	</div>

	<!-- 탭 -->
	<div class="mb-4 flex gap-1 rounded-lg bg-gray-200 p-1 overflow-x-auto">
		<button
			class="flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors {active_tab ===
			'post'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (active_tab = 'post')}
		>
			게시물 ({pending_post_count})
		</button>
		<button
			class="flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors {active_tab ===
			'comment'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (active_tab = 'comment')}
		>
			댓글 ({pending_comment_count})
		</button>
		<button
			class="flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors {active_tab ===
			'user'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (active_tab = 'user')}
		>
			사용자 ({pending_user_count})
		</button>
		<button
			class="flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors {active_tab ===
			'service'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (active_tab = 'service')}
		>
			서비스 ({pending_service_count})
		</button>
		<button
			class="flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors {active_tab ===
			'community'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (active_tab = 'community')}
		>
			커뮤니티 ({pending_community_count})
		</button>
	</div>

	<!-- 필터 -->
	<div class="mb-4 flex gap-2">
		<button
			class="rounded-md px-3 py-1.5 text-sm {filter === 'pending'
				? 'bg-gray-900 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			onclick={() => (filter = 'pending')}
		>
			미처리
		</button>
		<button
			class="rounded-md px-3 py-1.5 text-sm {filter === 'resolved'
				? 'bg-gray-900 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			onclick={() => (filter = 'resolved')}
		>
			처리완료
		</button>
		<button
			class="rounded-md px-3 py-1.5 text-sm {filter === 'all'
				? 'bg-gray-900 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			onclick={() => (filter = 'all')}
		>
			전체
		</button>
	</div>

	<!-- ag-grid 테이블 -->
	<div class="rounded-lg border border-gray-200 bg-white">
		{#if current_data.length === 0}
			<div class="py-16 text-center text-gray-400">
				{filter === 'pending' ? '미처리된 신고가 없습니다.' : '신고 내역이 없습니다.'}
			</div>
		{:else}
			{#key `${active_tab}-${filter}`}
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

<!-- 처리 확인 모달 -->
<Modal bind:is_modal_open={is_resolve_modal_open} modal_position="center">
	<div class="p-5">
		<h3 class="mb-4 font-semibold text-gray-900">신고 처리</h3>
		{#if selected_report}
			<div class="rounded-lg bg-gray-50 p-3">
				<p class="text-sm text-gray-600">
					<span class="font-medium">신고 사유:</span>
					{selected_report.reason}
				</p>
				{#if selected_report.details}
					<p class="mt-2 text-sm text-gray-500">{selected_report.details}</p>
				{/if}
			</div>
			<p class="mt-4 text-sm text-gray-500">
				이 신고를 처리완료로 표시하시겠습니까?
			</p>
		{/if}
		<div class="mt-4 flex gap-2">
			<button class="btn btn-secondary flex-1" onclick={() => (is_resolve_modal_open = false)}>
				취소
			</button>
			<button class="btn btn-primary flex-1" onclick={handle_resolve}> 처리완료 </button>
		</div>
	</div>
</Modal>
