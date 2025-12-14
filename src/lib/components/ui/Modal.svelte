<script>
	let {
		is_modal_open = $bindable(false),
		modal_position,
		backdrop_opacity = 'bg-black/50',
		disable_backdrop_close = false,
		on_modal_close,
		children
	} = $props();

	const close_modal = () => {
		is_modal_open = false;
		on_modal_close?.();
	};
</script>

{#if is_modal_open}
	{#if modal_position === 'center'}
		<div
			class={`scrollbar-hide fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black px-5 ${backdrop_opacity}`}
		>
			<div
				class="scrollbar-hide relative z-10 max-h-[75vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white"
			>
				{@render children?.()}
			</div>
			{#if !disable_backdrop_close}
				<button
					class="absolute inset-0 h-full w-full cursor-default"
					onclick={close_modal}
					aria-label="모달 닫기 배경"
				></button>
			{/if}
		</div>
	{:else if modal_position === 'bottom'}
		<div
			class={`fixed inset-0 z-50 flex justify-center overflow-auto bg-black ${backdrop_opacity}`}
		>
			<div
				class="scrollbar-hide relative z-10 mt-auto max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl rounded-b-none bg-white"
			>
				{@render children?.()}
			</div>
			{#if !disable_backdrop_close}
				<button
					class="absolute inset-0 h-full w-full cursor-default"
					onclick={close_modal}
					aria-label="모달 닫기 배경"
				></button>
			{/if}
		</div>
	{/if}
{/if}
