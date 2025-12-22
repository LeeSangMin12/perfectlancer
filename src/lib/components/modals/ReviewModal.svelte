<script>
	import Modal from '$lib/components/ui/Modal.svelte';
	import StarRating from '$lib/components/ui/StarRating.svelte';

	/**
	 * @typedef {Object} ReviewFormData
	 * @property {number} rating - 별점 (1-5)
	 * @property {string} title - 리뷰 제목
	 * @property {string} content - 리뷰 내용
	 */

	let {
		is_open = $bindable(false),
		is_editing = false,
		is_submitting = false,
		form_data = $bindable({ rating: 0, title: '', content: '' }),
		on_submit,
		on_close,
		modal_position = 'center',
		max_content_length = 1000,
	} = $props();

	const is_form_valid = $derived(
		form_data.rating > 0 &&
			form_data.title.trim().length > 0 &&
			form_data.content.trim().length > 0
	);

	const handle_submit = () => {
		if (!is_form_valid || is_submitting) return;
		on_submit?.();
	};

	const handle_close = () => {
		is_open = false;
		on_close?.();
	};
</script>

<Modal bind:is_modal_open={is_open} {modal_position} on_modal_close={handle_close}>
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			{is_editing ? '리뷰 수정' : '리뷰 작성'}
		</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handle_submit();
			}}
			class="mt-5 space-y-4"
		>
			<!-- 별점 -->
			<div>
				<p class="mb-2 text-[14px] font-medium text-gray-700">
					별점 <span class="text-red-500">*</span>
				</p>
				<StarRating bind:rating={form_data.rating} size={24} show_rating_text={true} />
			</div>

			<!-- 리뷰 제목 -->
			<div>
				<p class="mb-2 text-[14px] font-medium text-gray-700">
					리뷰 제목 <span class="text-red-500">*</span>
				</p>
				<input
					bind:value={form_data.title}
					type="text"
					placeholder="리뷰 제목을 입력해주세요"
					class="w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
					maxlength="100"
					required
				/>
			</div>

			<!-- 리뷰 내용 -->
			<div>
				<p class="mb-2 text-[14px] font-medium text-gray-700">
					리뷰 내용 <span class="text-red-500">*</span>
				</p>
				<textarea
					bind:value={form_data.content}
					placeholder="서비스에 대한 자세한 리뷰를 작성해주세요"
					class="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
					rows="4"
					maxlength={max_content_length}
					required
				></textarea>
				<p class="mt-1 text-xs text-gray-500">
					{form_data.content.length} / {max_content_length}자
				</p>
			</div>

			<!-- 버튼 -->
			<div class="mt-5 flex gap-2">
				<button
					type="button"
					onclick={handle_close}
					class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={is_submitting || !is_form_valid}
					class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
				>
					{#if is_submitting}
						<span class="flex items-center justify-center">
							<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{is_editing ? '수정 중...' : '작성 중...'}
						</span>
					{:else}
						{is_editing ? '수정하기' : '작성하기'}
					{/if}
				</button>
			</div>
		</form>
	</div>
</Modal>
