<script>
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import Modal from '$lib/components/ui/Modal.svelte';

	let { is_modal_open = $bindable(false) } = $props();

	const go_to_login = () => {
		goto('/login');
		is_modal_open = false;
	};
</script>

<Modal bind:is_modal_open modal_position="center">
	{#if is_modal_open}
		<div in:scale={{ duration: 200, start: 0.95 }} out:fade={{ duration: 150 }}>
			<div class="flex flex-col gap-2 p-6">
				<p class="text-lg font-bold">로그인이 필요합니다</p>
				<p class="text-sm text-gray-500">로그인 후 이용할 수 있습니다.</p>
			</div>

			<div class="flex gap-3 px-6 pb-6">
				<button
					onclick={() => (is_modal_open = false)}
					class="btn flex-1 rounded-lg"
				>
					취소
				</button>
				<button onclick={go_to_login} class="btn btn-primary flex-1 rounded-lg">
					로그인
				</button>
			</div>
		</div>
	{/if}
</Modal>
