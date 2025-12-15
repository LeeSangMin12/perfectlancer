<script>
	let { children } = $props();
</script>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-4 py-3.5">
	<div class="pb-safe flex space-x-2">
		{@render children()}
	</div>
</div>
