<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Post from '$lib/components/domain/post/Post.svelte';
	import WorkRequestCard from '$lib/components/domain/outsourcing/WorkRequestCard.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { post_bookmarks, work_request_bookmarks } = $state(data);

	// URL 파라미터로 탭 결정
	let is_work_request_tab = $derived.by(() => {
		return $page.url.searchParams.get('tab') === 'work_request';
	});
	let page_title = $derived(is_work_request_tab ? '외주 북마크' : '게시글 북마크');

	// 메인 페이지에서는 댓글 시스템이 없으므로 gift 댓글 추가 이벤트를 단순히 처리
	const handle_gift_comment_added = async ({ gift_content, gift_amount, parent_comment_id, post_id }) => {
		await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_amount,
		});
	};

	// Post 이벤트 핸들러 (composable 사용 - 북마크 구조에 맞게 변환)
	const { handle_bookmark_changed: handle_bookmark_changed_base, handle_vote_changed: handle_vote_changed_base } = create_post_handlers(
		() => post_bookmarks.map(b => b.post).filter(Boolean),
		(updated_posts) => {
			post_bookmarks = post_bookmarks.map(b => {
				const updated_post = updated_posts.find(p => p.id === b.post?.id);
				return updated_post ? { ...b, post: updated_post } : b;
			});
		},
		me
	);

	const handle_post_bookmark_changed = handle_bookmark_changed_base;
	const handle_vote_changed = handle_vote_changed_base;

	// 외주 북마크 변경 핸들러
	const handle_work_request_bookmark_changed = (event) => {
		if (event.action === 'remove') {
			work_request_bookmarks = work_request_bookmarks.filter(
				b => b.work_request_id !== event.work_request_id
			);
		}
	};
</script>

<svelte:head>
	<title>{page_title} | 문</title>
	<meta
		name="description"
		content="내가 북마크한 게시물과 외주 공고를 한눈에 확인하고, 관심 있는 콘텐츠를 쉽게 관리"
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={() => goto(`/@${me.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{page_title}</h1>
	{/snippet}
</Header>

<main class="mt-4">
	{#if !is_work_request_tab}
		<!-- 게시물 북마크 -->
		{#if post_bookmarks.length === 0}
			<div class="py-12 text-center">
				<p class="text-gray-500">북마크한 게시물이 없습니다.</p>
			</div>
		{:else}
			{#each post_bookmarks as bookmark (bookmark.id)}
				{#if bookmark.post}
					<div class="mt-4">
						<Post
							post={bookmark.post}
							on_gift_comment_added={handle_gift_comment_added}
							on_bookmark_changed={handle_post_bookmark_changed}
							on_vote_changed={handle_vote_changed}
						/>
					</div>
				{/if}
			{/each}
		{/if}
	{:else}
		<!-- 외주 북마크 -->
		<div class="px-4">
			{#if work_request_bookmarks.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">북마크한 외주 공고가 없습니다.</p>
				</div>
			{:else}
				{#each work_request_bookmarks as bookmark (bookmark.id)}
					{#if bookmark.work_request}
						<WorkRequestCard
							request={bookmark.work_request}
							is_bookmarked={true}
							on_bookmark_changed={handle_work_request_bookmark_changed}
						/>
					{/if}
				{/each}
			{/if}
		</div>
	{/if}
</main>
