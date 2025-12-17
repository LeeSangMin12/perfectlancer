<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { check_login, comma, show_toast } from '$lib/utils/common';
	import {
		get_request_status_display,
		SUCCESS_MESSAGES,
	} from '$lib/utils/expert_request_utils';
	import { optimize_avatar } from '$lib/utils/image';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiCloseLine,
		RiEditLine,
		RiRefund2Line,
	} from 'svelte-remixicon';

	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import ServiceProposal from '$lib/components/domain/service/ServiceProposal.svelte';
	import SimpleEditor from '$lib/components/shared/tiptap-templates/simple/simple-editor.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { work_request, my_templates, user } = $state(data);

	// 뷰 모드: 'form' | 'template_list' | 'preview'
	let view_mode = $state('form');

	// 제안 메시지
	let message = $state('');

	// 견적서 사용 여부
	let use_quote = $state(false);
	let selected_template_id = $state(null);

	// 견적서 폼 데이터
	let quote_form = $state({
		title: '',
		description: '',
		price: '',
		duration: '',
		target_audience: '',
		work_process: [{ title: '', description: '' }],
		deliverables: [''],
		includes: [''],
		revision_policy: '',
		refund_policy: '',
		faq: [{ question: '', answer: '' }],
	});

	let is_submitting = $state(false);

	// 템플릿 선택
	const select_template = (template) => {
		selected_template_id = template.id;
		quote_form = {
			title: template.title || '',
			description: template.description || '',
			price: template.price ? template.price.toLocaleString() : '',
			duration: template.duration || '',
			target_audience: template.target_audience || '',
			work_process:
				Array.isArray(template.work_process) && template.work_process.length > 0
					? template.work_process
					: [{ title: '', description: '' }],
			deliverables:
				Array.isArray(template.deliverables) && template.deliverables.length > 0
					? template.deliverables
					: [''],
			includes:
				Array.isArray(template.includes) && template.includes.length > 0
					? template.includes
					: [''],
			revision_policy:
				template.revision_scope || template.revision_policy || '',
			refund_policy:
				typeof template.refund_policy === 'string'
					? template.refund_policy
					: '',
			faq:
				Array.isArray(template.faq) && template.faq.length > 0
					? template.faq
					: [{ question: '', answer: '' }],
		};
		use_quote = true;
		view_mode = 'form';
	};

	// 견적서 삭제
	const clear_quote = () => {
		use_quote = false;
		selected_template_id = null;
		quote_form = {
			title: '',
			description: '',
			price: '',
			duration: '',
			target_audience: '',
			work_process: [{ title: '', description: '' }],
			deliverables: [''],
			includes: [''],
			revision_policy: '',
			refund_policy: '',
			faq: [{ question: '', answer: '' }],
		};
	};

	// 작업 프로세스 관리
	const add_step = () => {
		quote_form.work_process = [
			...quote_form.work_process,
			{ title: '', description: '' },
		];
	};

	const remove_step = (index) => {
		if (quote_form.work_process.length <= 1) return;
		quote_form.work_process = quote_form.work_process.filter(
			(_, i) => i !== index,
		);
	};

	// 산출물 관리
	const add_deliverable = () => {
		quote_form.deliverables = [...quote_form.deliverables, ''];
	};

	const remove_deliverable = (index) => {
		if (quote_form.deliverables.length <= 1) return;
		quote_form.deliverables = quote_form.deliverables.filter(
			(_, i) => i !== index,
		);
	};

	// 포함 사항 관리
	const add_include = () => {
		quote_form.includes = [...quote_form.includes, ''];
	};

	const remove_include = (index) => {
		if (quote_form.includes.length <= 1) return;
		quote_form.includes = quote_form.includes.filter((_, i) => i !== index);
	};

	// FAQ 관리
	const add_faq = () => {
		quote_form.faq = [...quote_form.faq, { question: '', answer: '' }];
	};

	const remove_faq = (index) => {
		if (quote_form.faq.length <= 1) return;
		quote_form.faq = quote_form.faq.filter((_, i) => i !== index);
	};

	// 미리보기용 데이터
	const preview_steps = $derived(
		quote_form.work_process
			.filter((s) => s.title.trim())
			.map((s) => ({ title: s.title, description: s.description })),
	);

	const preview_deliverables = $derived(
		quote_form.deliverables.filter((d) => d.trim()),
	);

	const preview_includes = $derived(
		quote_form.includes.filter((i) => i.trim()),
	);

	const preview_faq = $derived(
		quote_form.faq.filter((f) => f.question.trim() && f.answer.trim()),
	);

	// 유효성 검사
	const validate = () => {
		if (!message.trim()) {
			show_toast('error', '제안 메시지를 입력해주세요.');
			return false;
		}
		return true;
	};

	// 제안 제출
	const submit_proposal = async () => {
		if (!validate() || is_submitting) return;

		is_submitting = true;
		update_global_store('loading', true);

		try {
			// 연락처 정보
			const contact_phone = me.user_contact?.contact_phone || '';
			const formatted_contact =
				contact_phone.length === 11
					? `${contact_phone.slice(0, 3)}-${contact_phone.slice(3, 7)}-${contact_phone.slice(7)}`
					: contact_phone;

			// 견적서 데이터 구성
			let quote_data = null;
			if (use_quote && quote_form.title.trim()) {
				quote_data = {
					title: quote_form.title.trim(),
					description: quote_form.description,
					price: quote_form.price
						? parseInt(quote_form.price.replace(/,/g, ''))
						: null,
					duration: quote_form.duration.trim() || null,
					target_audience: quote_form.target_audience.trim() || null,
					work_process: quote_form.work_process.filter((s) => s.title.trim()),
					deliverables: quote_form.deliverables.filter((d) => d.trim()),
					includes: quote_form.includes.filter((i) => i.trim()),
					revision_policy: quote_form.revision_policy.trim() || '',
					refund_policy: quote_form.refund_policy.trim() || '',
					faq: quote_form.faq.filter(
						(f) => f.question.trim() && f.answer.trim(),
					),
				};
			}

			await api.work_request_proposals.insert(
				{
					work_request_id: work_request.id,
					message: message.trim(),
					contact_info: formatted_contact || null,
					proposed_amount: quote_data?.price || 0,
					quote_template_id: selected_template_id,
					quote_data: quote_data,
				},
				user.id,
			);

			show_toast('success', SUCCESS_MESSAGES.PROPOSAL_SUBMITTED);
			goto(`/work-request/${work_request.id}`, { replaceState: true });
		} catch (error) {
			console.error('Proposal submission error:', error);

			let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
			if (error.message?.includes('로그인')) {
				errorMessage = '로그인이 필요합니다.';
			} else if (error.message?.includes('마감된')) {
				errorMessage = ERROR_MESSAGES.REQUEST_NOT_OPEN;
			} else if (error.message?.includes('이미')) {
				errorMessage = ERROR_MESSAGES.ALREADY_PROPOSED;
			} else if (error.message?.includes('자신의')) {
				errorMessage = '자신의 요청에는 제안할 수 없습니다.';
			}

			show_toast('error', errorMessage);
		} finally {
			is_submitting = false;
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>제안하기 | {work_request.title}</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button
			onclick={() => {
				if (view_mode === 'template_list') {
					view_mode = 'form';
				} else if (view_mode === 'preview') {
					view_mode = 'form';
				} else {
					smart_go_back();
				}
			}}
		>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">
			{#if view_mode === 'template_list'}
				견적서 템플릿 선택
			{:else if view_mode === 'preview'}
				미리보기
			{:else}
				제안하기
			{/if}
		</h1>
	{/snippet}
	{#snippet right()}
		{#if view_mode === 'form' && use_quote}
			<button
				onclick={() => (view_mode = 'preview')}
				class="text-sm font-medium text-blue-600"
			>
				미리보기
			</button>
		{/if}
	{/snippet}
</Header>

{#if view_mode === 'template_list'}
	<!-- 템플릿 선택 화면 -->
	<main class="min-h-screen px-4 py-6 pb-28">
		{#if my_templates.length > 0}
			<ul class="space-y-3">
				{#each my_templates as template}
					<li>
						<button
							onclick={() => select_template(template)}
							class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
						>
							<div class="min-w-0 flex-1">
								<p class="font-medium text-gray-900">{template.title}</p>
								<div class="mt-1 flex items-center gap-2">
									<span class="text-sm font-semibold text-blue-600">
										{#if template.price}
											₩{comma(template.price)}
										{:else}
											가격 미설정
										{/if}
									</span>
									{#if template.duration}
										<span class="text-xs text-gray-500"
											>· {template.duration}</span
										>
									{/if}
								</div>
							</div>
							<RiArrowRightSLine size={20} color={colors.gray[400]} />
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="py-16 text-center">
				<p class="text-gray-500">저장된 템플릿이 없어요</p>
				<p class="mt-1 text-sm text-gray-400">
					아래에서 직접 견적서를 작성하거나<br />
					먼저 템플릿을 만들어주세요
				</p>
				<a
					href="/regi/quote-template"
					class="mt-4 inline-block text-sm font-medium text-blue-600"
				>
					템플릿 만들러 가기
				</a>
			</div>
		{/if}

		<!-- 템플릿 없이 직접 작성 버튼 -->
		<div class="mt-6 border-t border-gray-100 pt-6">
			<button
				onclick={() => {
					use_quote = true;
					view_mode = 'form';
				}}
				class="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
			>
				템플릿 없이 직접 작성하기
			</button>
		</div>
	</main>
{:else if view_mode === 'preview'}
	<!-- 미리보기 모드 -->
	<main class="min-h-screen pb-32">
		{#if use_quote}
			<!-- 견적서 헤더 (프로필 + 가격 + 제목) -->
			<div class="bg-white">
				<div class="px-5 py-6">
					<!-- 전문가 프로필 -->
					<div class="mb-5 flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100"
						>
							{#if me.avatar_url}
								<img
									src={optimize_avatar(me.avatar_url)}
									alt=""
									class="h-full w-full object-cover"
								/>
							{:else}
								<span class="text-lg font-medium text-gray-400">
									{(me.name || me.handle)?.[0]?.toUpperCase()}
								</span>
							{/if}
						</div>
						<div class="text-left">
							<p class="text-base font-semibold text-gray-900">
								{me.name || me.handle}
							</p>
							<p class="text-sm text-gray-500">
								{new Date().toLocaleDateString('ko-KR', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})} 제안
							</p>
						</div>
					</div>

					<!-- 견적서 제목 & 가격 -->
					<div class="border-t border-gray-100 pt-5">
						<h2 class="mb-2 text-lg font-bold text-gray-900">
							{quote_form.title || '견적서'}
						</h2>
						<div class="flex items-baseline gap-2">
							{#if quote_form.price}
								<span class="text-xl font-bold text-gray-900"
									>₩{comma(parseInt(quote_form.price.replace(/,/g, '') || 0))}</span
								>
							{/if}
							{#if quote_form.duration}
								<span class="text-sm text-gray-500"
									>· 예상 {quote_form.duration}</span
								>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- 제안 메시지 -->
			<div class="border-t border-gray-100 bg-white px-5 py-6">
				<h3 class="mb-3 text-base font-bold text-gray-900">제안 메시지</h3>
				<p class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">
					{message || '(메시지 없음)'}
				</p>
			</div>

			<!-- 서비스 설명 -->
			{#if quote_form.description && quote_form.description !== '<p></p>'}
				<div class="border-t border-gray-100 bg-white px-5 py-6">
					<h3 class="mb-3 text-base font-bold text-gray-900">서비스 설명</h3>
					<div
						class="prose prose-sm max-w-none text-[15px] leading-relaxed text-gray-700"
					>
						{@html quote_form.description}
					</div>
				</div>
			{/if}

			<!-- 추천 대상 -->
			{#if quote_form.target_audience}
				<div class="border-t border-gray-100 bg-white px-5 py-6">
					<h3 class="mb-3 text-base font-bold text-gray-900">
						이런 분께 추천드립니다
					</h3>
					<p
						class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700"
					>
						{quote_form.target_audience}
					</p>
				</div>
			{/if}

			<!-- 작업 프로세스 -->
			{#if preview_steps.length > 0}
				<div class="border-t border-gray-100 bg-white px-5 py-6">
					<h3 class="mb-5 text-base font-bold text-gray-900">작업 프로세스</h3>
					<div class="flex justify-center">
						<div class="inline-flex flex-col">
							{#each preview_steps as step, index}
								<div
									class="flex gap-4 {index < preview_steps.length - 1
										? 'pb-5'
										: ''}"
								>
									<div class="flex flex-col items-center">
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400 text-sm text-white"
										>
											{index + 1}
										</div>
										{#if index < preview_steps.length - 1}
											<div class="mt-2 w-0.5 flex-1 bg-blue-100"></div>
										{/if}
									</div>
									<div class="pb-1">
										<p class="text-[15px] font-semibold text-gray-900">
											{step.title}
										</p>
										{#if step.description}
											<p class="mt-1 text-sm text-gray-500">
												{step.description}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- 산출물 -->
			{#if preview_deliverables.length > 0}
				<div class="border-t border-gray-100 bg-white px-5 py-6">
					<h3 class="mb-3 text-base font-bold text-gray-900">받으시는 산출물</h3>
					<div class="space-y-2">
						{#each preview_deliverables as item}
							<div class="flex items-start gap-2">
								<span class="text-gray-400">•</span>
								<span class="text-[15px] text-gray-700">{item}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 포함 사항 -->
			{#if preview_includes.length > 0}
				<div class="border-t border-gray-100 bg-white px-5 py-6">
					<h3 class="mb-3 text-base font-bold text-gray-900">포함 사항</h3>
					<div class="flex flex-wrap gap-2">
						{#each preview_includes as item}
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
			{#if quote_form.revision_policy || quote_form.refund_policy}
				<div class="space-y-4 border-t border-gray-100 bg-white px-5 py-6">
					{#if quote_form.revision_policy}
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
								{quote_form.revision_policy}
							</p>
						</div>
					{/if}

					{#if quote_form.refund_policy}
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
								{quote_form.refund_policy}
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- FAQ -->
			{#if preview_faq.length > 0}
				<div class="border-t border-gray-100 bg-white px-5 py-6">
					<h3 class="mb-4 text-base font-bold text-gray-900">자주 묻는 질문</h3>
					<div class="space-y-4">
						{#each preview_faq as faq}
							<div>
								<p class="mb-1 text-[15px] font-medium text-gray-900">
									Q. {faq.question}
								</p>
								<p class="text-[15px] text-gray-600">A. {faq.answer}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<!-- 견적서 없이 메시지만 있는 경우 -->
			<div class="bg-white px-5 py-6">
				<h3 class="mb-3 text-base font-bold text-gray-900">제안 메시지</h3>
				<p class="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">
					{message || '(메시지 없음)'}
				</p>
			</div>
		{/if}
	</main>

	<FixedBottomButton>
		<button class="btn btn-gray flex-1" onclick={() => (view_mode = 'form')}>
			수정하기
		</button>
		<button
			class="btn btn-primary flex-1"
			onclick={submit_proposal}
			disabled={is_submitting}
		>
			{is_submitting ? '제출 중...' : '제안 제출'}
		</button>
	</FixedBottomButton>
{:else}
	<!-- 폼 모드 -->
	<main class="space-y-8 px-4 py-6 pb-28">
		<!-- 공고 정보 상세 -->
		<div class="rounded-xl border border-gray-200 bg-white p-5">
			<!-- 카테고리 + 상태 -->
			<div class="mb-3 flex items-start justify-between">
				{#if work_request.category}
					<span
						class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
					>
						{work_request.category}
					</span>
				{/if}
				<span
					class={`rounded-md px-2.5 py-1 text-xs font-medium ${get_request_status_display(work_request.status).bgColor} ${get_request_status_display(work_request.status).textColor}`}
				>
					{get_request_status_display(work_request.status).text}
				</span>
			</div>

			<!-- 제목 -->
			<h2 class="mb-2 text-lg font-semibold text-gray-900">
				{work_request.title}
			</h2>

			<!-- 가격 -->
			<p class="mb-4 text-lg font-medium text-blue-600">
				{#if work_request.price_unit === 'quote' || !work_request.reward_amount}
					제안 받기
				{:else}
					{work_request.price_unit === 'per_project'
						? '건당'
						: work_request.price_unit === 'per_hour'
							? '시간당'
							: '건당'}
					{comma(work_request.reward_amount)}원
				{/if}
			</p>

			<!-- 메타 정보 -->
			<div class="space-y-2 text-sm">
				{#if work_request.posting_start_date && work_request.posting_end_date}
					<div class="flex">
						<span class="w-20 text-gray-500">공고 기간</span>
						<span class="text-gray-900">
							{new Date(work_request.posting_start_date).toLocaleDateString(
								'ko-KR',
							)} ~ {new Date(work_request.posting_end_date).toLocaleDateString(
								'ko-KR',
							)}
						</span>
					</div>
				{/if}
				{#if work_request.max_applicants}
					<div class="flex">
						<span class="w-20 text-gray-500">모집인원</span>
						<span class="text-gray-900">{work_request.max_applicants}명</span>
					</div>
				{/if}
				{#if work_request.work_location}
					<div class="flex">
						<span class="w-20 text-gray-500">근무지</span>
						<span class="text-gray-900">{work_request.work_location}</span>
					</div>
				{/if}
				{#if work_request.work_start_date && work_request.work_end_date}
					<div class="flex">
						<span class="w-20 text-gray-500">예상 기간</span>
						<span class="text-gray-900">
							{new Date(work_request.work_start_date).toLocaleDateString(
								'ko-KR',
							)} ~ {new Date(work_request.work_end_date).toLocaleDateString(
								'ko-KR',
							)}
						</span>
					</div>
				{/if}
			</div>

			<!-- 요청자 정보 -->
			{#if work_request.users}
				<div
					class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"
				>
					<button
						class="flex items-center gap-2"
						onclick={() =>
							work_request.users?.handle &&
							goto(`/@${work_request.users.handle}`)}
					>
						{#if work_request.users.avatar_url}
							<img
								src={optimize_avatar(work_request.users.avatar_url)}
								alt=""
								class="h-6 w-6 rounded-full"
							/>
						{:else}
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200"
							>
								<span class="text-xs text-gray-500">
									{(work_request.users.name ||
										work_request.users.handle)?.[0]?.toUpperCase()}
								</span>
							</div>
						{/if}
						<span class="text-sm font-medium text-gray-700">
							{work_request.users.name || work_request.users.handle}
						</span>
					</button>
					<span class="text-xs text-gray-400">
						{new Date(work_request.created_at).toLocaleDateString('ko-KR', {
							month: 'short',
							day: 'numeric',
						})}
					</span>
				</div>
			{/if}
		</div>

		<!-- 제안 메시지 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">
				제안 메시지 <span class="text-red-500">*</span>
			</h2>
			<textarea
				bind:value={message}
				placeholder="프로젝트에 대한 이해도와 작업 계획을 설명해주세요."
				rows="5"
				class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
			></textarea>
		</section>

		<!-- 견적서 섹션 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">견적서 (선택)</h2>

			{#if !use_quote}
				<!-- 견적서 추가 버튼 -->
				<button
					onclick={() => (view_mode = 'template_list')}
					class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
				>
					<RiAddLine size={18} />
					견적서 추가하기
				</button>
			{:else}
				<!-- 견적서 편집 폼 -->
				<div class="space-y-6">
					<!-- 기본 정보 -->
					<div class="space-y-4">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">
								견적서 제목 <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								bind:value={quote_form.title}
								placeholder="예: MVP 개발 패키지"
								class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
							/>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="mb-1.5 block text-sm font-medium text-gray-700"
									>제안 가격</label
								>
								<div class="relative">
									<span
										class="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
										>₩</span
									>
									<input
										type="text"
										bind:value={quote_form.price}
										placeholder="협의"
										class="w-full rounded-xl border border-gray-200 py-3 pr-4 pl-8 text-sm focus:border-blue-500 focus:outline-none"
										oninput={(e) => {
											let value = e.target.value.replace(/[^0-9]/g, '');
											if (value) {
												value = parseInt(value).toLocaleString();
											}
											quote_form.price = value;
										}}
									/>
								</div>
							</div>
							<div>
								<label class="mb-1.5 block text-sm font-medium text-gray-700"
									>작업 기간</label
								>
								<input
									type="text"
									bind:value={quote_form.duration}
									placeholder="예: 2~3주"
									class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
								/>
							</div>
						</div>
					</div>

					<!-- 서비스 설명 -->
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700"
							>서비스 설명</label
						>
						<SimpleEditor
							bind:content={quote_form.description}
							placeholder="서비스에 대한 상세 설명을 작성해주세요..."
						/>
					</div>

					<!-- 추천 대상 -->
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700"
							>이런 분께 추천드립니다</label
						>
						<textarea
							bind:value={quote_form.target_audience}
							placeholder="- 아이디어는 있지만 구현이 어려운 창업자&#10;- 빠른 MVP 검증이 필요한 스타트업"
							rows="3"
							class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
						></textarea>
					</div>

					<!-- 작업 프로세스 -->
					<div>
						<div class="mb-3 flex items-center justify-between">
							<label class="text-sm font-medium text-gray-700"
								>작업 프로세스</label
							>
							<button
								type="button"
								onclick={add_step}
								class="flex items-center gap-1 text-xs font-medium text-blue-600"
							>
								<RiAddLine size={14} />
								단계 추가
							</button>
						</div>
						<div class="space-y-3">
							{#each quote_form.work_process as step, index}
								<div class="relative rounded-xl border border-gray-200 p-4">
									<div class="flex items-start gap-3">
										<div
											class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600"
										>
											{index + 1}
										</div>
										<div class="flex-1 space-y-2">
											<input
												type="text"
												bind:value={step.title}
												placeholder="단계 제목 (예: 킥오프 미팅)"
												class="w-full border-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
											/>
											<input
												type="text"
												bind:value={step.description}
												placeholder="설명 (예: 요구사항을 상세히 파악합니다)"
												class="w-full border-none bg-transparent text-sm text-gray-500 placeholder-gray-300 focus:outline-none"
											/>
										</div>
										{#if quote_form.work_process.length > 1}
											<button
												type="button"
												onclick={() => remove_step(index)}
												class="flex-shrink-0 text-gray-300 hover:text-red-500"
											>
												<RiCloseLine size={18} />
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- 산출물 -->
					<div>
						<div class="mb-3 flex items-center justify-between">
							<label class="text-sm font-medium text-gray-700"
								>받으시는 산출물</label
							>
							<button
								type="button"
								onclick={add_deliverable}
								class="flex items-center gap-1 text-xs font-medium text-blue-600"
							>
								<RiAddLine size={14} />
								항목 추가
							</button>
						</div>
						<div class="space-y-2">
							{#each quote_form.deliverables as deliverable, index}
								<div class="flex items-center gap-2">
									<div
										class="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5"
									>
										<span class="text-blue-500">✓</span>
										<input
											type="text"
											bind:value={quote_form.deliverables[index]}
											placeholder="예: 요구사항 정의서 (PDF)"
											class="flex-1 border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
										/>
									</div>
									{#if quote_form.deliverables.length > 1}
										<button
											type="button"
											onclick={() => remove_deliverable(index)}
											class="text-gray-300 hover:text-red-500"
										>
											<RiCloseLine size={18} />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- 포함 사항 -->
					<div>
						<div class="mb-3 flex items-center justify-between">
							<label class="text-sm font-medium text-gray-700">포함 사항</label>
							<button
								type="button"
								onclick={add_include}
								class="flex items-center gap-1 text-xs font-medium text-blue-600"
							>
								<RiAddLine size={14} />
								항목 추가
							</button>
						</div>
						<p class="mb-2 text-xs text-gray-400">
							예: 1회 수정, NDA 체결, 1달간 보완 등
						</p>
						<div class="flex flex-wrap gap-2">
							{#each quote_form.includes as include, index}
								<div
									class="flex items-center gap-1 rounded-full border border-gray-200 py-1 pr-1 pl-3"
								>
									<input
										type="text"
										bind:value={quote_form.includes[index]}
										placeholder="포함 사항"
										class="w-24 border-none bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none"
									/>
									{#if quote_form.includes.length > 1}
										<button
											type="button"
											onclick={() => remove_include(index)}
											class="p-0.5 text-gray-300 hover:text-red-500"
										>
											<RiCloseLine size={14} />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- 수정 및 재진행 -->
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700"
							>수정 및 재진행</label
						>
						<textarea
							bind:value={quote_form.revision_policy}
							placeholder="수정 및 재진행 정책을 자유롭게 작성해주세요.&#10;&#10;예:&#10;- 무료 수정 1회 포함&#10;- 기능 추가/범위 확장은 별도 협의"
							rows="4"
							class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
						></textarea>
					</div>

					<!-- 취소 및 환불 -->
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700"
							>취소 및 환불 규정</label
						>
						<textarea
							bind:value={quote_form.refund_policy}
							placeholder="취소 및 환불 규정을 자유롭게 작성해주세요.&#10;&#10;예:&#10;- 작업 시작 전: 100% 환불&#10;- 중간 산출물 전달 전: 50% 환불"
							rows="4"
							class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
						></textarea>
					</div>

					<!-- FAQ -->
					<div>
						<div class="mb-3 flex items-center justify-between">
							<label class="text-sm font-medium text-gray-700"
								>자주 묻는 질문</label
							>
							<button
								type="button"
								onclick={add_faq}
								class="flex items-center gap-1 text-xs font-medium text-blue-600"
							>
								<RiAddLine size={14} />
								질문 추가
							</button>
						</div>
						<div class="space-y-3">
							{#each quote_form.faq as faq, index}
								<div class="rounded-xl border border-gray-200 p-4">
									<div class="mb-2 flex items-start justify-between">
										<span class="text-xs font-medium text-gray-500"
											>Q{index + 1}</span
										>
										{#if quote_form.faq.length > 1}
											<button
												type="button"
												onclick={() => remove_faq(index)}
												class="text-gray-300 hover:text-red-500"
											>
												<RiCloseLine size={16} />
											</button>
										{/if}
									</div>
									<input
										type="text"
										bind:value={faq.question}
										placeholder="질문을 입력하세요"
										class="mb-2 w-full border-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
									/>
									<textarea
										bind:value={faq.answer}
										placeholder="답변을 입력하세요"
										rows="2"
										class="w-full resize-none border-none bg-transparent text-sm text-gray-600 placeholder-gray-300 focus:outline-none"
									></textarea>
								</div>
							{/each}
						</div>
					</div>

					<!-- 견적서 삭제 버튼 -->
					<button
						onclick={clear_quote}
						class="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
					>
						견적서 삭제
					</button>
				</div>
			{/if}
		</section>
	</main>

	<FixedBottomButton>
		<button
			class="btn btn-primary flex-1"
			onclick={submit_proposal}
			disabled={is_submitting}
		>
			{is_submitting ? '제출 중...' : '제안 제출'}
		</button>
	</FixedBottomButton>
{/if}
