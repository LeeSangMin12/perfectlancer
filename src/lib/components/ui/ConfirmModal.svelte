<script>
	import Modal from './Modal.svelte';

	let {
		is_open = $bindable(false),
		title,
		description = '',
		button_1_text = '취소',
		button_2_text = '확인',
		button_1_action,
		button_2_action,
	} = $props();

	const close = () => (is_open = false);
</script>

<Modal bind:is_modal_open={is_open} modal_position="center">
	<div class="p-6">
		<p class="text-lg font-bold text-gray-900">{title}</p>
		{#if description}
			<p class="mt-2 text-sm text-gray-500">{description}</p>
		{/if}
	</div>
	<div class="flex gap-3 px-6 pb-6">
		<button onclick={button_1_action ?? close} class="btn btn-gray flex-1">
			{button_1_text}
		</button>
		<button onclick={button_2_action ?? close} class="btn btn-primary flex-1">
			{button_2_text}
		</button>
	</div>
</Modal>
