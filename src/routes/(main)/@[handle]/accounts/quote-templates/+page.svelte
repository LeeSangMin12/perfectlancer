<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiFileList2Line,
	} from 'svelte-remixicon';

	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let templates = $state([]);
	let is_loading = $state(true);

	onMount(async () => {
		if (!me?.id) {
			is_loading = false;
			return;
		}

		try {
			templates = await api.quote_templates.select_by_user_id(me.id);
		} catch (e) {
			console.error('Failed to load templates:', e);
			show_toast('error', '견적서 템플릿을 불러오는데 실패했습니다.');
		} finally {
			is_loading = false;
		}
	});
</script>

<svelte:head>
	<title>견적서 템플릿 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="외주 견적서 템플릿을 관리하는 페이지입니다."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button class="flex items-center" onclick={smart_go_back}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">견적서 템플릿</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-gray-50 pb-28">
	{#if is_loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else if templates.length > 0}
		<!-- 견적서 리스트 -->
		<ul class="divide-y divide-gray-100 bg-white">
			{#each templates as template}
				<li>
					<a
						href={`/@${me?.handle}/accounts/quote-templates/${template.id}`}
						class="flex items-center justify-between px-5 py-4 active:bg-gray-50"
					>
						<div class="min-w-0 flex-1">
							<p class="text-[15px] font-medium text-gray-900 truncate">
								{template.title}
							</p>
							<div class="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
								{#if template.price}
									<span class="font-medium text-gray-700">₩{comma(template.price)}</span>
								{:else}
									<span class="text-gray-400">가격 미설정</span>
								{/if}
								{#if template.duration}
									<span class="text-gray-300">·</span>
									<span>{template.duration}</span>
								{/if}
							</div>
						</div>
						<RiArrowRightSLine size={20} color={colors.gray[300]} class="flex-shrink-0 ml-3" />
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<!-- 빈 상태 -->
		<div class="flex flex-col items-center justify-center px-5 py-20">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200"
			>
				<RiFileList2Line size={28} color={colors.gray[400]} />
			</div>
			<p class="mt-4 text-center text-[15px] text-gray-600">
				등록된 견적서 템플릿이 없어요
			</p>
			<p class="mt-1 text-center text-sm text-gray-400">
				템플릿을 만들어두면 제안할 때 빠르게 사용할 수 있어요
			</p>
		</div>
	{/if}
</main>

<FixedBottomButton>
	<a href="/regi/quote-template" class="btn btn-primary w-full">
		<RiAddLine size={18} />
		견적 템플릿 추가
	</a>
</FixedBottomButton>
