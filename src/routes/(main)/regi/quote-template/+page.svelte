<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { check_login, comma, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCloseLine,
		RiDraggable,
	} from 'svelte-remixicon';

	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import ServiceProposal from '$lib/components/domain/service/ServiceProposal.svelte';
	import SimpleEditor from '$lib/components/shared/tiptap-templates/simple/simple-editor.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	const TITLE = '견적서 템플릿 작성';

	// 폼 데이터
	let form = $state({
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

	// 미리보기 모드
	let show_preview = $state(false);

	onMount(() => {
		if (!check_login(me)) {
			goto('/login');
		}
	});

	// 작업 프로세스 관리
	const add_step = () => {
		form.work_process = [...form.work_process, { title: '', description: '' }];
	};

	const remove_step = (index) => {
		if (form.work_process.length <= 1) return;
		form.work_process = form.work_process.filter((_, i) => i !== index);
	};

	// 산출물 관리
	const add_deliverable = () => {
		form.deliverables = [...form.deliverables, ''];
	};

	const remove_deliverable = (index) => {
		if (form.deliverables.length <= 1) return;
		form.deliverables = form.deliverables.filter((_, i) => i !== index);
	};

	// 포함 사항 관리
	const add_include = () => {
		form.includes = [...form.includes, ''];
	};

	const remove_include = (index) => {
		if (form.includes.length <= 1) return;
		form.includes = form.includes.filter((_, i) => i !== index);
	};

	// FAQ 관리
	const add_faq = () => {
		form.faq = [...form.faq, { question: '', answer: '' }];
	};

	const remove_faq = (index) => {
		if (form.faq.length <= 1) return;
		form.faq = form.faq.filter((_, i) => i !== index);
	};

	// 유효성 검증
	const validate = () => {
		if (!form.title.trim()) {
			show_toast('error', '견적서 제목을 입력해주세요.');
			return false;
		}
		if (!form.description.trim() || form.description === '<p></p>') {
			show_toast('error', '서비스 설명을 입력해주세요.');
			return false;
		}
		return true;
	};

	// 미리보기용 데이터 변환
	const preview_steps = $derived(
		form.work_process
			.filter((s) => s.title.trim())
			.map((s) => ({ title: s.title, description: s.description })),
	);

	const preview_deliverables = $derived(
		form.deliverables.filter((d) => d.trim()),
	);

	const preview_includes = $derived(form.includes.filter((i) => i.trim()));

	// 저장
	const save_template = async () => {
		if (!validate()) return;

		update_global_store('loading', true);
		try {
			const template_data = {
				user_id: me.id,
				title: form.title.trim(),
				description: form.description,
				price: form.price ? parseInt(form.price.replace(/,/g, '')) : null,
				duration: form.duration.trim() || null,
				target_audience: form.target_audience.trim() || null,
				work_process: form.work_process.filter((s) => s.title.trim()),
				deliverables: form.deliverables.filter((d) => d.trim()),
				includes: form.includes.filter((i) => i.trim()),
				revision_scope: form.revision_policy.trim() || '',
				refund_policy: form.refund_policy.trim() || '',
				faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()),
			};

			await api.quote_templates.insert(template_data);
			show_toast('success', '견적서 템플릿이 저장되었습니다!');
			goto(`/@${me.handle}/accounts/quote-templates`, { replaceState: true });
		} catch (e) {
			console.error('Error saving template:', e);
			show_toast('error', '저장 중 오류가 발생했습니다.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>{TITLE} | 퍼펙트랜서</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button
			onclick={() => {
				if (show_preview) {
					show_preview = false;
				} else {
					smart_go_back();
				}
			}}
		>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{show_preview ? '미리보기' : TITLE}</h1>
	{/snippet}
	{#snippet right()}
		<button
			onclick={() => (show_preview = !show_preview)}
			class="text-sm font-medium text-blue-600"
		>
			{show_preview ? '편집' : '미리보기'}
		</button>
	{/snippet}
</Header>

{#if show_preview}
	<!-- 미리보기 모드 -->
	<main class="px-4 py-6 pb-28">
		<div class="mb-6">
			<h1 class="mb-2 text-xl font-bold text-gray-900">
				{form.title || '견적서 제목'}
			</h1>
			{#if form.price}
				<p class="text-primary text-2xl font-bold">
					₩{comma(parseInt(form.price.replace(/,/g, '') || 0))}
				</p>
			{/if}
		</div>

		<!-- 서비스 설명 -->
		{#if form.description && form.description !== '<p></p>'}
			<div class="prose prose-sm mb-8 max-w-none">
				{@html form.description}
			</div>
		{/if}

		<!-- 추천 대상 -->
		{#if form.target_audience}
			<div class="mb-8">
				<h2 class="mb-3 text-base font-bold text-gray-900">
					이런 분께 추천드립니다
				</h2>
				<div class="whitespace-pre-wrap text-gray-700">
					{form.target_audience}
				</div>
			</div>
		{/if}

		<!-- ServiceProposal 컴포넌트 -->
		{#if preview_steps.length > 0 || preview_deliverables.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 text-base font-bold text-gray-900">서비스 진행 안내</h2>
				<ServiceProposal
					steps={preview_steps}
					deliverables={preview_deliverables}
					price={form.price ? parseInt(form.price.replace(/,/g, '')) : 0}
					duration={form.duration || '협의'}
					includes={preview_includes}
				/>
			</div>
		{/if}

		<!-- 수정 및 재진행 -->
		{#if form.revision_policy}
			<div class="mb-8">
				<h2 class="mb-3 text-base font-bold text-gray-900">수정 및 재진행</h2>
				<div
					class="rounded-xl bg-gray-50 p-4 text-sm whitespace-pre-wrap text-gray-700"
				>
					{form.revision_policy}
				</div>
			</div>
		{/if}

		<!-- 취소 및 환불 -->
		{#if form.refund_policy}
			<div class="mb-8">
				<h2 class="mb-3 text-base font-bold text-gray-900">
					취소 및 환불 규정
				</h2>
				<div
					class="rounded-xl bg-gray-50 p-4 text-sm whitespace-pre-wrap text-gray-700"
				>
					{form.refund_policy}
				</div>
			</div>
		{/if}

		<!-- FAQ -->
		{#if form.faq.some((f) => f.question.trim() && f.answer.trim())}
			<div class="mb-8">
				<h2 class="mb-4 text-base font-bold text-gray-900">자주 묻는 질문</h2>
				<div class="space-y-3">
					{#each form.faq.filter((f) => f.question.trim() && f.answer.trim()) as faq}
						<div class="rounded-xl bg-gray-50 p-4">
							<p class="mb-2 font-medium text-gray-900">Q. {faq.question}</p>
							<p class="text-sm text-gray-600">A. {faq.answer}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</main>
{:else}
	<!-- 편집 모드 -->
	<main class="space-y-8 px-4 py-6 pb-28">
		<!-- 기본 정보 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">기본 정보</h2>
			<div class="space-y-4">
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						견적서 제목 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={form.title}
						placeholder="예: MVP 개발 패키지"
						class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700"
							>기본 가격</label
						>
						<div class="relative">
							<span
								class="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
								>₩</span
							>
							<input
								type="text"
								bind:value={form.price}
								placeholder="협의"
								class="w-full rounded-xl border border-gray-200 py-3 pr-4 pl-8 text-sm focus:border-blue-500 focus:outline-none"
								oninput={(e) => {
									let value = e.target.value.replace(/[^0-9]/g, '');
									if (value) {
										value = parseInt(value).toLocaleString();
									}
									form.price = value;
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
							bind:value={form.duration}
							placeholder="예: 2~3주"
							class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- 서비스 설명 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">
				서비스 설명 <span class="text-red-500">*</span>
			</h2>
			<SimpleEditor
				bind:content={form.description}
				placeholder="서비스에 대한 상세 설명을 작성해주세요..."
			/>
		</section>

		<!-- 추천 대상 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">
				이런 분께 추천드립니다
			</h2>
			<textarea
				bind:value={form.target_audience}
				placeholder="- 아이디어는 있지만 구현이 어려운 창업자&#10;- 빠른 MVP 검증이 필요한 스타트업"
				rows="4"
				class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
			></textarea>
		</section>

		<!-- 작업 프로세스 -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-gray-500">작업 프로세스</h2>
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
				{#each form.work_process as step, index}
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
							{#if form.work_process.length > 1}
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
		</section>

		<!-- 산출물 -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-gray-500">받으시는 산출물</h2>
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
				{#each form.deliverables as deliverable, index}
					<div class="flex items-center gap-2">
						<div
							class="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5"
						>
							<span class="text-blue-500">✓</span>
							<input
								type="text"
								bind:value={form.deliverables[index]}
								placeholder="예: 요구사항 정의서 (PDF)"
								class="flex-1 border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
							/>
						</div>
						{#if form.deliverables.length > 1}
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
		</section>

		<!-- 포함 사항 -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-gray-500">포함 사항</h2>
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
				{#each form.includes as include, index}
					<div
						class="flex items-center gap-1 rounded-full border border-gray-200 py-1 pr-1 pl-3"
					>
						<input
							type="text"
							bind:value={form.includes[index]}
							placeholder="포함 사항"
							class="w-24 border-none bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none"
						/>
						{#if form.includes.length > 1}
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
		</section>

		<!-- 수정 및 재진행 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">수정 및 재진행</h2>
			<textarea
				bind:value={form.revision_policy}
				placeholder="수정 및 재진행 정책을 자유롭게 작성해주세요.&#10;&#10;예:&#10;- 무료 수정 1회 포함&#10;- 기능 추가/범위 확장은 별도 협의&#10;- 수정 요청은 최종 전달 후 7일 이내"
				rows="5"
				class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
			></textarea>
		</section>

		<!-- 취소 및 환불 -->
		<section>
			<h2 class="mb-3 text-sm font-semibold text-gray-500">
				취소 및 환불 규정
			</h2>
			<textarea
				bind:value={form.refund_policy}
				placeholder="취소 및 환불 규정을 자유롭게 작성해주세요.&#10;&#10;예:&#10;- 작업 시작 전: 100% 환불&#10;- 중간 산출물 전달 전: 50% 환불&#10;- 중간 산출물 전달 후: 환불 불가"
				rows="5"
				class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
			></textarea>
		</section>

		<!-- FAQ -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-gray-500">
					자주 묻는 질문 (FAQ)
				</h2>
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
				{#each form.faq as faq, index}
					<div class="relative rounded-xl border border-gray-200 p-4">
						{#if form.faq.length > 1}
							<button
								type="button"
								onclick={() => remove_faq(index)}
								class="absolute top-3 right-3 text-gray-300 hover:text-red-500"
							>
								<RiCloseLine size={18} />
							</button>
						{/if}
						<div class="space-y-2">
							<div class="flex items-start gap-2">
								<span class="text-sm font-bold text-blue-600">Q.</span>
								<input
									type="text"
									bind:value={faq.question}
									placeholder="자주 묻는 질문"
									class="flex-1 border-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
								/>
							</div>
							<div class="flex items-start gap-2">
								<span class="text-sm font-bold text-gray-400">A.</span>
								<textarea
									bind:value={faq.answer}
									placeholder="답변을 입력하세요"
									rows="2"
									class="flex-1 resize-none border-none bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none"
								></textarea>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</main>
{/if}

<!-- 하단 버튼 -->
<FixedBottomButton>
	<button class="btn btn-primary flex-1" onclick={save_template}>
		견적서 저장
	</button>
</FixedBottomButton>
