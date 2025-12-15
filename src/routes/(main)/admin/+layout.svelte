<script>
	let { children } = $props();
</script>

<!-- admin 페이지는 전체 너비 사용 -->
<div class="admin-full-width">
	{@render children()}
</div>

<style>
	.admin-full-width {
		width: 100vw;
		position: relative;
		left: 50%;
		right: 50%;
		margin-left: -50vw;
		margin-right: -50vw;
	}
</style>
