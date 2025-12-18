<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let {
		rowData = [],
		columnDefs = [],
		defaultColDef = {
			sortable: true,
			filter: true,
			resizable: true,
		},
		pagination = true,
		paginationPageSize = 20,
		domLayout = 'autoHeight',
		onGridReady = null,
		getRowId = null,
		rowSelection = 'single',
		autoSizeStrategy = { type: 'fitGridWidth' },
		class: className = '',
	} = $props();

	let gridDiv;
	let gridApi = null;
	let isReady = $state(false);

	onMount(async () => {
		if (!browser) return;

		// 동적 import로 ag-grid 로드 (SSR 방지)
		const { createGrid, ModuleRegistry, AllCommunityModule, themeAlpine } = await import('ag-grid-community');

		// 모듈 등록 (v35 필수)
		ModuleRegistry.registerModules([AllCommunityModule]);

		const gridOptions = {
			theme: themeAlpine,
			columnDefs,
			defaultColDef,
			rowData,
			pagination,
			paginationPageSize,
			domLayout,
			rowSelection,
			getRowId,
			autoSizeStrategy,
			onGridReady: (params) => {
				gridApi = params.api;
				isReady = true;
				if (onGridReady) {
					onGridReady(params);
				}
			},
		};

		createGrid(gridDiv, gridOptions);
	});

	onDestroy(() => {
		if (gridApi) {
			gridApi.destroy();
		}
	});

	// rowData 변경 시 그리드 업데이트
	$effect(() => {
		if (gridApi && rowData && isReady) {
			gridApi.setGridOption('rowData', rowData);
		}
	});

	// columnDefs 변경 시 그리드 업데이트
	$effect(() => {
		if (gridApi && columnDefs && isReady) {
			gridApi.setGridOption('columnDefs', columnDefs);
		}
	});
</script>

<div bind:this={gridDiv} class={className} style="width: 100%; min-height: 200px;"></div>
