<script>
	import { create_work_request_data } from '$lib/composables/use_work_request_data.svelte.js';
	import { create_infinite_scroll } from '$lib/composables/use_infinite_scroll.svelte.js';
	import { get_api_context, get_user_context } from '$lib/contexts/app_context.svelte.js';
	import five_thousand_coupon_png from '$lib/img/common/banner/5,000_coupon.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import WorkRequestTab from '$lib/components/domain/outsourcing/WorkRequestTab.svelte';

	import Banner from '../service/Banner.svelte';
	import SearchInput from '../service/SearchInput.svelte';

	// ===== Constants =====
	const TITLE = '외주';
	const TABS = ['사이드잡', '풀타임잡'];
	const JOB_TYPES = ['sidejob', 'fulltime'];
	const BANNER_IMAGES = [
		{
			title: '5,000_coupon',
			src: five_thousand_coupon_png,
			url: '/event/5,000_coupon',
		},
		{
			title: 'leave_opinion',
			src: leave_opinion_png,
			url: 'https://forms.gle/ZjxT8S4BmsBHsfv87',
		},
	];

	// ===== Context =====
	const api = get_api_context();
	const me = get_user_context();

	// ===== Props =====
	let { data } = $props();

	// ===== Bookmark State =====
	let bookmarked_ids = $state(data.bookmarked_ids || []);

	// ===== State =====
	let selected_tab = $state(0);
	let search_text = $state('');

	// ===== Helper Functions =====
	function create_infinite_scroll_config(request_data) {
		return {
			items: {
				get value() {
					return request_data.work_requests;
				},
			},
			loadMore: request_data.load_more_work_requests,
			isLoading: {
				get value() {
					return request_data.is_infinite_loading;
				},
				set value(val) {
					request_data.is_infinite_loading = val;
				},
			},
			targetId: 'work_infinite_scroll',
		};
	}

	// ===== Data Management =====
	const sidejob_data = create_work_request_data(
		{ work_requests: data.sidejob_requests || [] },
		api,
		JOB_TYPES[0],
	);

	const fulltime_data = create_work_request_data(
		{ work_requests: data.fulltime_requests || [] },
		api,
		JOB_TYPES[1],
	);

	const sidejob_infinite_scroll = create_infinite_scroll(
		create_infinite_scroll_config(sidejob_data),
	);
	const fulltime_infinite_scroll = create_infinite_scroll(
		create_infinite_scroll_config(fulltime_data),
	);

	// ===== Derived State =====
	// 탭에 따라 달라지는 값들을 하나의 derived로 통합
	const current = $derived.by(() => {
		const is_sidejob = selected_tab === 0;
		return {
			data: is_sidejob ? sidejob_data : fulltime_data,
			infinite_scroll: is_sidejob ? sidejob_infinite_scroll : fulltime_infinite_scroll,
			job_type: JOB_TYPES[selected_tab],
			initial_requests: is_sidejob ? data.sidejob_requests : data.fulltime_requests,
		};
	});

	// ===== Event Handlers =====
	const handle_search = async () => {
		const trimmed = search_text.trim();

		if (trimmed) {
			const results = await api.work_requests.select_by_search(trimmed);
			current.data.work_requests = results;
		} else {
			current.data.work_requests = current.initial_requests;
		}

		const last_request =
			current.data.work_requests[current.data.work_requests.length - 1];
		current.infinite_scroll.lastId = last_request?.id || '';
	};

	// 북마크 변경 핸들러
	const handle_bookmark_changed = (event) => {
		if (event.action === 'add') {
			bookmarked_ids = [...bookmarked_ids, String(event.work_request_id)];
		} else {
			bookmarked_ids = bookmarked_ids.filter(id => id !== String(event.work_request_id));
		}
	};
</script>

<svelte:head>
	<title>외주 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="사이드잡부터 풀타임 외주까지 다양한 프로젝트를 찾아보세요."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<h1 class="font-semibold">{TITLE}</h1>
	{/snippet}
</Header>

<main>
	<TabSelector tabs={TABS} bind:selected={selected_tab} />

	<SearchInput
		placeholder="원하는 외주 프로젝트를 검색해보세요"
		bind:value={search_text}
		onSearch={handle_search}
	/>

	<section class="flex flex-col items-center">
		<Banner images={BANNER_IMAGES} />
	</section>

	<WorkRequestTab
		work_request_data={current.data}
		infinite_scroll={current.infinite_scroll}
		job_type={current.job_type}
		{bookmarked_ids}
		on_bookmark_changed={handle_bookmark_changed}
	/>
</main>

<Bottom_nav />
