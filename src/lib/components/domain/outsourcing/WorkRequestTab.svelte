<script>
	/**
	 * 외주 공고 탭 컴포넌트
	 * @component
	 */
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import WorkRequestCard from './WorkRequestCard.svelte';
	import FloatingActionButton from '$lib/components/shared/FloatingActionButton.svelte';
	import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Object} work_request_data - 외주 공고 데이터 객체
	 * @property {Object} infinite_scroll - 무한 스크롤 객체
	 * @property {string} job_type - 작업 유형 ('sidejob' | 'fulltime')
	 * @property {Array<string>} bookmarked_ids - 북마크된 외주 공고 ID 목록
	 * @property {Function} on_bookmark_changed - 북마크 변경 콜백
	 */

	let { work_request_data, infinite_scroll, job_type, bookmarked_ids = [], on_bookmark_changed } = $props();

	/**
	 * 무한 스크롤 초기화 및 옵저버 설정
	 */
	$effect(() => {
		infinite_scroll.initializeLastId();
		const cleanup = infinite_scroll.setupObserver();
		return cleanup;
	});
</script>

<div class="min-h-screen bg-white">
	<div class="px-4 pb-20">
		{#if work_request_data.work_requests.length > 0}
			<div class="mt-8 space-y-4">
				{#each work_request_data.work_requests as request (request.id)}
					<WorkRequestCard
						{request}
						is_bookmarked={bookmarked_ids.includes(String(request.id))}
						{on_bookmark_changed}
					/>
				{/each}
			</div>
		{:else}
			<EmptyState
				title="아직 등록된 공고가 없어요"
				description="첫 번째로 외주를 등록해보세요!"
			/>
		{/if}
	</div>

	<div id="work_infinite_scroll"></div>
	<LoadingSpinner is_loading={work_request_data.is_infinite_loading} />
</div>

<FloatingActionButton href={`/regi/work-request?job_type=${job_type}`} />
