<script>
	/**
	 * ServiceProposal - 서비스 제안서/견적 컴포넌트
	 *
	 * 기존 서비스 상세 페이지 스타일에 맞춘 자연스러운 견적 표시
	 */
	import colors from '$lib/config/colors';
	import { comma } from '$lib/utils/common';
	import { RiCheckboxCircleLine } from 'svelte-remixicon';

	/**
	 * @typedef {Object} WorkStep
	 * @property {string} title - 단계 제목
	 * @property {string} [description] - 단계 설명
	 */

	/**
	 * @typedef {Object} Props
	 * @property {WorkStep[]} steps - 작업 단계
	 * @property {string[]} deliverables - 산출물 목록
	 * @property {number} price - 가격
	 * @property {string} duration - 총 소요 기간
	 * @property {string[]} [includes] - 포함 사항
	 */
	let {
		steps = [],
		deliverables = [],
		price = 0,
		duration = '',
		includes = [],
	} = $props();
</script>

<div class="space-y-8">
	<!-- 작업 프로세스 -->
	{#if steps.length > 0}
		<div>
			<h3 class="mb-4 text-base font-bold text-gray-900">작업 프로세스</h3>

			<div class="relative">
				<!-- 연결선 -->
				<div class="absolute top-3 bottom-3 left-[11px] w-px bg-gray-200"></div>

				<div class="space-y-4">
					{#each steps as step, i}
						<div class="relative flex gap-4">
							<div
								class="bg-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
							>
								{i + 1}
							</div>
							<div class="flex-1 pb-1">
								<p class="font-medium text-gray-900">{step.title}</p>
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
		<div>
			<h3 class="mb-4 text-base font-bold text-gray-900">받으시는 산출물</h3>

			<div class="space-y-2.5">
				{#each deliverables as item}
					<div class="flex items-start gap-2.5">
						<RiCheckboxCircleLine
							size={18}
							color={colors.primary}
							class="mt-0.5 flex-shrink-0"
						/>
						<span class="text-gray-700">{item}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 견적 요약 -->
	<div class="rounded-xl bg-gray-50 p-5">
		<div class="mb-4 flex items-end justify-between">
			<div>
				<p class="mb-1 text-sm text-gray-500">서비스 비용</p>
				<p class="text-2xl font-bold text-gray-900">₩{comma(price)}</p>
			</div>
			<div class="text-right">
				<p class="mb-1 text-sm text-gray-500">작업 기간</p>
				<p class="text-lg font-semibold text-gray-900">{duration}</p>
			</div>
		</div>

		{#if includes.length > 0}
			<div class="border-t border-gray-200 pt-4">
				<p class="mb-2 text-xs text-gray-500">포함 사항</p>
				<div class="flex flex-wrap gap-2">
					{#each includes as item}
						<span
							class="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600"
						>
							{item}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
