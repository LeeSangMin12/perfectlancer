<script>
	/**
	 * 외주 공고 카드 컴포넌트
	 * @component
	 */
	import { goto } from '$app/navigation';
	import { comma, check_login, show_toast } from '$lib/utils/common.js';
	import { get_request_status_display } from '$lib/utils/expert_request_utils.js';
	import { get_api_context, get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { RiBookmarkLine, RiBookmarkFill } from 'svelte-remixicon';
	import colors from '$lib/config/colors';

	/**
	 * @typedef {Object} Props
	 * @property {Object} request - 외주 공고 객체
	 * @property {string} [href] - 링크 URL
	 * @property {string} [class] - 추가 CSS 클래스
	 * @property {boolean} [is_bookmarked] - 북마크 여부
	 * @property {Function} [on_bookmark_changed] - 북마크 변경 콜백
	 */

	let { request, href, class: className = 'mb-4', is_bookmarked = false, on_bookmark_changed } = $props();

	const me = get_user_context();
	const api = get_api_context();

	let is_bookmarking = $state(false);

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

	// 북마크 토글
	async function toggle_bookmark(e) {
		e.stopPropagation();
		if (!check_login(me) || is_bookmarking) return;

		is_bookmarking = true;
		try {
			if (is_bookmarked) {
				await api.work_request_bookmarks.delete(request.id, me.id);
				on_bookmark_changed?.({
					work_request_id: request.id,
					action: 'remove',
					user_id: me.id,
				});
			} else {
				await api.work_request_bookmarks.insert(request.id, me.id);
				on_bookmark_changed?.({
					work_request_id: request.id,
					action: 'add',
					user_id: me.id,
				});
			}
		} catch (error) {
			console.error('Bookmark toggle failed:', error);
			show_toast('error', '북마크 처리 중 오류가 발생했습니다.');
		} finally {
			is_bookmarking = false;
		}
	}
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
			<div class="ml-3 flex flex-shrink-0 items-center gap-2">
				<span
					class="rounded-md px-2.5 py-1 text-xs font-medium {status_display.bgColor} {status_display.textColor}"
				>
					{status_display.text}
				</span>
				<button
					onclick={toggle_bookmark}
					class="p-1"
					aria-label={is_bookmarked ? '북마크 해제' : '북마크'}
				>
					{#if is_bookmarked}
						<RiBookmarkFill size={18} color={colors.primary} />
					{:else}
						<RiBookmarkLine size={18} color={colors.gray[400]} />
					{/if}
				</button>
			</div>
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
