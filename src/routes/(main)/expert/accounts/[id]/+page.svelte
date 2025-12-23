<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
	import { get_request_status_display } from '$lib/utils/expert_request_utils';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { work_request, accepted_proposal, is_requester } = $state(data);

	const TITLE = '공고 상세';

	const status_display = $derived(
		get_request_status_display(work_request.status),
	);

	const get_price_unit_label = (unit) => {
		const unit_map = {
			per_project: '건당',
			per_hour: '시간당',
			per_page: '장당',
			per_day: '일당',
			per_month: '월',
			per_year: '년',
		};
		return unit_map[unit] || '건당';
	};
</script>

<svelte:head>
	<title>{TITLE} | 퍼펙트랜서</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{TITLE}</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-gray-50 px-4 pt-4 pb-24">
	<!-- 프로젝트 정보 -->
	<div class="rounded-xl border border-gray-200 bg-white p-4">
		<!-- 상단: 제목 + 상태 -->
		<div class="mb-4 flex items-start justify-between">
			<div class="flex-1">
				<p class="text-xs text-gray-500">{work_request.category}</p>
				<h2 class="mt-1 font-semibold text-gray-900">{work_request.title}</h2>
			</div>
			<span
				class={`rounded-md px-2.5 py-1 text-xs font-medium ${status_display.bgColor} ${status_display.textColor}`}
			>
				{status_display.text}
			</span>
		</div>

		<!-- 거래 당사자 -->
		<div class="space-y-2 border-t border-gray-100 pt-4">
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-500">의뢰인</span>
				<span class="text-gray-900">
					{work_request.users?.name || work_request.users?.handle}
					{#if is_requester}<span class="text-blue-600">(나)</span>{/if}
				</span>
			</div>
			{#if accepted_proposal}
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">선택된 전문가</span>
					<span class="text-gray-900">
						{accepted_proposal.users?.name || accepted_proposal.users?.handle}
					</span>
				</div>
			{/if}
		</div>

		<!-- 보상금 -->
		<div class="mt-4 border-t border-gray-100 pt-4">
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-500">보상금</span>
				<span class="text-lg font-bold text-blue-600">
					{#if work_request.price_unit === 'quote' || !work_request.reward_amount}
						제안 받기
					{:else}
						{get_price_unit_label(work_request.price_unit)}
						₩{comma(work_request.reward_amount)}
					{/if}
				</span>
			</div>
		</div>

		<!-- 공고 보기 링크 -->
		<button
			onclick={() => goto(`/work-request/${work_request.id}`)}
			class="mt-4 text-sm text-gray-500 hover:text-gray-700"
		>
			공고 상세 보기 →
		</button>
	</div>

	<!-- 진행 상태 -->
	<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
		<h3 class="mb-3 text-sm font-medium text-gray-900">진행 상태</h3>
		<div class="flex items-center gap-3">
			{#each ['모집중', '진행중', '완료'] as step, i}
				{@const is_done =
					i === 0 ||
					(i === 1 &&
						(work_request.status === 'in_progress' ||
							work_request.status === 'completed')) ||
					(i === 2 && work_request.status === 'completed')}
				<div class="flex items-center gap-2">
					<div
						class={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
							is_done ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
						}`}
					>
						{is_done ? '✓' : i + 1}
					</div>
					<span
						class={`text-xs ${is_done ? 'text-gray-900' : 'text-gray-400'}`}
					>
						{step}
					</span>
				</div>
				{#if i < 2}
					<div
						class={`h-px flex-1 ${is_done ? 'bg-gray-300' : 'bg-gray-200'}`}
					></div>
				{/if}
			{/each}
		</div>
	</div>
</main>
