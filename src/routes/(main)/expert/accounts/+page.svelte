<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
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
	import ProposalModal from '$lib/components/modals/ProposalModal.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { my_requests, my_proposals, user } = $state(data);

	const TITLE = '외주 관리';

	// 탭 관련 상태
	let tabs = ['등록한 공고', '제안한 공고'];
	let selected_tab = $state(0);

	// 제안 수정 모달 상태
	let show_edit_modal = $state(false);
	let editing_proposal = $state(null);
	let edit_form = $state({
		message: '',
		quote_template_id: null,
		quote_data: null,
	});
	let my_templates = $state([]);
	let is_submitting = $state(false);

	// 견적서 템플릿 로드
	const load_my_templates = async () => {
		if (!user?.id) return;
		try {
			my_templates = await api.quote_templates.select_by_user_id(user.id);
		} catch (e) {
			console.error('Failed to load templates:', e);
		}
	};

	// 수정 모달 열기
	const open_edit_modal = (proposal) => {
		editing_proposal = proposal;
		edit_form = {
			message: proposal.message || '',
			quote_template_id: proposal.quote_template_id || null,
			quote_data: proposal.quote_data || null,
		};
		show_edit_modal = true;
	};

	// 제안 수정 제출
	const submit_edit = async () => {
		if (!editing_proposal || is_submitting) return;

		if (!edit_form.message?.trim()) {
			show_toast('error', '제안 메시지를 입력해주세요.');
			return;
		}

		is_submitting = true;
		try {
			await api.work_request_proposals.update(
				editing_proposal.id,
				{
					message: edit_form.message,
					proposed_amount:
						edit_form.quote_data?.price || editing_proposal.proposed_amount,
					quote_template_id: edit_form.quote_template_id,
					quote_data: edit_form.quote_data,
				},
				user.id,
			);

			show_toast('success', '제안이 수정되었습니다.');
			show_edit_modal = false;

			// 목록 새로고침
			my_proposals = await api.work_request_proposals.select_by_expert_id(
				user.id,
			);
		} catch (error) {
			console.error('Update error:', error);
			show_toast('error', error.message || '수정 중 오류가 발생했습니다.');
		} finally {
			is_submitting = false;
		}
	};
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
					<WorkRequestCard {request} href={`/work-request/${request.id}`} />
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
					<div class="mb-4 rounded-xl border border-gray-200 bg-white p-4">
						<!-- 제안 상태 + 금액 -->
						<div class="mb-3 flex items-center justify-between">
							<span
								class={`rounded-md px-2 py-0.5 text-xs font-medium ${proposalStatus.bgColor} ${proposalStatus.textColor}`}
							>
								{proposalStatus.text}
							</span>
							{#if proposal.proposed_amount}
								<span class="text-lg font-bold text-blue-600">
									₩{comma(proposal.proposed_amount)}
								</span>
							{/if}
						</div>

						<!-- 공고 정보 -->
						{#if request}
							<button
								onclick={() => goto(`/work-request/${request.id}`)}
								class="mb-3 w-full text-left"
							>
								<p class="text-xs text-gray-500">{request.category}</p>
								<h3 class="font-medium text-gray-900">{request.title}</h3>
							</button>
						{/if}

						<!-- 내 제안 메시지 -->
						<div class="border-t border-gray-100 pt-3">
							<p class="mb-1 text-xs font-medium text-gray-500">내 제안</p>
							<p class="line-clamp-2 text-sm text-gray-700">
								{proposal.message}
							</p>
						</div>

						<!-- 견적서 정보 -->
						{#if proposal.quote_data}
							<div class="mt-3 rounded-lg bg-blue-50 p-3">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-xs font-medium text-gray-500">견적서</p>
										<p class="font-medium text-gray-900">
											{proposal.quote_data.title || '견적서'}
										</p>
									</div>
									<span class="font-semibold text-blue-600">
										₩{comma(proposal.quote_data.price || 0)}
									</span>
								</div>
								{#if proposal.quote_data.duration}
									<p class="mt-1 text-xs text-gray-500">
										{proposal.quote_data.duration}
									</p>
								{/if}
								{#if proposal.quote_data.revision_policy}
									<p class="mt-1 text-xs text-gray-500">
										{proposal.quote_data.revision_policy}
									</p>
								{/if}
							</div>
						{/if}

						<!-- 수정 버튼 (pending 상태일 때만) -->
						{#if proposal.status === 'pending'}
							<button
								onclick={() => open_edit_modal(proposal)}
								class="mt-3 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
							>
								제안 수정하기
							</button>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</main>

<!-- 제안 수정 모달 -->
<ProposalModal
	bind:is_open={show_edit_modal}
	bind:form_data={edit_form}
	{my_templates}
	{is_submitting}
	is_edit_mode={true}
	on_submit={submit_edit}
	on_load_templates={load_my_templates}
/>
