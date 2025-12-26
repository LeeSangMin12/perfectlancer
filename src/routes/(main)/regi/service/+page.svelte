<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { smart_go_back } from '$lib/utils/navigation';
	import Select from 'svelte-select';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiArrowLeftSLine,
		RiAddLine,
		RiCloseLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import SimpleEditor from '$lib/components/shared/tiptap-templates/simple/simple-editor.svelte';
	import PaymentInfoRequiredModal from '$lib/components/modals/PaymentInfoRequiredModal.svelte';
	import ServiceProposal from '$lib/components/domain/service/ServiceProposal.svelte';

	import colors from '$lib/config/colors';
	import { check_login, comma, show_toast } from '$lib/utils/common';
	import {
		get_user_context,
		get_api_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	const TITLE = '서비스 등록';

	// 외주 공고와 동일한 카테고리
	const categories = [
		{ value: '제품/서비스 개발', label: '제품/서비스 개발' },
		{ value: '브랜딩 & 디자인', label: '브랜딩 & 디자인' },
		{ value: '마케팅', label: '마케팅' },
		{ value: '리서치', label: '리서치' },
		{ value: '데이터 & 자동화', label: '데이터 & 자동화' },
		{ value: '컨설팅 & 강연', label: '컨설팅 & 강연' },
		{ value: '문서 작성', label: '문서 작성' },
		{ value: '미디어 (영상 & 음악)', label: '미디어 (영상 & 음악)' },
		{ value: '번역', label: '번역' },
	];

	let selected_category = $state(null);

	// 폼 데이터
	let form = $state({
		// Step 1: 기본 정보
		images: [],
		title: '',
		category: '',
		// Step 2: 가격 설정
		price: '',
		duration: '',
		options: [],
		// Step 3: 서비스 상세
		content: '',
		target_audience: '',
		work_process: [{ title: '', description: '' }],
		deliverables: [''],
		// Step 4: 정책 및 FAQ
		includes: [''],
		revision_policy: '',
		refund_policy: '',
		faq: [{ question: '', answer: '' }],
	});

	let show_payment_modal = $state(false);
	let has_payment_info = $state(false);

	// 단계 관리
	let current_step = $state(1);
	const total_steps = 5;

	onMount(async () => {
		if (!check_login(me)) {
			goto('/login');
			return;
		}

		// 결제 정보 확인 (users 테이블의 phone + 계좌)
		try {
			const accounts = await api.user_bank_accounts.select_by_user_id(me.id);

			has_payment_info = !!(me?.phone && accounts?.length > 0);

			if (!has_payment_info) {
				show_payment_modal = true;
			}
		} catch (e) {
			console.error('Failed to check payment info:', e);
		}
	});

	// 단계 이동
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

	// 단계별 유효성 검증
	const validate_step = (step) => {
		switch (step) {
			case 1:
				if (form.images.length === 0) {
					show_toast('error', '서비스 이미지를 1개 이상 등록해주세요.');
					return false;
				}
				if (!form.title.trim()) {
					show_toast('error', '서비스 제목을 입력해주세요.');
					return false;
				}
				if (!selected_category) {
					show_toast('error', '카테고리를 선택해주세요.');
					return false;
				}
				return true;
			case 2:
				if (!form.price || parseInt(form.price.replace(/,/g, '')) <= 0) {
					show_toast('error', '서비스 가격을 입력해주세요.');
					return false;
				}
				return true;
			case 3:
				if (!form.content.trim() || form.content === '<p></p>') {
					show_toast('error', '서비스 설명을 입력해주세요.');
					return false;
				}
				return true;
			case 4:
				// 정책은 선택사항
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

	// 이미지 관리
	const add_img = (event) => {
		const selected_images = event.target.files;
		let images_copy = [...form.images];

		for (let i = 0; i < selected_images.length; i++) {
			selected_images[i].uri = URL.createObjectURL(selected_images[i]);

			const img = new Image();
			img.onload = () => {
				const aspectRatio = img.width / img.height;
				const isRecommendedSize = img.width >= 652 && img.height >= 488;
				const isRecommendedRatio = aspectRatio >= 1.3 && aspectRatio <= 1.4;

				if (!isRecommendedSize || !isRecommendedRatio) {
					show_toast(
						'info',
						'권장 크기: 652x488px (4:3 비율)로 업로드하면 더 좋은 품질을 얻을 수 있어요!',
					);
				}
			};
			img.src = selected_images[i].uri;

			images_copy.push(selected_images[i]);
		}

		if (images_copy.length > 7) {
			show_toast('error', '이미지 개수는 7개를 초과할 수 없습니다.');
			return;
		}

		form.images = images_copy;
	};

	const delete_img = (idx) => {
		const update_images = [...form.images];
		update_images.splice(idx, 1);
		form.images = update_images;
	};

	// 옵션 관리
	const add_option = () => {
		form.options = [
			...form.options,
			{
				name: '',
				price_add: 0,
				description: '',
				display_order: form.options.length,
			},
		];
	};

	const delete_option = (idx) => {
		const updated_options = [...form.options];
		updated_options.splice(idx, 1);
		updated_options.forEach((opt, i) => (opt.display_order = i));
		form.options = updated_options;
	};

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

	// 미리보기용 데이터
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
	const save_service = async () => {
		update_global_store('loading', true);
		try {
			if (!me?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			if (!has_payment_info) {
				show_payment_modal = true;
				return;
			}

			const price_value = parseInt(form.price.replace(/,/g, ''));

			const new_service = await api.services.insert({
				author_id: me.id,
				title: form.title.trim(),
				content: form.content,
				price: price_value,
				category: selected_category?.value || null,
				duration: form.duration.trim() || null,
				target_audience: form.target_audience.trim() || null,
				work_process: form.work_process.filter((s) => s.title.trim()),
				deliverables: form.deliverables.filter((d) => d.trim()),
				includes: form.includes.filter((i) => i.trim()),
				revision_policy: form.revision_policy.trim() || null,
				refund_policy: form.refund_policy.trim() || null,
				faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()),
				status: 'pending_approval', // 관리자 승인 대기 상태로 등록
			});

			if (form.images.length > 0) {
				const uploaded_images = await upload_images(
					new_service.id,
					form.images,
				);
				await api.services.update(new_service.id, {
					images: uploaded_images,
				});
			}

			// 옵션 저장
			if (form.options.length > 0) {
				const options_to_insert = form.options
					.filter((opt) => opt.name.trim() && opt.price_add > 0)
					.map((opt) => ({
						service_id: new_service.id,
						name: opt.name.trim(),
						price_add: opt.price_add,
						description: opt.description?.trim() || null,
						display_order: opt.display_order,
					}));

				if (options_to_insert.length > 0) {
					await api.service_options.insert_bulk(options_to_insert);
				}
			}

			show_toast('success', '서비스가 등록되었습니다! 관리자 승인 후 공개됩니다.');
			goto(`/service/${new_service.id}`, { replaceState: true });
		} catch (e) {
			console.error('Error saving service:', e);
			show_toast('error', '서비스 등록 중 오류가 발생했습니다.');
		} finally {
			update_global_store('loading', false);
		}
	};

	const upload_images = async (service_id, images) => {
		return Promise.all(
			images.map(async (img_file, i) => {
				const file_ext = img_file.name.split('.').pop();
				const file_path = `${service_id}/${Date.now()}-${i}.${file_ext}`;

				await api.service_images.upload(file_path, img_file);
				return {
					uri: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/services/images/${file_path}`,
				};
			}),
		);
	};
</script>

<svelte:head>
	<title>{TITLE} | 퍼펙트랜서</title>
	<meta
		name="description"
		content="서비스를 등록할 수 있는 문의 서비스 등록 페이지입니다."
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
	{#if current_step === 1}
		<!-- Step 1: 기본 정보 -->
		<div class="space-y-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">
				서비스의 기본 정보를<br />
				작성해주세요
			</h2>

			<!-- 이미지 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					서비스 이미지 <span class="text-red-500">*</span>
				</label>
				<p class="mb-2 text-xs text-gray-500">
					권장 크기: 652x488px (4:3 비율), 최대 7개
				</p>

				<div class="flex overflow-x-auto">
					<label for="input-file">
						<input
							type="file"
							id="input-file"
							onchange={add_img}
							accept="image/*"
							multiple
							class="hidden"
						/>
						<div
							class="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-gray-50"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 21"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M14.14 2.33333L16.275 4.66667H21V18.6667H2.33333V4.66667H7.05833L9.19333 2.33333H14.14ZM15.1667 0H8.16667L6.03167 2.33333H2.33333C1.05 2.33333 0 3.38333 0 4.66667V18.6667C0 19.95 1.05 21 2.33333 21H21C22.2833 21 23.3333 19.95 23.3333 18.6667V4.66667C23.3333 3.38333 22.2833 2.33333 21 2.33333H17.3017L15.1667 0ZM11.6667 8.16667C13.5917 8.16667 15.1667 9.74167 15.1667 11.6667C15.1667 13.5917 13.5917 15.1667 11.6667 15.1667C9.74167 15.1667 8.16667 13.5917 8.16667 11.6667C8.16667 9.74167 9.74167 8.16667 11.6667 8.16667ZM11.6667 5.83333C8.44667 5.83333 5.83333 8.44667 5.83333 11.6667C5.83333 14.8867 8.44667 17.5 11.6667 17.5C14.8867 17.5 17.5 14.8867 17.5 11.6667C17.5 8.44667 14.8867 5.83333 11.6667 5.83333Z"
									fill="#A9A9A9"
								/>
							</svg>
							<span class="text-xs text-gray-900">{form.images.length}/7</span>
						</div>
					</label>

					<div class="flex flex-row">
						{#each form.images as img, idx}
							<div class="relative ml-3 min-w-max">
								<div class="aspect-[4/3] h-24 w-32 overflow-hidden rounded-lg">
									<img
										class="h-full w-full object-cover"
										src={img.uri}
										alt={img.name}
										loading="eager"
									/>
								</div>
								<button
									onclick={() => delete_img(idx)}
									aria-label="삭제"
									class="absolute -top-1 -right-1"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="1.3rem"
										height="1.3rem"
										viewBox="0 0 24 24"
									>
										<path
											fill={colors.gray[900]}
											d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zm3.6 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
										/>
									</svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- 카테고리 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					카테고리 <span class="text-red-500">*</span>
				</label>
				<Select
					items={categories}
					bind:value={selected_category}
					placeholder="카테고리를 선택해주세요"
					clearable={false}
					searchable={true}
					showChevron={true}
					--border="1px solid #d1d5db"
					--border-radius="6px"
					--border-focused="1px solid #3b82f6"
				/>
			</div>

			<!-- 제목 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					서비스 제목 <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					bind:value={form.title}
					placeholder="예: MVP 개발부터 런칭까지 도와드립니다"
					class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
					maxlength="100"
				/>
			</div>
		</div>
	{:else if current_step === 2}
		<!-- Step 2: 가격 설정 -->
		<div class="space-y-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">
				서비스의 가격을<br />
				설정해주세요
			</h2>

			<!-- 기본 가격 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					기본 가격 <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<span class="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
						>₩</span
					>
					<input
						type="text"
						bind:value={form.price}
						placeholder="0"
						class="focus:border-primary w-full rounded-md border border-gray-300 py-2 pr-4 pl-8 focus:outline-none"
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

			<!-- 작업 기간 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					예상 작업 기간
				</label>
				<input
					type="text"
					bind:value={form.duration}
					placeholder="예: 2~3주"
					class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
				/>
			</div>

			<!-- 추가 옵션 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					추가 옵션 (선택)
				</label>
				<p class="mb-3 text-xs text-gray-500">
					고객이 선택할 수 있는 추가 옵션을 등록해보세요
				</p>

				<div class="space-y-3">
					{#each form.options as option, idx}
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
							<div class="mb-3 flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700"
									>옵션 {idx + 1}</span
								>
								<button
									onclick={() => delete_option(idx)}
									class="text-sm text-gray-500 hover:text-gray-700"
									type="button"
								>
									삭제
								</button>
							</div>

							<div class="space-y-3">
								<input
									bind:value={option.name}
									type="text"
									placeholder="옵션 이름 (예: 소스파일 제공)"
									class="input input-bordered h-11 w-full text-sm focus:border-gray-400 focus:outline-none"
								/>
								<input
									bind:value={option.price_add}
									type="number"
									placeholder="추가 금액 (원)"
									class="input input-bordered h-11 w-full text-sm focus:border-gray-400 focus:outline-none"
								/>
								<input
									bind:value={option.description}
									type="text"
									placeholder="설명 (선택)"
									class="input input-bordered h-11 w-full text-sm focus:border-gray-400 focus:outline-none"
								/>
							</div>
						</div>
					{/each}

					<button
						onclick={add_option}
						type="button"
						class="flex h-11 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
					>
						+ 옵션 추가
					</button>
				</div>
			</div>
		</div>
	{:else if current_step === 3}
		<!-- Step 3: 서비스 상세 -->
		<div class="space-y-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">
				서비스에 대해<br />
				자세히 설명해주세요
			</h2>

			<!-- 서비스 설명 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					서비스 설명 <span class="text-red-500">*</span>
				</label>
				<SimpleEditor
					bind:content={form.content}
					placeholder="서비스에 대한 상세 설명을 작성해주세요..."
				/>
			</div>

			<!-- 추천 대상 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					이런 분께 추천드립니다
				</label>
				<textarea
					bind:value={form.target_audience}
					placeholder="- 아이디어는 있지만 구현이 어려운 창업자&#10;- 빠른 MVP 검증이 필요한 스타트업"
					rows="4"
					class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
				></textarea>
			</div>

			<!-- 작업 프로세스 -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<label class="text-sm font-medium text-gray-700">작업 프로세스</label>
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
			</div>
		</div>
	{:else if current_step === 4}
		<!-- Step 4: 정책 및 FAQ -->
		<div class="space-y-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">
				서비스 정책을<br />
				설정해주세요
			</h2>

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
			</div>

			<!-- 수정 및 재진행 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700"
					>수정 및 재진행</label
				>
				<textarea
					bind:value={form.revision_policy}
					placeholder="수정 및 재진행 정책을 자유롭게 작성해주세요.&#10;&#10;예:&#10;- 무료 수정 1회 포함&#10;- 기능 추가/범위 확장은 별도 협의&#10;- 수정 요청은 최종 전달 후 7일 이내"
					rows="5"
					class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
				></textarea>
			</div>

			<!-- 취소 및 환불 -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700"
					>취소 및 환불 규정</label
				>
				<textarea
					bind:value={form.refund_policy}
					placeholder="취소 및 환불 규정을 자유롭게 작성해주세요.&#10;&#10;예:&#10;- 작업 시작 전: 100% 환불&#10;- 중간 산출물 전달 전: 50% 환불&#10;- 중간 산출물 전달 후: 환불 불가"
					rows="5"
					class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
				></textarea>
			</div>

			<!-- FAQ -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<label class="text-sm font-medium text-gray-700"
						>자주 묻는 질문 (FAQ)</label
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
			</div>
		</div>
	{:else if current_step === 5}
		<!-- Step 5: 미리보기 -->
		<div class="space-y-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">
				등록 전 미리보기
			</h2>

			<!-- 이미지 미리보기 -->
			{#if form.images.length > 0}
				<div class="overflow-hidden rounded-xl">
					<img
						src={form.images[0].uri}
						alt="서비스 대표 이미지"
						class="aspect-[4/3] w-full object-cover"
					/>
				</div>
			{/if}

			<!-- 기본 정보 -->
			<div>
				{#if selected_category}
					<span
						class="mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600"
					>
						{selected_category.label}
					</span>
				{/if}
				<h1 class="mb-2 text-xl font-bold text-gray-900">
					{form.title || '서비스 제목'}
				</h1>
				<p class="text-primary text-2xl font-bold">
					₩{comma(parseInt(form.price?.replace(/,/g, '') || 0))}
				</p>
				{#if form.duration}
					<p class="mt-1 text-sm text-gray-500">예상 작업 기간: {form.duration}</p
					>
				{/if}
			</div>

			<!-- 서비스 설명 -->
			{#if form.content && form.content !== '<p></p>'}
				<div class="prose prose-sm max-w-none">
					{@html form.content}
				</div>
			{/if}

			<!-- 추천 대상 -->
			{#if form.target_audience}
				<div>
					<h2 class="mb-3 text-base font-bold text-gray-900">
						이런 분께 추천드립니다
					</h2>
					<div class="whitespace-pre-wrap text-gray-700">
						{form.target_audience}
					</div>
				</div>
			{/if}

			<!-- 서비스 진행 안내 -->
			{#if preview_steps.length > 0 || preview_deliverables.length > 0}
				<div>
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
				<div>
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
				<div>
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
				<div>
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
		</div>
	{/if}
</main>

<!-- 하단 버튼 -->
<div
	class="fixed right-0 bottom-0 left-0 mx-auto w-full max-w-screen-md bg-white p-4"
>
	<div class="pb-safe">
		{#if current_step === total_steps}
			<button onclick={save_service} class="btn btn-primary w-full">
				서비스 등록하기
			</button>
		{:else}
			<button onclick={handle_next} class="btn btn-primary w-full"> 다음 </button>
		{/if}
	</div>
</div>

<PaymentInfoRequiredModal bind:is_modal_open={show_payment_modal} />
