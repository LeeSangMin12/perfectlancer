<script>
	import colors from '$lib/config/colors';
	import { comma, show_toast } from '$lib/utils/common';
	import { optimize_avatar } from '$lib/utils/image';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiEditLine,
		RiFileList3Line,
		RiRefund2Line,
	} from 'svelte-remixicon';

	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	let { data } = $props();
	let { work_request, proposal, user, is_requester } = $state(data);

	const quote = $derived(proposal.quote_data);

	let show_accept_modal = $state(false);

	// 제안 수락 → 결제 페이지로 이동
	const accept_proposal = () => {
		goto(`/work-request/${work_request.id}/payment?proposal_id=${proposal.id}`);
	};

	// 연락처 복사
	const copy_contact = async () => {
		if (!proposal.contact_info) {
			show_toast('error', '연락처 정보가 없습니다.');
			return;
		}
		try {
			await navigator.clipboard.writeText(proposal.contact_info);
			show_toast('success', '연락처가 클립보드에 복사되었습니다.');
		} catch (error) {
			show_toast('error', '복사에 실패했습니다.');
		}
	};

	// 데이터 가공
	const work_steps = $derived(
		Array.isArray(quote?.work_process)
			? quote.work_process.filter((s) => s.title)
			: [],
	);

	const deliverables = $derived(
		Array.isArray(quote?.deliverables)
			? quote.deliverables.filter((d) => d)
			: [],
	);

	const includes = $derived(
		Array.isArray(quote?.includes) ? quote.includes.filter((i) => i) : [],
	);
</script>

<svelte:head>
	<title>견적서 | {work_request.title}</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">견적서</h1>
	{/snippet}
</Header>

<main class="min-h-screen pb-32">
	{#if quote}
		<!-- 메인 카드: 전문가 + 가격 + 제목 -->
		<div class="bg-white">
			<div class="px-5 py-6">
				<!-- 전문가 프로필 -->
				<button
					class="mb-5 flex items-center gap-3"
					onclick={() =>
						proposal.users?.handle && goto(`/@${proposal.users.handle}`)}
				>
					<div
						class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100"
					>
						{#if proposal.users?.avatar_url}
							<img
								src={optimize_avatar(proposal.users.avatar_url)}
								alt=""
								class="h-full w-full object-cover"
							/>
						{:else}
							<span class="text-lg font-medium text-gray-400">
								{(proposal.users?.name ||
									proposal.users?.handle)?.[0]?.toUpperCase()}
							</span>
						{/if}
					</div>
					<div class="text-left">
						<p class="text-base font-semibold text-gray-900">
							{proposal.users?.name || proposal.users?.handle}
						</p>
						<p class="text-sm text-gray-500">
							{new Date(proposal.created_at).toLocaleDateString('ko-KR', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})} 제안
						</p>
					</div>
				</button>

				<!-- 견적서 제목 & 가격 -->
				<div class="border-t border-gray-100 pt-5">
					<h2 class="mb-2 text-lg font-bold text-gray-900">
						{quote.title || '견적서'}
					</h2>
					<div class="flex items-baseline gap-2">
						<span class="text-xl font-bold text-gray-900"
							>₩{comma(quote.price || 0)}</span
						>
						{#if quote.duration}
							<span class="text-sm text-gray-500">· 예상 {quote.duration}</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- 제안 메시지 -->
		<div class="border-t border-gray-100 bg-white px-5 py-6">
			<h3 class="mb-3 text-base font-bold text-gray-900">제안 메시지</h3>
			<p class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">
				{proposal.message}
			</p>
		</div>

		<!-- 서비스 설명 -->
		{#if quote.description && quote.description !== '<p></p>'}
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-3 text-base font-bold text-gray-900">서비스 설명</h3>
				<div
					class="prose prose-sm max-w-none text-[15px] leading-relaxed text-gray-700"
				>
					{@html quote.description}
				</div>
			</div>
		{/if}

		<!-- 추천 대상 -->
		{#if quote.target_audience}
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-3 text-base font-bold text-gray-900">
					이런 분께 추천드립니다
				</h3>
				<p
					class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700"
				>
					{quote.target_audience}
				</p>
			</div>
		{/if}

		<!-- 작업 프로세스 -->
		{#if work_steps.length > 0}
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-5 text-base font-bold text-gray-900">작업 프로세스</h3>
				<div class="flex justify-center">
					<div class="inline-flex flex-col">
						{#each work_steps as step, index}
							<div
								class="flex gap-4 {index < work_steps.length - 1 ? 'pb-5' : ''}"
							>
								<!-- 타임라인 -->
								<div class="flex flex-col items-center">
									<div
										class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400 text-sm text-white"
									>
										{index + 1}
									</div>
									{#if index < work_steps.length - 1}
										<div class="mt-2 w-0.5 flex-1 bg-blue-100"></div>
									{/if}
								</div>
								<!-- 내용 -->
								<div class="pb-1">
									<p class="text-[15px] font-semibold text-gray-900">
										{step.title}
									</p>
									{#if step.description}
										<p class="mt-1 text-sm text-gray-500">{step.description}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- 산출물 -->
		{#if deliverables.length > 0}
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-3 text-base font-bold text-gray-900">받으시는 산출물</h3>
				<div class="space-y-2">
					{#each deliverables as item}
						<div class="flex items-start gap-2">
							<span class="text-gray-400">•</span>
							<span class="text-[15px] text-gray-700">{item}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 포함 사항 -->
		{#if includes.length > 0}
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-3 text-base font-bold text-gray-900">포함 사항</h3>
				<div class="flex flex-wrap gap-2">
					{#each includes as item}
						<span
							class="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
						>
							{item}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 수정 및 환불 정책 -->
		{#if quote.revision_policy || quote.refund_policy}
			<div class="space-y-4 border-t border-gray-100 bg-white px-5 py-6">
				{#if quote.revision_policy}
					<div>
						<div class="mb-2 flex items-center gap-1.5">
							<RiEditLine size={14} class="text-gray-400" />
							<p class="text-[13px] font-medium text-gray-400">
								수정 및 재진행
							</p>
						</div>
						<p
							class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700"
						>
							{quote.revision_policy}
						</p>
					</div>
				{/if}

				{#if quote.refund_policy}
					<div>
						<div class="mb-2 flex items-center gap-1.5">
							<RiRefund2Line size={14} class="text-gray-400" />
							<p class="text-[13px] font-medium text-gray-400">
								취소 및 환불 규정
							</p>
						</div>
						<p
							class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700"
						>
							{quote.refund_policy}
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- FAQ -->
		{#if Array.isArray(quote.faq) && quote.faq.length > 0}
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-4 text-base font-bold text-gray-900">자주 묻는 질문</h3>
				<div class="space-y-4">
					{#each quote.faq as faq}
						<div>
							<p class="text-[15px] font-medium text-gray-900 mb-1">Q. {faq.question}</p>
							<p class="text-[15px] text-gray-600">A. {faq.answer}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<!-- 견적서 없음 - 메시지만 표시 -->
		<div class="bg-white">
			<div class="px-5 py-6">
				<button
					class="mb-5 flex items-center gap-3"
					onclick={() =>
						proposal.users?.handle && goto(`/@${proposal.users.handle}`)}
				>
					<div
						class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100"
					>
						{#if proposal.users?.avatar_url}
							<img
								src={optimize_avatar(proposal.users.avatar_url)}
								alt=""
								class="h-full w-full object-cover"
							/>
						{:else}
							<span class="text-lg font-medium text-gray-400">
								{(proposal.users?.name ||
									proposal.users?.handle)?.[0]?.toUpperCase()}
							</span>
						{/if}
					</div>
					<div class="text-left">
						<p class="text-base font-semibold text-gray-900">
							{proposal.users?.name || proposal.users?.handle}
						</p>
						<p class="text-sm text-gray-500">
							{new Date(proposal.created_at).toLocaleDateString('ko-KR', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})} 제안
						</p>
					</div>
				</button>
			</div>
		</div>

		<div class="mt-2 bg-white px-5 py-5">
			<h3 class="mb-3 text-base font-bold text-gray-900">제안 메시지</h3>
			<p class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">
				{proposal.message}
			</p>
		</div>

		<div class="mt-2 bg-white px-5 py-10 text-center">
			<div
				class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"
			>
				<RiFileList3Line size={28} class="text-gray-400" />
			</div>
			<p class="text-gray-500">
				이 제안에는 상세 견적서가 포함되어 있지 않아요
			</p>
		</div>
	{/if}
</main>

<!-- 하단 버튼 -->
{#if is_requester}
	<FixedBottomButton>
		<button onclick={copy_contact} class="btn btn-gray flex-1">
			문의하기
		</button>
		{#if proposal.status === 'pending' && ['open', 'in_progress'].includes(work_request.status)}
			<button onclick={() => show_accept_modal = true} class="btn btn-primary flex-1">
				수락하기
			</button>
		{/if}
	</FixedBottomButton>
{/if}

<ConfirmModal
	bind:is_open={show_accept_modal}
	title="이 제안을 수락할까요?"
	description="제안 금액: ₩{comma(proposal.proposed_amount)}"
	button_2_text="수락"
	button_2_action={accept_proposal}
/>
