<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast, format_date } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiDeleteBinLine,
		RiFileList2Line,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let templates = $state([]);
	let is_loading = $state(true);
	let show_delete_modal = $state(false);
	let template_to_delete = $state(null);

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

	function open_delete_modal(template) {
		template_to_delete = template;
		show_delete_modal = true;
	}

	async function confirm_delete() {
		if (!template_to_delete) return;

		try {
			await api.quote_templates.delete(template_to_delete.id);
			templates = templates.filter((t) => t.id !== template_to_delete.id);
			show_toast('success', '견적서 템플릿이 삭제되었습니다.');
		} catch (err) {
			console.error('Delete template error:', err);
			show_toast('error', '삭제에 실패했습니다.');
		} finally {
			show_delete_modal = false;
			template_to_delete = null;
		}
	}
</script>

<svelte:head>
	<title>견적서 템플릿 | 문</title>
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

<main class="min-h-screen pb-28">
	{#if is_loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else}
		<!-- 안내 -->
		<div class="bg-gray-50 px-4 py-3">
			<p class="text-sm text-gray-600">
				외주 제안 시 사용할 견적서 템플릿을 미리 만들어두세요.
			</p>
		</div>

		{#if templates.length > 0}
			<!-- 견적서 리스트 -->
			<ul class="divide-y divide-gray-100">
				{#each templates as template}
					<li class="flex items-center justify-between px-4 py-4">
						<a
							href={`/@${me?.handle}/accounts/quote-templates/${template.id}`}
							class="flex flex-1 items-center gap-3"
						>
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"
							>
								<RiFileList2Line size={20} color={colors.primary} />
							</div>
							<div class="flex-1">
								<p class="font-medium text-gray-900">
									{template.title}
								</p>
								<p class="mt-0.5 text-sm text-gray-500">
									{format_date(template.created_at)}
								</p>
							</div>
							<RiArrowRightSLine size={20} color={colors.gray[400]} />
						</a>
						<button
							onclick={() => open_delete_modal(template)}
							class="ml-2 p-2 text-gray-400 active:text-red-500"
						>
							<RiDeleteBinLine size={18} />
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<!-- 빈 상태 -->
			<div class="flex flex-col items-center justify-center px-4 py-16">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
				>
					<RiFileList2Line size={32} color={colors.gray[400]} />
				</div>
				<p class="mt-4 text-center text-gray-500">
					등록된 견적서 템플릿이 없어요
				</p>
				<p class="mt-1 text-center text-sm text-gray-400">
					템플릿을 만들어두면 제안할 때 빠르게 사용할 수 있어요
				</p>
			</div>
		{/if}
	{/if}
</main>

<FixedBottomButton>
	<a href="/regi/quote-template" class="btn btn-primary w-full">
		<RiAddLine size={18} />
		견적 템플릿 추가
	</a>
</FixedBottomButton>

<!-- 삭제 확인 모달 -->
<Modal bind:is_modal_open={show_delete_modal} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			견적서 템플릿을 삭제할까요?
		</p>
		<p class="mt-2 text-sm text-gray-500">삭제하면 복구할 수 없습니다.</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => (show_delete_modal = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={confirm_delete}
				class="flex-1 rounded-lg bg-red-500 py-3 text-[14px] font-medium text-white active:bg-red-600"
			>
				삭제하기
			</button>
		</div>
	</div>
</Modal>
