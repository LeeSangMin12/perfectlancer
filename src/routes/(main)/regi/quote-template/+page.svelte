<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { check_login, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckboxCircleLine,
		RiDeleteBinLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	const TITLE = '견적서 템플릿 등록';

	// 수정 횟수/범위 프리셋
	const revision_count_presets = [0, 1, 2, 3];
	const revision_scope_presets = [
		'UI 색/레이아웃 변경은 포함',
		'텍스트/카피 수정은 포함',
		'경미한 버그 수정은 포함',
		'기능 추가/범위 확장은 별도 협의',
	];

	let form = $state({
		title: '',
		description: '',
		audience: '',
		process: '',
		deliverables: '',
		revision_count: 1,
		revision_scopes: [
			'UI 색/레이아웃 변경은 포함',
			'기능 추가/범위 확장은 별도 협의',
		],
		faqs: [{ question: '', answer: '' }],
		refund_policy: {
			before_start: 100,
			before_midpoint: 50,
			after_midpoint: 0,
		},
	});

	let custom_scope = $state('');
	let is_confirm_modal = $state(false);

	onMount(() => {
		if (!check_login(me)) {
			goto('/login');
		}
	});

	// 스텝 관리
	let current_step = $state(1);
	const total_steps = 3;

	const go_to_next_step = () => {
		if (current_step < total_steps) {
			current_step++;
		}
	};

	const go_to_prev_step = () => {
		if (current_step > 1) {
			current_step--;
		}
	};

	// 수정 범위 토글
	const toggle_revision_scope = (scope) => {
		if (form.revision_scopes.includes(scope)) {
			form.revision_scopes = form.revision_scopes.filter(
				(item) => item !== scope,
			);
		} else {
			form.revision_scopes = [...form.revision_scopes, scope];
		}
	};

	const add_custom_scope = () => {
		const value = custom_scope.trim();
		if (!value) return;
		if (form.revision_scopes.includes(value)) {
			show_toast('info', '이미 추가된 항목입니다.');
			return;
		}
		form.revision_scopes = [...form.revision_scopes, value];
		custom_scope = '';
	};

	// FAQ 관리
	const add_faq = () => {
		form.faqs = [...form.faqs, { question: '', answer: '' }];
	};

	const remove_faq = (index) => {
		if (form.faqs.length === 1) {
			show_toast('info', 'FAQ는 최소 1개 이상 필요합니다.');
			return;
		}
		form.faqs = form.faqs.filter((_, i) => i !== index);
	};

	// 유효성 검증
	const validate_step = (step) => {
		switch (step) {
			case 1:
				if (!form.title.trim()) {
					show_toast('error', '견적 제목을 입력해주세요.');
					return false;
				}
				if (!form.description.trim()) {
					show_toast('error', '설명을 입력해주세요.');
					return false;
				}
				return true;
			case 2:
				if (!form.audience.trim()) {
					show_toast('error', '추천 대상을 입력해주세요.');
					return false;
				}
				if (!form.process.trim()) {
					show_toast('error', '작업 프로세스를 입력해주세요.');
					return false;
				}
				if (!form.deliverables.trim()) {
					show_toast('error', '결과물을 입력해주세요.');
					return false;
				}
				return true;
			case 3:
				if (form.revision_scopes.length === 0) {
					show_toast('error', '수정 범위를 최소 1개 이상 선택해주세요.');
					return false;
				}
				const incomplete_faq = form.faqs.some(
					(item) => !item.question.trim() || !item.answer.trim(),
				);
				if (incomplete_faq) {
					show_toast('error', 'FAQ의 질문과 답변을 모두 입력해주세요.');
					return false;
				}
				return true;
			default:
				return true;
		}
	};

	const handle_next = () => {
		if (validate_step(current_step)) {
			go_to_next_step();
		}
	};

	const save_template = async () => {
		update_global_store('loading', true);
		try {
			if (!me?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			const template_data = {
				user_id: me.id,
				title: form.title.trim(),
				description: form.description.trim(),
				target_audience: form.audience.trim(),
				work_process: form.process.trim(),
				deliverables: form.deliverables.trim(),
				revision_count: form.revision_count,
				revision_scope: form.revision_scopes.join('\n'),
				faq: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
				refund_policy: form.refund_policy,
			};

			await api.quote_templates.insert(template_data);
			show_toast('success', '견적서 템플릿이 저장되었습니다!');
			goto(`/@${me.handle}/accounts/quote-templates`, { replaceState: true });
		} catch (e) {
			console.error('Error saving template:', e);
			show_toast('error', '템플릿 저장 중 오류가 발생했습니다.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta
		name="description"
		content="외주 견적서 템플릿을 작성하고 저장하는 페이지입니다."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button
			onclick={() => {
				if (current_step > 1) {
					go_to_prev_step();
				} else {
					smart_go_back();
				}
			}}
		>
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{TITLE}</h1>
	{/snippet}
</Header>

<!-- Progress bar -->
<div class="mb-4">
	<div class="h-1 w-full rounded-full bg-gray-200">
		<div
			class="h-1 rounded-lg bg-blue-600 transition-all duration-300"
			style="width: {(current_step / total_steps) * 100}%"
		></div>
	</div>
</div>

<main class="p-4 pb-28">
	<form class="space-y-6">
		{#if current_step === 1}
			<!-- Step 1: 기본 정보 -->
			<div class="space-y-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">
					견적서의 기본 정보를
					<br />
					작성해주세요
				</h2>

				<!-- 제목 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						견적 제목 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={form.title}
						placeholder="예: 웹앱 MVP 개발 + 1회 리비전"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2.5 focus:outline-none"
						maxlength="80"
					/>
				</div>

				<!-- 설명 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						설명 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={form.description}
						rows="6"
						placeholder="견적 전반 설명과 추가 안내를 적어주세요.
거래 기준, 작업 방식, 커뮤니케이션 채널 등을 명확히 기재하면 분쟁을 줄일 수 있어요."
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2.5 leading-relaxed focus:outline-none"
					></textarea>
				</div>
			</div>
		{:else if current_step === 2}
			<!-- Step 2: 대상/프로세스/결과물 -->
			<div class="space-y-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">
					작업 대상과 프로세스를
					<br />
					설정해주세요
				</h2>

				<!-- 추천 대상 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						이런 분께 추천드립니다 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={form.audience}
						rows="4"
						placeholder="예: - 아이디어는 있지만 요구사항 정리가 어려운 창업자
- 개발 견적을 받기 전에 기준 문서가 필요한 팀
- 디자인/기획 리소스가 부족한 스타트업"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2.5 leading-relaxed focus:outline-none"
					></textarea>
				</div>

				<!-- 작업 프로세스 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						작업 프로세스 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={form.process}
						rows="4"
						placeholder="예: - 킥오프 미팅 및 요구사항 인터뷰
- 와이어프레임/자료 수집
- 중간 산출물 검토 및 피드백 반영
- 최종 산출물 전달"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2.5 leading-relaxed focus:outline-none"
					></textarea>
				</div>

				<!-- 결과물 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						받는 결과물 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={form.deliverables}
						rows="4"
						placeholder="예: - 최종 산출물: Figma 링크 / PDF / 소스 파일
- 버전 관리: 수정본 이력 공유
- 전달 방식: 이메일 및 구글드라이브"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2.5 leading-relaxed focus:outline-none"
					></textarea>
				</div>
			</div>
		{:else if current_step === 3}
			<!-- Step 3: 수정/환불 정책 + FAQ -->
			<div class="space-y-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">
					정책과 FAQ를
					<br />
					설정해주세요
				</h2>

				<!-- 수정 정책 -->
				<div class="rounded-xl border border-gray-200 p-4">
					<p class="font-semibold text-gray-900">수정 정책</p>
					<p class="mt-1 text-sm text-gray-500">
						수정 무한루프를 방지하기 위해 횟수/범위를 명시해주세요
					</p>

					<!-- 수정 횟수 -->
					<div class="mt-4">
						<label class="mb-2 block text-sm font-medium text-gray-700">
							수정 횟수
						</label>
						<div class="flex flex-wrap gap-2">
							{#each revision_count_presets as preset}
								<button
									type="button"
									class={`rounded-full border px-3 py-1.5 text-sm ${form.revision_count === preset ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-700'}`}
									onclick={() => (form.revision_count = preset)}
								>
									{preset}회
								</button>
							{/each}
						</div>
					</div>

					<!-- 수정 범위 -->
					<div class="mt-4">
						<label class="mb-2 block text-sm font-medium text-gray-700">
							수정 범위 <span class="text-red-500">*</span>
						</label>
						<div class="flex flex-wrap gap-2">
							{#each revision_scope_presets as scope}
								<button
									type="button"
									class={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${form.revision_scopes.includes(scope) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-700'}`}
									onclick={() => toggle_revision_scope(scope)}
								>
									{#if form.revision_scopes.includes(scope)}
										<RiCheckboxCircleLine size={16} color={colors.primary} />
									{/if}
									<span>{scope}</span>
								</button>
							{/each}
						</div>

						<div class="mt-3 flex gap-2">
							<input
								type="text"
								placeholder="직접 추가"
								class="focus:border-primary flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
								bind:value={custom_scope}
								onkeydown={(e) =>
									e.key === 'Enter' && (e.preventDefault(), add_custom_scope())}
							/>
							<button
								type="button"
								class="btn btn-outline btn-sm"
								onclick={add_custom_scope}
							>
								추가
							</button>
						</div>
					</div>
				</div>

				<!-- 환불 정책 -->
				<div class="rounded-xl border border-gray-200 p-4">
					<p class="font-semibold text-gray-900">환불 정책</p>
					<p class="mt-1 text-sm text-gray-500">
						작업 진행 단계별 환불 비율을 설정해주세요
					</p>

					<div class="mt-4 space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">작업 시작 전</span>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="0"
									max="100"
									class="focus:border-primary w-20 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm focus:outline-none"
									bind:value={form.refund_policy.before_start}
								/>
								<span class="text-sm text-gray-500">%</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">중간 산출물 전달 전</span>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="0"
									max="100"
									class="focus:border-primary w-20 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm focus:outline-none"
									bind:value={form.refund_policy.before_midpoint}
								/>
								<span class="text-sm text-gray-500">%</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">중간 산출물 전달 후</span>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="0"
									max="100"
									class="focus:border-primary w-20 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm focus:outline-none"
									bind:value={form.refund_policy.after_midpoint}
								/>
								<span class="text-sm text-gray-500">%</span>
							</div>
						</div>
					</div>
				</div>

				<!-- FAQ -->
				<div class="rounded-xl border border-gray-200 p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-semibold text-gray-900">FAQ</p>
							<p class="mt-1 text-sm text-gray-500">자주 묻는 질문과 답변</p>
						</div>
						<button
							type="button"
							class="btn btn-outline btn-sm"
							onclick={add_faq}
						>
							<RiAddLine size={16} />
							추가
						</button>
					</div>

					<div class="mt-4 space-y-4">
						{#each form.faqs as faq, index}
							<div class="rounded-lg bg-gray-50 p-3">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700"
										>FAQ {index + 1}</span
									>
									<button
										type="button"
										class="text-gray-400 hover:text-red-500"
										onclick={() => remove_faq(index)}
									>
										<RiDeleteBinLine size={16} />
									</button>
								</div>
								<input
									type="text"
									bind:value={faq.question}
									placeholder="질문"
									class="focus:border-primary mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
								/>
								<textarea
									bind:value={faq.answer}
									rows="2"
									placeholder="답변"
									class="focus:border-primary mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
								></textarea>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</form>
</main>

<FixedBottomButton>
	{#if current_step === total_steps}
		<button
			onclick={() => {
				if (validate_step(3)) {
					is_confirm_modal = true;
				}
			}}
			class="btn btn-primary w-full"
		>
			등록하기
		</button>
	{:else}
		<button onclick={handle_next} class="btn btn-primary w-full">
			다음
		</button>
	{/if}
</FixedBottomButton>

<!-- 등록 확인 모달 -->
<Modal bind:is_modal_open={is_confirm_modal} modal_position="center">
	<div class="p-6">
		<h3 class="text-lg font-semibold text-gray-900">
			템플릿을 저장하시겠습니까?
		</h3>
		<p class="mt-2 text-sm text-gray-500">
			저장된 템플릿은 외주 제안 시 사용할 수 있습니다.
		</p>

		<div class="mt-6 flex gap-3">
			<button
				onclick={() => (is_confirm_modal = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={() => {
					is_confirm_modal = false;
					save_template();
				}}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
			>
				저장하기
			</button>
		</div>
	</div>
</Modal>
