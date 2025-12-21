<script>
	import colors from '$lib/config/colors';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';

	import Header from '$lib/components/ui/Header.svelte';
	import AgGrid from '$lib/components/ui/AgGrid.svelte';

	let { data } = $props();

	const api = get_api_context();

	let services = $state(data.services || []);

	const column_defs = [
		{
			headerName: 'ID',
			field: 'id',
			width: 80,
			sortable: true,
		},
		{
			headerName: '제목',
			field: 'title',
			flex: 1,
			minWidth: 200,
			sortable: true,
			filter: true,
		},
		{
			headerName: '가격',
			field: 'price',
			width: 120,
			sortable: true,
			valueFormatter: (params) => params.value ? `₩${comma(params.value)}` : '-',
		},
		{
			headerName: '평점',
			field: 'rating',
			width: 80,
			sortable: true,
			valueFormatter: (params) => params.value?.toFixed(1) || '0.0',
		},
		{
			headerName: '리뷰 수',
			field: 'rating_count',
			width: 100,
			sortable: true,
			valueFormatter: (params) => params.value || 0,
		},
		{
			headerName: '공개 여부',
			field: 'visibility',
			width: 100,
			sortable: true,
			valueFormatter: (params) => params.value === 'public' ? '공개' : '비공개',
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
			width: 150,
			cellRenderer: createActionRenderer(),
		},
	];

	function createActionRenderer() {
		return class ActionRenderer {
			eGui;
			params;

			init(params) {
				this.params = params;
				this.eGui = document.createElement('div');
				this.eGui.className = 'flex items-center gap-2 h-full';

				const viewBtn = document.createElement('a');
				viewBtn.href = `/service/${params.data.id}`;
				viewBtn.className = 'text-xs text-blue-600 hover:underline';
				viewBtn.textContent = '보기';

				const deleteBtn = document.createElement('button');
				deleteBtn.className = 'text-xs text-red-600 hover:underline';
				deleteBtn.textContent = '삭제';
				deleteBtn.onclick = () => this.handleDelete(params.data);

				this.eGui.appendChild(viewBtn);
				this.eGui.appendChild(deleteBtn);
			}

			getGui() {
				return this.eGui;
			}

			refresh() {
				return false;
			}

			async handleDelete(service) {
				if (!confirm(`"${service.title}" 서비스를 삭제하시겠습니까?`)) return;

				try {
					await api.services.delete(service.id);
					services = services.filter((s) => s.id !== service.id);
					show_toast('success', '서비스가 삭제되었습니다.');
				} catch (error) {
					console.error('Delete service error:', error);
					show_toast('error', '서비스 삭제에 실패했습니다.');
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
		<span class="text-lg font-semibold">서비스 공고 관리</span>
	{/snippet}
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">서비스 공고 관리</h1>
		<p class="mt-1 text-sm text-gray-500">
			총 {services.length}개의 서비스가 등록되어 있습니다.
		</p>
	</div>

	<AgGrid
		rowData={services}
		columnDefs={column_defs}
		defaultColDef={default_col_def}
		pagination={true}
		paginationPageSize={20}
	/>
</div>
