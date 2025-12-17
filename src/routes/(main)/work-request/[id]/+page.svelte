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
	import { optimize_avatar } from '$lib/utils/image';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiTimeLine,
		RiUser3Line,
	} from 'svelte-remixicon';

	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import AddAdditionalRequestModal from '$lib/components/modals/AddAdditionalRequestModal.svelte';
	import WorkRequestReviewModal from '$lib/components/modals/WorkRequestReviewModal.svelte';
	import { RiStarFill } from 'svelte-remixicon';

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
	let { work_request, proposals, payment_statuses, reviews, user } = $state(data);

	// 내 제안 찾기
	const my_proposal = $derived(
		user ? proposals.find((p) => p.expert_id === user.id) : null,
	);

	// 모달 상태
	let show_accept_modal = $state(false);
	let show_reject_modal = $state(false);
	let show_close_modal = $state(false);
	let show_proposal_complete_modal = $state(false);
	let show_additional_request_modal = $state(false);
	let show_review_modal = $state(false);
	let selected_proposal_id = $state(null);
	let selected_proposal_for_review = $state(null);

	// 추가 요청사항
	const additional_requests = $derived(work_request.additional_requests || []);

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
	const accept_proposal = async () => {
		try {
			await api.work_requests.accept_proposal(
				work_request.id,
				selected_proposal_id,
			);
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
		} finally {
			show_accept_modal = false;
			selected_proposal_id = null;
		}
	};

	const reject_proposal = async () => {
		try {
			await api.work_request_proposals.reject(selected_proposal_id);
			show_toast('success', SUCCESS_MESSAGES.PROPOSAL_REJECTED);

			// 제안 목록 새로고침
			proposals = await api.work_request_proposals.select_by_work_request_id(
				work_request.id,
			);
		} catch (error) {
			console.error('Proposal rejection error:', error);
			show_toast('error', ERROR_MESSAGES.SERVER_ERROR);
		} finally {
			show_reject_modal = false;
			selected_proposal_id = null;
		}
	};

	// 공고 마감
	const handle_close = async () => {
		try {
			const updated = await api.work_requests.close(work_request.id, user.id);
			work_request = { ...work_request, ...updated };
			show_toast('success', '공고가 마감되었습니다.');
		} catch (error) {
			console.error('Close error:', error);
			show_toast('error', error.message || '공고 마감에 실패했습니다.');
		} finally {
			show_close_modal = false;
		}
	};

	// 개별 제안 완료 처리
	const handle_proposal_complete = async () => {
		if (!selected_proposal_id) return;

		try {
			await api.work_request_proposals.complete_proposal(
				selected_proposal_id,
				work_request.id,
				user.id,
			);
			show_toast('success', '서비스 완료 처리되었습니다.');

			// 데이터 새로고침
			const [updated_request, updated_proposals] = await Promise.all([
				api.work_requests.select_by_id(work_request.id),
				api.work_request_proposals.select_by_work_request_id(work_request.id),
			]);

			work_request = updated_request;
			proposals = updated_proposals;
		} catch (error) {
			console.error('Proposal complete error:', error);
			show_toast('error', error.message || '완료 처리에 실패했습니다.');
		} finally {
			show_proposal_complete_modal = false;
			selected_proposal_id = null;
		}
	};

	// 수락된 제안 개수
	const accepted_count = $derived(
		proposals.filter((p) => p.status === 'accepted').length,
	);

	// 요청사항 추가 후 새로고침
	const refresh_work_request = async () => {
		try {
			const updated = await api.work_requests.select_by_id(work_request.id);
			work_request = updated;
		} catch (error) {
			console.error('Refresh error:', error);
		}
	};

	// 공고 재등록
	const handle_reregister = () => {
		// 기존 공고 데이터를 sessionStorage에 저장
		const reregister_data = {
			title: work_request.title,
			category: work_request.category,
			description: work_request.description,
			reward_amount: work_request.reward_amount,
			price_unit: work_request.price_unit,
			job_type: work_request.job_type,
			posting_start_date: work_request.posting_start_date,
			posting_end_date: work_request.posting_end_date,
			work_start_date: work_request.work_start_date,
			work_end_date: work_request.work_end_date,
			max_applicants: work_request.max_applicants,
			work_location: work_request.work_location,
		};
		sessionStorage.setItem(
			'work_request_reregister',
			JSON.stringify(reregister_data),
		);
		goto('/regi/work-request');
	};

	// 리뷰 작성 성공 핸들러
	const handle_review_success = (new_review) => {
		reviews = { ...reviews, [new_review.proposal_id]: new_review };
		selected_proposal_for_review = null;
	};

	// 리뷰 모달 열기
	const open_review_modal = (proposal) => {
		selected_proposal_for_review = proposal;
		show_review_modal = true;
	};

	// 완료 요청 모달
	let show_completion_request_modal = $state(false);

	// 전문가 완료 요청 핸들러
	const handle_request_completion = async () => {
		if (!selected_proposal_id) return;

		try {
			await api.work_request_proposals.request_completion(selected_proposal_id, user.id);
			show_toast('success', '완료 요청이 전송되었습니다. 의뢰인이 7일 내 응답하지 않으면 자동 완료됩니다.');

			// 데이터 새로고침
			proposals = await api.work_request_proposals.select_by_work_request_id(work_request.id);
		} catch (error) {
			console.error('Completion request error:', error);
			show_toast('error', error.message || '완료 요청에 실패했습니다.');
		} finally {
			show_completion_request_modal = false;
			selected_proposal_id = null;
		}
	};

	// 완료 요청 후 남은 일수 계산
	const get_remaining_days = (completion_requested_at) => {
		if (!completion_requested_at) return null;
		const requested = new Date(completion_requested_at);
		const auto_complete = new Date(requested);
		auto_complete.setDate(auto_complete.getDate() + 7);
		const now = new Date();
		const diff = Math.ceil((auto_complete - now) / (1000 * 60 * 60 * 24));
		return Math.max(0, diff);
	};
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
		<!-- 거절 사유 (의뢰인에게만 표시) -->
		{#if work_request.status === 'rejected' && is_requester() && work_request.admin_reject_reason}
			<div class="mb-4 rounded-lg bg-red-50 p-4">
				<p class="text-sm font-medium text-red-800">거절 사유</p>
				<p class="mt-1 text-sm text-red-700">
					{work_request.admin_reject_reason}
				</p>
			</div>
		{/if}

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

	<!-- 추가 요청사항 -->
	{#if additional_requests.length > 0 || is_requester()}
		<div class="px-4 pb-6">
			<div class="rounded-xl border border-gray-100/60 bg-white p-5">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">
						추가 요청사항
						{#if additional_requests.length > 0}
							<span class="ml-1 text-sm font-normal text-gray-500">
								({additional_requests.length})
							</span>
						{/if}
					</h3>
					{#if is_requester() && ['open', 'in_progress'].includes(work_request.status)}
						<button
							onclick={() => (show_additional_request_modal = true)}
							class="flex items-center gap-1 text-sm font-medium text-blue-600"
						>
							<RiAddLine size={16} />
							추가
						</button>
					{/if}
				</div>

				{#if additional_requests.length > 0}
					<div class="space-y-4">
						{#each additional_requests as request (request.id)}
							<div
								class="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
							>
								<p class="text-sm leading-relaxed text-gray-700">
									{request.content}
								</p>
								{#if request.images && request.images.length > 0}
									<div class="mt-3 flex flex-wrap gap-2">
										{#each request.images as image (image)}
											<img
												src={image}
												alt="첨부 이미지"
												class="h-20 w-20 rounded-lg object-cover"
											/>
										{/each}
									</div>
								{/if}
								<p class="mt-2 text-xs text-gray-400">
									{new Date(request.created_at).toLocaleDateString('ko-KR', {
										month: 'numeric',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
									})}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500">아직 추가된 요청사항이 없습니다.</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- 제안서 섹션 -->
	<div class="px-4">
		<!-- 의뢰인 또는 제안자 본인: 제안 목록 표시 -->
		{#if is_requester() || has_my_proposal()}
			<div class="mb-3">
				<h2 class="font-semibold text-gray-900">
					받은 제안 ({proposals.length}개)
				</h2>
			</div>

			{#if proposals.length > 0}
				<div class="space-y-3">
					{#each proposals.filter((p) => is_requester() || is_proposal_author(p)) as proposal}
						<div
							class="overflow-hidden rounded-xl border border-gray-200 bg-white"
						>
							<div class="p-4">
								<!-- 상단: 프로필 + 가격 -->
								<div class="mb-3 flex items-start justify-between">
									<button
										class="flex items-center gap-3"
										onclick={() =>
											proposal.users?.handle &&
											goto(`/@${proposal.users.handle}`)}
									>
										<div
											class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200"
										>
											{#if proposal.users?.avatar_url}
												<img
													src={optimize_avatar(proposal.users.avatar_url)}
													alt=""
													class="h-full w-full object-cover"
												/>
											{:else}
												<span class="text-sm text-gray-500">
													{(proposal.users?.name ||
														proposal.users?.handle)?.[0]?.toUpperCase()}
												</span>
											{/if}
										</div>
										<div class="text-left">
											<p class="text-sm font-medium text-gray-900">
												{proposal.users?.name || proposal.users?.handle}
											</p>
											<p class="text-xs text-gray-500">
												{new Date(proposal.created_at).toLocaleDateString(
													'ko-KR',
													{ month: 'numeric', day: 'numeric' },
												)}
											</p>
										</div>
									</button>
									<div class="text-right">
										{#if proposal.status === 'completed'}
											<span
												class="mb-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
											>
												완료
											</span>
										{:else if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'confirmed'}
											<span
												class="mb-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600"
											>
												진행중
											</span>
										{:else if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'pending'}
											<span
												class="mb-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600"
											>
												입금 대기
											</span>
										{:else if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'rejected'}
											<span
												class="mb-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"
											>
												입금 미확인
											</span>
										{:else if proposal.status === 'rejected'}
											<span
												class="mb-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
											>
												거절됨
											</span>
										{/if}
										{#if proposal.proposed_amount}
											<p class="text-base font-bold text-blue-600">
												₩{comma(proposal.proposed_amount)}
											</p>
										{/if}
									</div>
								</div>

								<!-- 제안 메시지 미리보기 -->
								<p class="mb-4 line-clamp-2 text-sm text-gray-600">
									{proposal.message}
								</p>

								<!-- 리뷰 표시 (완료된 제안 + 리뷰 있음) -->
								{#if proposal.status === 'completed' && reviews[proposal.id]}
									<div class="mb-4 rounded-lg bg-gray-50 p-3">
										<div class="mb-2 flex items-center gap-1">
											{#each [1, 2, 3, 4, 5] as star}
												<RiStarFill
													size={14}
													class={star <= reviews[proposal.id].rating
														? 'text-yellow-400'
														: 'text-gray-300'}
												/>
											{/each}
											<span class="ml-1 text-xs text-gray-500">
												{reviews[proposal.id].rating}.0
											</span>
										</div>
										{#if reviews[proposal.id].content}
											<p class="text-sm text-gray-600">
												{reviews[proposal.id].content}
											</p>
										{/if}
									</div>
								{/if}

								<!-- 완료 요청 상태 표시 (의뢰인 또는 전문가에게 표시) -->
								{#if proposal.status === 'accepted' && proposal.completion_requested_at && payment_statuses[proposal.id] === 'confirmed'}
									<div class="mb-3 rounded-lg bg-blue-50 px-3 py-2">
										<p class="text-sm text-blue-700">
											완료 요청됨 ·
											{#if get_remaining_days(proposal.completion_requested_at) > 0}
												{get_remaining_days(proposal.completion_requested_at)}일 후 자동 완료
											{:else}
												곧 자동 완료 예정
											{/if}
										</p>
									</div>
								{/if}

								<!-- 버튼 영역 -->
								<div class="flex gap-2">
									<a
										href={`/work-request/${work_request.id}/proposal/${proposal.id}`}
										class="btn btn-gray flex-1"
									>
										견적서 보기
									</a>

									{#if is_requester()}
										{#if proposal.status === 'completed' && !reviews[proposal.id]}
											<button
												onclick={() => open_review_modal(proposal)}
												class="btn btn-primary flex-1"
											>
												리뷰 작성
											</button>
										{:else if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'confirmed'}
											<button
												onclick={() => {
													selected_proposal_id = proposal.id;
													show_proposal_complete_modal = true;
												}}
												class="btn btn-primary flex-1"
											>
												서비스 완료
											</button>
										{:else if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'pending'}
											<span class="flex-1 rounded-lg bg-amber-50 py-2.5 text-center text-sm font-medium text-amber-600">
												입금 확인 중
											</span>
										{:else if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'rejected'}
											<button
												onclick={() => goto(`/work-request/${work_request.id}/payment?proposal_id=${proposal.id}`)}
												class="btn btn-primary flex-1"
											>
												다시 결제하기
											</button>
										{:else if proposal.status === 'pending'}
											<button
												onclick={() => copyContactInfo(proposal.contact_info)}
												class="btn btn-primary flex-1"
											>
												문의하기
											</button>
										{/if}
									{:else if is_proposal_author(proposal)}
										<!-- 전문가(제안자) 버튼 -->
										{#if proposal.status === 'accepted' && payment_statuses[proposal.id] === 'confirmed' && !proposal.completion_requested_at}
											<button
												onclick={() => {
													selected_proposal_id = proposal.id;
													show_completion_request_modal = true;
												}}
												class="btn btn-primary flex-1"
											>
												완료 요청
											</button>
										{/if}
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="rounded-xl border border-gray-200 bg-white py-8 text-center"
				>
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
			<div class="rounded-xl border border-gray-200 bg-white py-6 text-center">
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
</main>

<!-- 하단 고정 버튼 -->
{#if is_requester()}
	<!-- 의뢰인: 마감/재등록 버튼 -->
	{#if work_request.status === 'open'}
		<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
			<div class="pb-safe">
				<button
					class="btn btn-primary w-full"
					onclick={() => (show_close_modal = true)}
					aria-label="공고 마감하기"
				>
					모집 마감하기
					{#if accepted_count > 0}
						<span class="ml-1 text-blue-200">({accepted_count}명 수락됨)</span>
					{/if}
				</button>
			</div>
		</div>
	{:else if work_request.status === 'rejected'}
		<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
			<div class="pb-safe">
				<button
					class="btn btn-primary w-full"
					onclick={handle_reregister}
					aria-label="공고 재등록하기"
				>
					공고 재등록하기
				</button>
			</div>
		</div>
	{/if}
{:else if work_request.status === 'open'}
	<!-- 전문가: 제안하기/수정하기 버튼 -->
	<FixedBottomButton>
		{#if my_proposal && my_proposal.status === 'pending'}
			<a
				href={`/work-request/${work_request.id}/edit-proposal`}
				class="btn btn-primary flex-1"
			>
				제안 수정하기
			</a>
		{:else if !my_proposal}
			<a
				href={`/work-request/${work_request.id}/propose`}
				class="btn btn-primary flex-1"
			>
				견적 제안하기
			</a>
		{/if}
	</FixedBottomButton>
{/if}

<!-- 확인 모달들 -->
<ConfirmModal
	bind:is_open={show_close_modal}
	title="공고를 마감할까요?"
	description="마감 후에는 더 이상 제안을 받을 수 없습니다."
	button_2_text="마감"
	button_2_action={handle_close}
/>

<ConfirmModal
	bind:is_open={show_proposal_complete_modal}
	title="서비스가 완료되었나요?"
	description="서비스 완료 후에는 되돌릴 수 없습니다."
	button_2_text="완료"
	button_2_action={handle_proposal_complete}
/>

<!-- 요청사항 추가 모달 -->
<AddAdditionalRequestModal
	bind:is_open={show_additional_request_modal}
	work_request_id={work_request.id}
	user_id={user?.id}
	on_success={refresh_work_request}
/>

<!-- 리뷰 작성 모달 -->
{#if selected_proposal_for_review}
	<WorkRequestReviewModal
		bind:is_open={show_review_modal}
		proposal={selected_proposal_for_review}
		{work_request}
		reviewer_id={user?.id}
		on_success={handle_review_success}
	/>
{/if}

<!-- 완료 요청 모달 (전문가용) -->
<ConfirmModal
	bind:is_open={show_completion_request_modal}
	title="작업 완료를 요청할까요?"
	description="의뢰인에게 완료 확인 요청이 전송됩니다. 7일 내 응답이 없으면 자동으로 완료 처리됩니다."
	button_2_text="요청"
	button_2_action={handle_request_completion}
/>
