<script>
	import Modal from '$lib/components/ui/Modal.svelte';
	import colors from '$lib/config/colors';
	import { comma } from '$lib/utils/common';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiTimeLine,
	} from 'svelte-remixicon';

	let {
		is_open = $bindable(false),
		form_data = $bindable({
			message: '',
			quote_template_id: null,
			quote_data: null,
		}),
		my_templates = [],
		is_submitting = false,
		is_edit_mode = false,
		on_submit,
		on_load_templates,
	} = $props();

	// 화면 상태: 'main' | 'template_list' | 'quote_edit'
	let view_mode = $state('main');

	// 견적서 편집 데이터 (새 구조)
	let quote_form = $state({
		title: '',
		description: '',
		price: '',
		duration: '',
		target_audience: '',
		work_process: [], // [{title, description}]
		deliverables: [], // [string]
		includes: [], // [string]
		revision_policy: '',
		refund_policy: '',
	});

	// 템플릿 선택 열기
	const open_template_list = async () => {
		if (on_load_templates) {
			await on_load_templates();
		}
		view_mode = 'template_list';
	};

	// 템플릿 선택 → 편집 모드로
	const select_template = (template) => {
		form_data.quote_template_id = template.id;

		// quote_form에 데이터 복사 (새 구조)
		quote_form = {
			title: template.title || '',
			description: template.description || '',
			price: template.price ? String(template.price) : '',
			duration: template.duration || '',
			target_audience: template.target_audience || '',
			work_process: Array.isArray(template.work_process) ? template.work_process : [],
			deliverables: Array.isArray(template.deliverables) ? template.deliverables : [],
			includes: Array.isArray(template.includes) ? template.includes : [],
			revision_policy: template.revision_policy || '',
			refund_policy: template.refund_policy || '',
		};

		view_mode = 'quote_edit';
	};

	// 기존 견적서 편집 모드로
	const edit_existing_quote = () => {
		if (form_data.quote_data) {
			quote_form = {
				title: form_data.quote_data.title || '',
				description: form_data.quote_data.description || '',
				price: form_data.quote_data.price ? String(form_data.quote_data.price) : '',
				duration: form_data.quote_data.duration || '',
				target_audience: form_data.quote_data.target_audience || '',
				work_process: Array.isArray(form_data.quote_data.work_process) ? form_data.quote_data.work_process : [],
				deliverables: Array.isArray(form_data.quote_data.deliverables) ? form_data.quote_data.deliverables : [],
				includes: Array.isArray(form_data.quote_data.includes) ? form_data.quote_data.includes : [],
				revision_policy: form_data.quote_data.revision_policy || '',
				refund_policy: form_data.quote_data.refund_policy || '',
			};
		}
		view_mode = 'quote_edit';
	};

	// 견적서 편집 완료 → form_data에 저장
	const save_quote = () => {
		form_data.quote_data = {
			title: quote_form.title,
			description: quote_form.description,
			price: quote_form.price ? parseInt(quote_form.price) : null,
			duration: quote_form.duration,
			target_audience: quote_form.target_audience,
			work_process: quote_form.work_process,
			deliverables: quote_form.deliverables,
			includes: quote_form.includes,
			revision_policy: quote_form.revision_policy,
			refund_policy: quote_form.refund_policy,
		};

		view_mode = 'main';
	};

	// 견적서 삭제
	const clear_quote = () => {
		form_data.quote_template_id = null;
		form_data.quote_data = null;
		quote_form = {
			title: '',
			description: '',
			price: '',
			duration: '',
			target_audience: '',
			work_process: [],
			deliverables: [],
			includes: [],
			revision_policy: '',
			refund_policy: '',
		};
	};

	const handle_submit = (e) => {
		e.preventDefault();
		on_submit?.();
	};

	const handle_close = () => {
		is_open = false;
		view_mode = 'main';
	};

	// 모달이 닫힐 때 상태 초기화
	$effect(() => {
		if (!is_open) {
			view_mode = 'main';
		}
	});
</script>

<Modal
	is_modal_open={is_open}
	modal_position="bottom"
	on_modal_close={handle_close}
>
	<div class="p-5">
		{#if view_mode === 'template_list'}
			<!-- 템플릿 선택 화면 -->
			<div class="mb-4 flex items-center gap-3">
				<button
					type="button"
					onclick={() => (view_mode = 'main')}
					class="p-1"
				>
					<RiArrowLeftSLine size={24} color={colors.gray[600]} />
				</button>
				<h3 class="text-lg font-bold text-gray-900">견적서 템플릿 선택</h3>
			</div>

			{#if my_templates.length > 0}
				<ul class="max-h-80 space-y-2 overflow-y-auto">
					{#each my_templates as template}
						<li>
							<button
								type="button"
								onclick={() => select_template(template)}
								class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
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
											<span class="text-xs text-gray-500">· {template.duration}</span>
										{/if}
									</div>
								</div>
								<RiArrowRightSLine size={20} color={colors.gray[400]} />
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="py-8 text-center">
					<p class="text-gray-500">저장된 템플릿이 없어요</p>
					<p class="mt-1 text-sm text-gray-400">
						템플릿을 먼저 만들어주세요
					</p>
				</div>
			{/if}
		{:else if view_mode === 'quote_edit'}
			<!-- 견적서 편집 화면 -->
			<div class="mb-4 flex items-center gap-3">
				<button
					type="button"
					onclick={() => (view_mode = 'main')}
					class="p-1"
				>
					<RiArrowLeftSLine size={24} color={colors.gray[600]} />
				</button>
				<h3 class="text-lg font-bold text-gray-900">견적서 수정</h3>
			</div>

			<div class="max-h-[60vh] space-y-4 overflow-y-auto">
				<!-- 제목 -->
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						견적 제목
					</label>
					<input
						type="text"
						bind:value={quote_form.title}
						class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
					/>
				</div>

				<!-- 가격 -->
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						제안 가격
					</label>
					<div class="relative">
						<span
							class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
							>₩</span
						>
						<input
							type="text"
							bind:value={quote_form.price}
							placeholder="0"
							class="w-full rounded-lg border border-gray-200 px-3 py-2.5 pl-8 text-sm focus:border-blue-500 focus:outline-none"
							oninput={(e) => {
								e.target.value = e.target.value.replace(/[^0-9]/g, '');
								quote_form.price = e.target.value;
							}}
						/>
					</div>
				</div>

				<!-- 작업 기간 -->
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						작업 기간
					</label>
					<input
						type="text"
						bind:value={quote_form.duration}
						placeholder="예: 2주, 1개월"
						class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
					/>
				</div>

				<!-- 수정 및 재진행 정책 -->
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						수정 및 재진행
					</label>
					<textarea
						bind:value={quote_form.revision_policy}
						rows="2"
						placeholder="예: 수정 2회 포함, 추가 수정은 건당 5만원"
						class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
					></textarea>
				</div>

				<!-- 취소 및 환불 규정 -->
				<div>
					<label class="mb-1.5 block text-sm font-medium text-gray-700">
						취소 및 환불 규정
					</label>
					<textarea
						bind:value={quote_form.refund_policy}
						rows="2"
						placeholder="예: 작업 시작 전 100% 환불"
						class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
					></textarea>
				</div>

				<!-- 작업 프로세스 요약 (있을 경우) -->
				{#if quote_form.work_process.length > 0}
					<div class="rounded-lg bg-gray-50 p-3">
						<p class="mb-2 text-xs font-medium text-gray-500">작업 프로세스</p>
						<div class="space-y-1">
							{#each quote_form.work_process as step, i}
								<p class="text-sm text-gray-700">
									{i + 1}. {step.title}
								</p>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 결과물 요약 (있을 경우) -->
				{#if quote_form.deliverables.length > 0}
					<div class="rounded-lg bg-gray-50 p-3">
						<p class="mb-2 text-xs font-medium text-gray-500">받으시는 산출물</p>
						<div class="space-y-1">
							{#each quote_form.deliverables as item}
								{#if item}
									<p class="text-sm text-gray-700">• {item}</p>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-5 flex gap-3">
				<button
					type="button"
					onclick={() => {
						clear_quote();
						view_mode = 'main';
					}}
					class="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
				>
					삭제하기
				</button>
				<button
					type="button"
					onclick={save_quote}
					class="btn btn-primary flex-1 rounded-lg py-3 font-medium"
				>
					견적서 적용
				</button>
			</div>
		{:else}
			<!-- 메인 제안 작성 화면 -->
			<div class="mb-5">
				<h3 class="text-lg font-bold text-gray-900">{is_edit_mode ? '제안 수정하기' : '견적 제안하기'}</h3>
			</div>

			<form onsubmit={handle_submit}>
				<div class="space-y-5">
					<!-- 제안 메시지 -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							제안 메시지 <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={form_data.message}
							placeholder="프로젝트에 대한 이해도와 작업 계획을 설명해주세요."
							class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
							rows="4"
							required
						></textarea>
					</div>

					<!-- 견적서 섹션 -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							견적서
						</label>

						{#if form_data.quote_data}
							<!-- 선택된 견적서 요약 -->
							<button
								type="button"
								onclick={edit_existing_quote}
								class="w-full rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-left transition-colors hover:bg-blue-50"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<p class="font-medium text-gray-900">
											{form_data.quote_data.title}
										</p>
										<p class="mt-1 text-sm font-semibold text-blue-600">
											₩{comma(form_data.quote_data.price || 0)}
										</p>
										{#if form_data.quote_data.duration}
											<p class="mt-1 flex items-center gap-1 text-sm text-gray-600">
												<RiTimeLine size={14} />
												{form_data.quote_data.duration}
											</p>
										{/if}
										{#if form_data.quote_data.revision_policy}
											<p class="mt-1 text-sm text-gray-500">
												{form_data.quote_data.revision_policy}
											</p>
										{/if}
									</div>
									<RiArrowRightSLine size={20} color={colors.gray[400]} class="flex-shrink-0" />
								</div>
							</button>
						{:else}
							<!-- 템플릿 선택 버튼 -->
							<button
								type="button"
								onclick={open_template_list}
								class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
							>
								<RiAddLine size={18} />
								견적서 템플릿 불러오기
							</button>
						{/if}
					</div>

				</div>

				<div class="mt-6 flex gap-3">
					<button
						type="button"
						onclick={handle_close}
						class="btn btn-gray flex-1 rounded-lg py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={is_submitting}
						class="btn btn-primary flex-1 rounded-lg py-3 font-medium disabled:opacity-50"
					>
						{is_submitting ? '저장 중...' : is_edit_mode ? '수정하기' : '제안하기'}
					</button>
				</div>
			</form>
		{/if}
	</div>
</Modal>
