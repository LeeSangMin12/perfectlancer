<script>
	/**
	 * 외주 공고 카드 컴포넌트
	 * @component
	 */
	import { goto } from '$app/navigation';
	import { comma } from '$lib/utils/common.js';
	import { get_request_status_display } from '$lib/utils/expert_request_utils.js';

	/**
	 * @typedef {Object} Props
	 * @property {Object} request - 외주 공고 객체
	 * @property {string} [href] - 링크 URL
	 * @property {string} [class] - 추가 CSS 클래스
	 */

	let { request, href, class: className = 'mb-4' } = $props();

	// 링크 URL
	const resolved_href = $derived(href ?? `/work-request/${request?.id}`);

	// 상태 표시 정보 (유틸리티 함수 사용)
	const status_display = $derived(get_request_status_display(request?.status));

	// 제안 개수
	const proposal_count = $derived(
		request?.work_request_proposals?.[0]?.count || 0,
	);

	// 마감일 포맷
	const deadline_text = $derived.by(() => {
		if (!request?.posting_end_date) return '마감일 미정';
		const deadline = new Date(request.posting_end_date);
		const today = new Date();
		const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

		if (diff < 0) return '마감됨';
		if (diff === 0) return '오늘 마감';
		if (diff <= 7) return `D-${diff}`;
		return deadline.toLocaleDateString('ko-KR', {
			month: 'short',
			day: 'numeric',
		});
	});

	// 금액 포맷
	const PRICE_UNIT_MAP = {
		per_project: '건당',
		per_hour: '시간당',
		per_day: '일당',
		per_month: '월',
		per_year: '년',
		per_page: '장당',
	};

	const reward_text = $derived.by(() => {
		if (!request?.reward_amount) return '금액 협의';
		const amount = comma(request.reward_amount);
		const unit = PRICE_UNIT_MAP[request?.price_unit] || '';
		return unit ? `${unit} ${amount}원` : `${amount}원`;
	});

	// 근무지 포맷
	const location_text = $derived(request?.work_location || '재택/원격');

	const handle_click = () => goto(resolved_href);
</script>

{#if request}
	<div
		class="cursor-pointer transition-all {className}"
		onclick={handle_click}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && handle_click()}
	>
		<!-- 상단: 카테고리 칩과 상태 -->
		<div class="mb-1 flex items-start justify-between">
			<div class="flex-1">
				{#if request.category}
					<div class="mb-2">
						<span
							class="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
						>
							{request.category}
						</span>
					</div>
				{/if}
				<h3
					class="mt-4 line-clamp-2 text-lg leading-tight font-medium text-gray-900"
				>
					{request.title}
				</h3>
			</div>
			<span
				class="ml-3 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium {status_display.bgColor} {status_display.textColor}"
			>
				{status_display.text}
			</span>
		</div>

		<!-- 메타 정보 및 보상금 -->
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-1 text-sm text-gray-500">
				<span>{deadline_text}</span>
				<span>•</span>
				<span>{location_text}</span>
				<span>•</span>
				<span>제안 {proposal_count}개</span>
			</div>
			<span class="text-base font-semibold text-blue-600">
				{reward_text}
			</span>
		</div>
		<div class="h-0.5 w-full bg-gray-200"></div>
	</div>
{/if}
