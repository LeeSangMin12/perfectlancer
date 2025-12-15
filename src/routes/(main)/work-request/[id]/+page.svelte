<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import {
		check_contact,
		check_login,
		comma,
		show_toast,
	} from '$lib/utils/common';
	import {
		ERROR_MESSAGES,
		get_proposal_status_display,
		get_request_status_display,
		SUCCESS_MESSAGES,
		validate_proposal_data,
	} from '$lib/utils/expert_request_utils';
	import { optimize_avatar } from '$lib/utils/image';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine, RiTimeLine, RiUser3Line } from 'svelte-remixicon';

	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ProposalModal from '$lib/components/modals/ProposalModal.svelte';

	const me = get_user_context();
	const api = get_api_context();

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

	let { data } = $props();
	let { work_request, proposals, user } = $state(data);

	// 첨부파일 맵 (proposal_id -> attachments[])
	let proposal_attachments_map = $state({});

	// 제안서 작성 모달 상태
	let show_proposal_modal = $state(false);
	let proposal_form = $state({
		message: '',
		proposed_amount: '',
	});
	let attached_files = $state([]);
	let is_submitting_proposal = $state(false);

	// 파일 선택 처리
	const handle_file_select = (e) => {
		const files = Array.from(e.target.files || []);
		const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
		const MAX_FILES = 5;

		if (attached_files.length + files.length > MAX_FILES) {
			show_toast('error', `최대 ${MAX_FILES}개의 파일만 첨부할 수 있습니다.`);
			return;
		}

		const valid_files = files.filter((file) => {
			if (file.size > MAX_FILE_SIZE) {
				show_toast('error', `${file.name}은(는) 10MB를 초과합니다.`);
				return false;
			}
			return true;
		});

		attached_files = [...attached_files, ...valid_files];
	};

	// 파일 제거
	const remove_file = (index) => {
		attached_files = attached_files.filter((_, i) => i !== index);
	};

	// 파일 크기 포맷
	const format_file_size = (bytes) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	};

	// 파일명 안전하게 변환 (UUID로 대체, 원본명은 DB에 저장)
	const sanitize_filename = (filename, index) => {
		const ext = filename.substring(filename.lastIndexOf('.'));
		const uuid =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
		return `${index}_${uuid}${ext}`;
	};

	const submit_proposal = async () => {
		if (!check_login(me) || is_submitting_proposal) return;

		// 유효성 검사
		const validation_errors = validate_proposal_data(proposal_form);
		if (validation_errors.length > 0) {
			show_toast('error', validation_errors[0]);
			return;
		}

		is_submitting_proposal = true;
		try {
			// 연락처 정보 가져오기 (user_contacts에서)
			const contact_phone = me.user_contact?.contact_phone || '';
			const formatted_contact =
				contact_phone.length === 11
					? `${contact_phone.slice(0, 3)}-${contact_phone.slice(3, 7)}-${contact_phone.slice(7)}`
					: contact_phone;

			// 1. 제안서 생성
			const new_proposal = await api.work_request_proposals.insert(
				{
					work_request_id: work_request.id,
					message: proposal_form.message,
					contact_info: formatted_contact || null,
					proposed_amount: parseInt(proposal_form.proposed_amount) || 0,
				},
				user.id,
			);

			// 2. 파일이 있으면 업로드
			if (attached_files.length > 0) {
				const timestamp = Date.now();
				const files_with_paths = attached_files.map((file, index) => ({
					path: `${user.id}/${new_proposal.id}/${timestamp}_${sanitize_filename(file.name, index)}`,
					file: file,
				}));

				// Storage에 업로드
				const upload_result =
					await api.proposal_attachments_bucket.upload_multiple(
						files_with_paths,
					);

				// DB에 첨부파일 정보 저장
				if (upload_result.successful_uploads.length > 0) {
					const attachments_data = upload_result.successful_uploads.map(
						(upload) => {
							const file = attached_files[upload.index];
							return {
								proposal_id: new_proposal.id,
								file_url: upload.path,
								file_name: file.name,
								file_size: file.size,
								file_type: file.type,
							};
						},
					);

					await api.proposal_attachments.insert_multiple(
						attachments_data,
						user.id,
					);
				}
			}

			show_toast('success', SUCCESS_MESSAGES.PROPOSAL_SUBMITTED);
			show_proposal_modal = false;

			// 제안서 목록 새로고침
			proposals = await api.work_request_proposals.select_by_work_request_id(
				work_request.id,
			);

			// 폼 초기화
			proposal_form = {
				message: '',
				proposed_amount: '',
			};
			attached_files = [];
		} catch (error) {
			console.error('Proposal submission error:', error);

			let errorMessage = ERROR_MESSAGES.SERVER_ERROR;

			if (error.message.includes('로그인')) {
				errorMessage = '로그인이 필요합니다.';
			} else if (error.message.includes('마감된')) {
				errorMessage = ERROR_MESSAGES.REQUEST_NOT_OPEN;
			} else if (error.message.includes('이미')) {
				errorMessage = ERROR_MESSAGES.ALREADY_PROPOSED;
			} else if (error.message.includes('자신의')) {
				errorMessage = '자신의 요청에는 제안할 수 없습니다.';
			} else if (error.message.includes('존재하지')) {
				errorMessage = ERROR_MESSAGES.NOT_FOUND;
			}

			show_toast('error', errorMessage);
		} finally {
			is_submitting_proposal = false;
		}
	};

	const can_submit_proposal = () => {
		return (
			user &&
			work_request.status === 'open' &&
			work_request.requester_id !== user.id &&
			!proposals.some((p) => p.expert_id === user.id)
		);
	};

	const handle_proposal_click = () => {
		if (!check_login(me)) return;
		if (!check_contact(me)) return;

		// 나머지 조건 체크
		if (work_request.status !== 'open') {
			show_toast('error', '마감된 요청입니다.');
			return;
		}

		if (work_request.requester_id === user.id) {
			show_toast('error', '자신의 요청에는 제안할 수 없습니다.');
			return;
		}

		if (proposals.some((p) => p.expert_id === user.id)) {
			show_toast('error', '이미 제안하셨습니다.');
			return;
		}

		show_proposal_modal = true;
	};

	// 연락처 복사
	const copyContactInfo = async (contact_info) => {
		try {
			await navigator.clipboard.writeText(contact_info);
			show_toast('success', '연락처가 클립보드에 복사되었습니다.');
		} catch (error) {
			// fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = contact_info;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			show_toast('success', '연락처가 클립보드에 복사되었습니다.');
		}
	};

	const is_requester = () => {
		return user && work_request.requester_id === user.id;
	};

	// 제안 작성자인지 확인
	const is_proposal_author = (proposal) => {
		return user && proposal.expert_id === user.id;
	};

	// 내가 제안한 적이 있는지 확인
	const has_my_proposal = () => {
		return user && proposals.some((p) => p.expert_id === user.id);
	};

	// 제안 내용을 볼 수 있는지 확인 (모든 제안이 비밀 - 의뢰인+제안자만 열람 가능)
	const can_view_proposal = (proposal) => {
		if (!user) return false;
		return is_requester() || is_proposal_author(proposal);
	};

	// 제안 수락
	const accept_proposal = async (proposal_id) => {
		const selected_proposal = proposals.find((p) => p.id === proposal_id);

		if (
			!confirm(
				`이 제안을 수락하시겠습니까?\n\n제안 금액: ₩${comma(selected_proposal.proposed_amount)}`,
			)
		) {
			return;
		}

		try {
			await api.work_requests.accept_proposal(work_request.id, proposal_id);
			show_toast('success', '제안이 수락되었습니다.');

			// 데이터 새로고침
			const [updated_request, updated_proposals] = await Promise.all([
				api.work_requests.select_by_id(work_request.id),
				api.work_request_proposals.select_by_work_request_id(work_request.id),
			]);

			work_request = updated_request;
			proposals = updated_proposals;
		} catch (error) {
			console.error('Proposal acceptance error:', error);
			show_toast('error', ERROR_MESSAGES.SERVER_ERROR);
		}
	};

	const reject_proposal = async (proposal_id) => {
		if (!confirm('이 제안을 거절하시겠습니까?')) {
			return;
		}

		try {
			await api.work_request_proposals.reject(proposal_id);
			show_toast('success', SUCCESS_MESSAGES.PROPOSAL_REJECTED);

			// 제안 목록 새로고침
			proposals = await api.work_request_proposals.select_by_work_request_id(
				work_request.id,
			);
		} catch (error) {
			console.error('Proposal rejection error:', error);
			show_toast('error', ERROR_MESSAGES.SERVER_ERROR);
		}
	};

	// 공고 마감
	const handle_close = async () => {
		if (
			!confirm(
				'공고를 마감하시겠습니까?\n마감 후에는 더 이상 제안을 받을 수 없습니다.',
			)
		) {
			return;
		}

		try {
			const updated = await api.work_requests.close(work_request.id, user.id);
			work_request = { ...work_request, ...updated };
			show_toast('success', '공고가 마감되었습니다.');
		} catch (error) {
			console.error('Close error:', error);
			show_toast('error', error.message || '공고 마감에 실패했습니다.');
		}
	};

	// 프로젝트 완료
	const handle_complete = async () => {
		if (!confirm('프로젝트를 완료하시겠습니까?')) {
			return;
		}

		try {
			const updated = await api.work_requests.complete(
				work_request.id,
				user.id,
			);
			work_request = { ...work_request, ...updated };
			show_toast('success', '프로젝트가 완료되었습니다.');
		} catch (error) {
			console.error('Complete error:', error);
			show_toast('error', error.message || '프로젝트 완료에 실패했습니다.');
		}
	};

	// 수락된 제안 개수
	const accepted_count = $derived(
		proposals.filter((p) => p.status === 'accepted').length,
	);

	// 각 제안의 첨부파일 로드
	const load_attachments = async () => {
		try {
			const attachments_promises = proposals.map(async (proposal) => {
				const attachments =
					await api.proposal_attachments.select_by_proposal_id(proposal.id);
				return { proposal_id: proposal.id, attachments };
			});

			const results = await Promise.all(attachments_promises);
			const new_map = {};
			results.forEach((result) => {
				new_map[result.proposal_id] = result.attachments;
			});
			proposal_attachments_map = new_map;
		} catch (error) {
			console.error('Failed to load attachments:', error);
		}
	};

	// 페이지 로드 시 첨부파일 로드
	onMount(() => {
		load_attachments();
	});
</script>

<svelte:head>
	<title>{work_request.title} | 문</title>
	<meta name="description" content={work_request.description} />
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back} aria-label="이전 페이지로 돌아가기">
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">외주 공고</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-gray-50 pb-32">
	<!-- 요청 정보 -->
	<div class="px-4 pt-4 pb-6">
		<div
			class="rounded-xl border border-gray-100/60 bg-white p-5 transition-all"
		>
			<!-- 카테고리 칩과 상태 -->
			<div class="mb-3 flex items-start justify-between">
				<div class="flex-1">
					{#if work_request.category}
						<div class="mb-2">
							<span
								class="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
							>
								{work_request.category}
							</span>
						</div>
					{/if}
					<h1
						class="mt-4 line-clamp-2 text-xl leading-tight font-semibold text-gray-900"
					>
						{work_request.title}
					</h1>
				</div>
				<span
					class={`ml-3 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${get_request_status_display(work_request.status).bgColor} ${get_request_status_display(work_request.status).textColor}`}
				>
					{get_request_status_display(work_request.status).text}
				</span>
			</div>

			<!-- 보상금 -->
			<div class="mb-8">
				<span class="text-lg font-medium text-blue-600">
					{#if work_request.price_unit === 'quote' || !work_request.reward_amount}
						제안 받기
					{:else}
						{get_price_unit_label(work_request.price_unit)}
						{comma(work_request.reward_amount)}원
					{/if}
				</span>
			</div>

			<!-- 메타 정보 -->
			<div class="mb-4 space-y-3">
				{#if work_request.posting_start_date && work_request.posting_end_date}
					<div class="flex items-center text-sm">
						<span class="w-20 text-gray-500">공고 기간</span>
						<span class="font-medium text-gray-900">
							{new Date(work_request.posting_start_date).toLocaleDateString(
								'ko-KR',
							)} ~
							{new Date(work_request.posting_end_date).toLocaleDateString(
								'ko-KR',
							)}
						</span>
					</div>
				{:else if work_request.posting_end_date}
					<div class="flex items-center text-sm">
						<span class="w-20 text-gray-500">공고 마감</span>
						<span class="font-medium text-gray-900">
							{new Date(work_request.posting_end_date).toLocaleDateString(
								'ko-KR',
							)}
						</span>
					</div>
				{/if}

				<div class="flex items-center text-sm">
					<span class="w-20 text-gray-500">모집인원</span>
					<span class="font-medium text-gray-900">
						{work_request.max_applicants}명
					</span>
				</div>

				<div class="flex items-center text-sm">
					<span class="w-20 text-gray-500">근무지</span>
					<span class="font-medium text-gray-900">
						{work_request.work_location}
					</span>
				</div>

				{#if work_request.work_start_date && work_request.work_end_date}
					<div class="flex items-center text-sm">
						<span class="w-20 text-gray-500">예상 기간</span>
						<span class="font-medium text-gray-900">
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
			<div class="mt-8 flex items-center justify-between text-sm">
				<button
					class="-m-1 flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-50"
					onclick={() =>
						work_request.users?.handle &&
						goto(`/@${work_request.users.handle}`)}
					aria-label="{work_request.users?.name ||
						work_request.users?.handle}님의 프로필 보기"
				>
					{#if work_request.users?.avatar_url}
						<img
							src={optimize_avatar(work_request.users.avatar_url)}
							alt="{work_request.users.name ||
								work_request.users.handle}님의 프로필 사진"
							class="aspect-square h-6 w-6 rounded-full"
							loading="lazy"
							width="24"
							height="24"
						/>
					{:else}
						<div
							class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200"
						>
							<span class="text-xs text-gray-500">
								{(work_request.users?.name ||
									work_request.users?.handle)?.[0]?.toUpperCase()}
							</span>
						</div>
					{/if}
					<span class="font-medium text-gray-700">
						{work_request.users?.name || work_request.users?.handle}
					</span>
				</button>
				<span class="text-gray-400">
					{new Date(work_request.created_at).toLocaleDateString('ko-KR', {
						month: 'short',
						day: 'numeric',
					})}
				</span>
			</div>
		</div>
	</div>

	<!-- 상세 설명 -->
	<div class="px-4 pb-6">
		<div class="rounded-xl border border-gray-100/60 bg-white p-5">
			<h3 class="mb-3 font-semibold text-gray-900">프로젝트 설명</h3>
			<div
				class="prose prose-sm max-w-none text-sm leading-relaxed text-gray-600"
			>
				{@html work_request.description}
			</div>
		</div>
	</div>

	<!-- 제안서 섹션 -->
	<div class="px-4">
		<div class="rounded-xl border border-gray-100/60 bg-white p-5">
			<!-- 의뢰인 또는 제안자 본인: 제안 목록 표시 -->
			{#if is_requester() || has_my_proposal()}
				<div class="mb-4">
					<h2 class="font-semibold text-gray-900">
						받은 제안 ({proposals.length}개)
					</h2>
				</div>

				{#if proposals.length > 0}
					<div class="space-y-3">
						{#each proposals.filter((p) => is_requester() || is_proposal_author(p)) as proposal}
							<div class="overflow-hidden rounded-xl border border-gray-100">
								<!-- 상단 정보 영역 -->
								<div class="p-4">
									<div class="flex items-start gap-3">
										<button
											class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 transition-opacity hover:opacity-80"
											onclick={() =>
												proposal.users?.handle &&
												goto(`/@${proposal.users.handle}`)}
											aria-label="{proposal.users?.name ||
												proposal.users?.handle}님의 프로필 보기"
										>
											{#if proposal.users?.avatar_url}
												<img
													src={optimize_avatar(proposal.users.avatar_url)}
													alt="{proposal.users.name ||
														proposal.users.handle}님의 프로필 사진"
													class="h-full w-full object-cover"
													loading="lazy"
													width="40"
													height="40"
												/>
											{:else}
												<span class="text-sm text-gray-500">
													{(proposal.users?.name ||
														proposal.users?.handle)?.[0]?.toUpperCase()}
												</span>
											{/if}
										</button>
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<button
													class="text-sm font-medium text-gray-900 transition-colors hover:text-blue-600"
													onclick={() =>
														proposal.users?.handle &&
														goto(`/@${proposal.users.handle}`)}
													aria-label="{proposal.users?.name ||
														proposal.users?.handle}님의 프로필 보기"
												>
													{proposal.users?.name || proposal.users?.handle}
												</button>
												{#if proposal.status === 'accepted'}
													<span
														class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600"
													>
														수락됨
													</span>
												{:else if proposal.status === 'rejected'}
													<span
														class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
													>
														거절됨
													</span>
												{/if}
											</div>
											<div class="flex items-center gap-2">
												<p class="text-xs text-gray-500">
													{new Date(proposal.created_at).toLocaleDateString(
														'ko-KR',
														{
															month: 'numeric',
															day: 'numeric',
														},
													)}
												</p>
												{#if proposal.proposed_amount}
													<span class="text-sm font-semibold text-blue-600">
														₩{comma(proposal.proposed_amount)}
													</span>
												{/if}
											</div>
										</div>
									</div>

									<!-- 제안 내용 표시 -->
									<p
										class="overflow-wrap-anywhere mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-gray-600"
									>
										{proposal.message}
									</p>

									<!-- 첨부파일 표시 -->
									{#if proposal_attachments_map[proposal.id]?.length > 0}
										<div class="mt-3">
											<p class="mb-2 text-xs font-medium text-gray-600">
												첨부파일
											</p>
											<div class="space-y-2">
												{#each proposal_attachments_map[proposal.id] as attachment}
													<a
														href={api.proposal_attachments_bucket.get_public_url(
															attachment.file_url,
														)}
														download={attachment.file_name}
														target="_blank"
														class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 transition-colors hover:bg-gray-100"
													>
														<span class="text-base">📄</span>
														<div class="min-w-0 flex-1">
															<p
																class="truncate text-xs font-medium text-gray-700"
															>
																{attachment.file_name}
															</p>
															<p class="text-xs text-gray-500">
																{format_file_size(attachment.file_size)}
															</p>
														</div>
														<svg
															class="h-4 w-4 text-gray-400"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
															/>
														</svg>
													</a>
												{/each}
											</div>
										</div>
									{/if}

									<!-- 연락처 정보 -->
									{#if proposal.contact_info && (is_requester() || proposal.status === 'accepted')}
										<div
											class="mt-3 flex items-center gap-1 text-sm text-gray-600"
										>
											<span>📞</span>
											<span>{proposal.contact_info}</span>
										</div>
									{/if}

									<!-- 하단 버튼 영역 (의뢰인에게만 표시) -->
									{#if is_requester() && proposal.status === 'pending' && ['open', 'in_progress'].includes(work_request.status)}
										<div class="mt-4 flex gap-2">
											<button
												onclick={() => copyContactInfo(proposal.contact_info)}
												class="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
												aria-label="연락처 복사하기"
											>
												문의하기
											</button>
											<button
												onclick={() => accept_proposal(proposal.id)}
												class="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
												aria-label="{proposal.users?.name ||
													proposal.users?.handle}님의 제안 수락하기"
											>
												수락하기
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="py-8 text-center">
						<div
							class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
						>
							<RiTimeLine size={20} color={colors.gray[400]} />
						</div>
						<h3 class="mb-2 font-medium text-gray-900">아직 제안이 없어요</h3>
						<p class="text-sm text-gray-500">첫 번째로 제안해보세요!</p>
					</div>
				{/if}
			{:else}
				<!-- 일반 사용자: 제안 수만 표시 -->
				<div class="py-6 text-center">
					<div
						class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50"
					>
						<RiUser3Line size={20} color={colors.primary} />
					</div>
					{#if proposals.length > 0}
						<h3 class="mb-1 font-medium text-gray-900">
							{proposals.length}명이 제안했어요
						</h3>
						<p class="text-sm text-gray-500">
							제안 내용은 의뢰인만 확인할 수 있습니다
						</p>
					{:else}
						<h3 class="mb-1 font-medium text-gray-900">아직 제안이 없어요</h3>
						<p class="text-sm text-gray-500">첫 번째로 제안해보세요!</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</main>

<!-- 하단 고정 버튼 -->
{#if is_requester()}
	<!-- 의뢰인: 마감/완료 버튼 -->
	{#if work_request.status === 'open'}
		<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
			<button
				class="btn btn-primary w-full"
				onclick={handle_close}
				aria-label="공고 마감하기"
			>
				모집 마감하기
				{#if accepted_count > 0}
					<span class="ml-1 text-blue-200">({accepted_count}명 수락됨)</span>
				{/if}
			</button>
		</div>
	{:else if work_request.status === 'in_progress'}
		<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
			<button
				class="btn btn-primary w-full"
				onclick={handle_complete}
				aria-label="프로젝트 완료하기"
			>
				프로젝트 완료
			</button>
		</div>
	{/if}
{:else if work_request.status === 'open'}
	<!-- 전문가: 제안하기 버튼 -->
	<FixedBottomButton>
		<button class="btn btn-primary flex-1" onclick={handle_proposal_click}>
			견적 제안하기
		</button>
	</FixedBottomButton>
{/if}

<!-- 제안서 작성 모달 -->
<ProposalModal
	bind:is_open={show_proposal_modal}
	bind:form_data={proposal_form}
	bind:attached_files
	is_submitting={is_submitting_proposal}
	on_submit={submit_proposal}
	on_file_select={handle_file_select}
	on_file_remove={remove_file}
/>
