<script>
	import Modal from '$lib/components/ui/Modal.svelte';
	import { RiCloseLine } from 'svelte-remixicon';
	import colors from '$lib/config/colors';

	let {
		is_open = $bindable(false),
		form_data = $bindable({ message: '', proposed_amount: '' }),
		attached_files = $bindable([]),
		is_submitting = false,
		on_submit,
		on_file_select,
		on_file_remove,
	} = $props();

	let file_input = $state(null);

	// 파일 크기 포맷
	const format_file_size = (bytes) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	};

	const handle_file_change = (e) => {
		on_file_select?.(e);
		// 같은 파일을 다시 선택할 수 있도록 초기화
		if (file_input) {
			file_input.value = '';
		}
	};

	const handle_submit = (e) => {
		e.preventDefault();
		on_submit?.();
	};

	const handle_close = () => {
		is_open = false;
	};
</script>

<Modal is_modal_open={is_open} modal_position="bottom" on_modal_close={handle_close}>
	<div class="p-6">
		<div class="mb-6">
			<h3 class="text-lg font-bold text-gray-900">제안서 작성</h3>
		</div>

		<form onsubmit={handle_submit}>
			<div class="space-y-4">
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						제안 메시지 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={form_data.message}
						placeholder="프로젝트에 대한 이해도와 작업 계획을 설명해주세요."
						class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
						rows="6"
						required
					></textarea>
				</div>

				<!-- 총 제안 금액 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						총 제안 금액 <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<span class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
							>₩</span
						>
						<input
							type="text"
							bind:value={form_data.proposed_amount}
							placeholder="0"
							class="w-full rounded-lg border border-gray-200 p-3 pl-8 text-sm focus:outline-none"
							required
							oninput={(e) => {
								// 숫자만 입력 가능하도록
								e.target.value = e.target.value.replace(/[^0-9]/g, '');
								form_data.proposed_amount = e.target.value;
							}}
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						이 프로젝트를 진행하는 총 금액을 입력해주세요.
					</p>
				</div>

				<!-- 파일 첨부 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						이력서/포트폴리오 첨부
					</label>
					<input
						type="file"
						bind:this={file_input}
						onchange={handle_file_change}
						multiple
						accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
						class="hidden"
					/>
					<button
						type="button"
						onclick={() => file_input?.click()}
						class="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100"
						aria-label="파일 선택하기"
					>
						📎 파일 선택 (최대 5개, 각 10MB 이하)
					</button>
					<p class="mt-1 text-xs text-gray-500">
						PDF, Word, 이미지 파일을 첨부할 수 있습니다.
					</p>

					<!-- 첨부된 파일 목록 -->
					{#if attached_files.length > 0}
						<div class="mt-3 space-y-2">
							{#each attached_files as file, index}
								<div
									class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
								>
									<div class="flex min-w-0 flex-1 items-center gap-2">
										<span class="text-lg">📄</span>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium text-gray-700">
												{file.name}
											</p>
											<p class="text-xs text-gray-500">
												{format_file_size(file.size)}
											</p>
										</div>
									</div>
									<button
										type="button"
										onclick={() => on_file_remove?.(index)}
										class="ml-2 text-gray-400 hover:text-red-600"
										aria-label="{file.name} 파일 제거"
									>
										<svg
											class="h-5 w-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					type="button"
					onclick={handle_close}
					class="btn btn-gray flex-1 rounded-lg py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={is_submitting}
					class="btn btn-primary flex-1 rounded-lg py-3 font-medium disabled:opacity-50"
				>
					{is_submitting ? '제출 중...' : '제안하기'}
				</button>
			</div>
		</form>
	</div>
</Modal>
