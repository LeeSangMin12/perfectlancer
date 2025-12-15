<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { comma } from '$lib/utils/common';
	import {
		get_proposal_status_display,
		get_request_status_display,
	} from '$lib/utils/expert_request_utils';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import WorkRequestCard from '$lib/components/domain/outsourcing/WorkRequestCard.svelte';

	const me = get_user_context();

	let { data } = $props();
	let { my_requests, my_proposals } = $state(data);

	const TITLE = '외주 관리';

	// 탭 관련 상태
	let tabs = ['등록한 공고', '제안한 공고'];
	let selected_tab = $state(0);
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta
		name="description"
		content="내가 등록하고 제안한 외주 공고를 관리하세요."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={() => goto(`/@${me?.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{TITLE}</h1>
	{/snippet}
</Header>

<main class="min-h-screen pb-20">
	<!-- 탭 선택기 -->
	<div class="bg-white px-4 py-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	<!-- 탭 1: 등록한 공고 -->
	{#if selected_tab === 0}
		<div class="px-4">
			{#if my_requests.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">등록한 공고가 없습니다.</p>
				</div>
			{:else}
				{#each my_requests as request}
					<WorkRequestCard
						{request}
						href={`/work-request/${request.id}`}
					/>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- 탭 2: 제안한 공고 -->
	{#if selected_tab === 1}
		<div class="px-4">
			{#if my_proposals.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">제안한 공고가 없습니다.</p>
				</div>
			{:else}
				{#each my_proposals as proposal}
					{@const request = proposal.work_requests}
					{@const proposalStatus = get_proposal_status_display(proposal.status)}
					<div class="mb-4">
						<!-- 제안 상태 표시 -->
						<div class="mb-2 flex items-center gap-2">
							<span
								class={`rounded-md px-2 py-0.5 text-xs font-medium ${proposalStatus.bgColor} ${proposalStatus.textColor}`}
							>
								{proposalStatus.text}
							</span>
							{#if proposal.proposed_amount}
								<span class="text-sm font-medium text-blue-600">
									₩{comma(proposal.proposed_amount)}
								</span>
							{/if}
						</div>

						{#if request}
							<WorkRequestCard
								{request}
								href={`/work-request/${request.id}`}
							/>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</main>

<Bottom_nav />
