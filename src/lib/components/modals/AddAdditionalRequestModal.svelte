<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { RiCloseLine, RiImageAddLine } from 'svelte-remixicon';

	import Modal from '$lib/components/ui/Modal.svelte';

	const api = get_api_context();

	let {
		is_open = $bindable(false),
		work_request_id,
		user_id,
		on_success,
	} = $props();

	let content = $state('');
	let images = $state([]);
	let is_submitting = $state(false);

	const MAX_CONTENT_LENGTH = 200;
	const MAX_IMAGES = 5;

	const is_valid = $derived(content.trim().length > 0);

	// 이미지 추가
	const handle_image_change = (event) => {
		const files = event.target.files;
		if (!files) return;

		const remaining_slots = MAX_IMAGES - images.length;
		const files_to_add = Array.from(files).slice(0, remaining_slots);

		for (const file of files_to_add) {
			if (file.type.startsWith('image/')) {
				file.preview_url = URL.createObjectURL(file);
				images = [...images, file];
			}
		}

		// input 초기화
		event.target.value = '';
	};

	// 이미지 제거
	const remove_image = (index) => {
		URL.revokeObjectURL(images[index].preview_url);
		images = images.filter((_, i) => i !== index);
	};

	// 이미지 업로드
	const upload_images = async () => {
		if (images.length === 0) return [];

		const uploaded_urls = await Promise.all(
			images.map(async (file, i) => {
				const file_ext = file.name.split('.').pop();
				const file_path = `${work_request_id}/additional/${Date.now()}-${i}.${file_ext}`;

				await api.work_request_images.upload(file_path, file);
				return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/work_requests/images/${file_path}`;
			}),
		);

		return uploaded_urls;
	};

	// 제출
	const handle_submit = async () => {
		if (!is_valid || is_submitting) return;

		is_submitting = true;
		try {
			// 이미지 업로드
			const uploaded_image_urls = await upload_images();

			// 요청사항 추가
			await api.work_requests.add_additional_request(
				work_request_id,
				{
					content: content.trim(),
					images: uploaded_image_urls,
				},
				user_id,
			);

			show_toast('success', '요청사항이 추가되었습니다.');
			handle_close();
			on_success?.();
		} catch (error) {
			console.error('Add additional request error:', error);
			show_toast('error', error.message || '요청사항 추가에 실패했습니다.');
		} finally {
			is_submitting = false;
		}
	};

	// 닫기
	const handle_close = () => {
		// 미리보기 URL 정리
		images.forEach((img) => URL.revokeObjectURL(img.preview_url));

		// 상태 초기화
		content = '';
		images = [];
		is_open = false;
	};
</script>

<Modal
	bind:is_modal_open={is_open}
	modal_position="bottom"
	on_modal_close={handle_close}
>
	<div class="p-5">
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">요청사항 추가</h2>
			<button onclick={handle_close} class="p-1">
				<RiCloseLine size={24} class="text-gray-500" />
			</button>
		</div>

		<!-- 이미지 첨부 -->
		<div class="mb-6">
			<p class="mb-2 text-sm font-medium text-gray-700">사진 첨부</p>
			<div class="flex flex-wrap gap-2">
				<!-- 업로드 버튼 -->
				{#if images.length < MAX_IMAGES}
					<label
						class="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
					>
						<input
							type="file"
							accept="image/*"
							multiple
							onchange={handle_image_change}
							class="hidden"
						/>
						<RiImageAddLine size={24} class="text-gray-400" />
						<span class="mt-1 text-xs text-gray-500">
							{images.length}/{MAX_IMAGES}
						</span>
					</label>
				{/if}

				<!-- 미리보기 -->
				{#each images as image, index (image.preview_url)}
					<div class="relative h-20 w-20">
						<img
							src={image.preview_url}
							alt="첨부 이미지 {index + 1}"
							class="h-full w-full rounded-lg object-cover"
						/>
						<button
							type="button"
							onclick={() => remove_image(index)}
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white"
						>
							<RiCloseLine size={14} />
						</button>
					</div>
				{/each}
			</div>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handle_submit();
			}}
		>
			<!-- 내용 입력 -->
			<div class="mb-4">
				<label
					for="additional-request-content"
					class="mb-2 block text-sm font-medium text-gray-700"
				>
					추가 요청사항
				</label>
				<textarea
					id="additional-request-content"
					bind:value={content}
					placeholder="추가 요청사항을 작성해 주세요."
					class="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
					rows="5"
					maxlength={MAX_CONTENT_LENGTH}
				></textarea>
				<p class="mt-1 text-right text-xs text-gray-500">
					<span
						class={content.length >= MAX_CONTENT_LENGTH ? 'text-red-500' : ''}
					>
						{content.length}
					</span>
					/{MAX_CONTENT_LENGTH}자
				</p>
			</div>

			<!-- 버튼 -->
			<button
				type="submit"
				disabled={!is_valid || is_submitting}
				class="btn btn-primary w-full"
			>
				{#if is_submitting}
					저장 중...
				{:else}
					저장하기
				{/if}
			</button>
		</form>
	</div>
</Modal>
