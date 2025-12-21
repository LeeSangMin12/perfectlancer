<script>
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { RiStarFill, RiStarLine } from 'svelte-remixicon';

	import Modal from '$lib/components/ui/Modal.svelte';

	let {
		is_open = $bindable(false),
		proposal,
		work_request,
		reviewer_id,
		on_success,
	} = $props();

	const api = get_api_context();

	let rating = $state(5);
	let content = $state('');
	let is_submitting = $state(false);

	const close = () => {
		is_open = false;
		// 모달 닫힐 때 초기화
		rating = 5;
		content = '';
	};

	const set_rating = (value) => {
		rating = value;
	};

	const handle_submit = async () => {
		if (is_submitting) return;
		if (rating < 1 || rating > 5) {
			show_toast('error', '별점을 선택해주세요.');
			return;
		}

		is_submitting = true;

		try {
			const review = await api.work_request_reviews.insert({
				work_request_id: work_request.id,
				proposal_id: proposal.id,
				reviewer_id: reviewer_id,
				expert_id: proposal.expert_id,
				rating,
				content: content.trim() || null,
			});

			show_toast('success', '리뷰가 등록되었습니다.');
			close();
			on_success?.(review);
		} catch (error) {
			console.error('Review submit error:', error);
			show_toast('error', error.message || '리뷰 등록에 실패했습니다.');
		} finally {
			is_submitting = false;
		}
	};

	const expert_name = $derived(
		proposal?.users?.name || proposal?.users?.handle || '전문가',
	);
</script>

<Modal bind:is_modal_open={is_open} modal_position="center">
	<div class="p-6">
		<h2 class="text-lg font-bold text-gray-900">리뷰 작성</h2>
		<p class="mt-1 text-sm text-gray-500">
			{expert_name}님과의 작업은 어떠셨나요?
		</p>

		<!-- 별점 선택 -->
		<div class="mt-6">
			<p class="mb-2 text-sm font-medium text-gray-700">별점</p>
			<div class="flex">
				{#each [1, 2, 3, 4, 5] as star (star)}
					<button
						type="button"
						onclick={() => set_rating(star)}
						class="p-1 transition hover:scale-110"
					>
						{#if star <= rating}
							<RiStarFill size={28} class="text-primary" />
						{:else}
							<RiStarLine size={28} class="text-gray-300" />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- 리뷰 내용 -->
		<div class="mt-4">
			<p class="mb-2 text-sm font-medium text-gray-700">리뷰 내용 (선택)</p>
			<textarea
				bind:value={content}
				placeholder="작업에 대한 후기를 남겨주세요."
				rows="4"
				class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
			></textarea>
		</div>
	</div>

	<div class="flex gap-3 px-6 pb-6">
		<button
			onclick={close}
			class="btn btn-gray flex-1"
			disabled={is_submitting}
		>
			취소
		</button>
		<button
			onclick={handle_submit}
			class="btn btn-primary flex-1"
			disabled={is_submitting}
		>
			{#if is_submitting}
				등록 중...
			{:else}
				리뷰 등록
			{/if}
		</button>
	</div>
</Modal>
