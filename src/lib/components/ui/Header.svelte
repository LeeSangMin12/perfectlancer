<script>
	let { nav_class = '', left, center, right } = $props();
</script>

<header class="sticky top-0 z-50 bg-white whitespace-nowrap {nav_class} ">
	<nav class="pt-safe">
		<nav class="z-10 flex h-[56px] w-full items-center justify-between">
			<div class="flex flex-1 items-center pl-4">
				{@render left?.()}
			</div>

			<div class="flex flex-1 justify-center whitespace-nowrap">
				{@render center?.()}
			</div>

			<div class="flex flex-1 items-center justify-end pr-4">
				{@render right?.()}
			</div>
		</nav>
	</nav>
</header>
