<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { RiArrowLeftSLine, RiArrowRightSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	const me = get_user_context();

	const TITLE = '회원 정보 설정';

	let { data } = $props();
	let { supabase } = $derived(data);

	let logout_modal = $state(false);

	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		location.href = '/';
	};
</script>

<svelte:head>
	<title>회원 정보 설정 | 퍼펙트랜서</title>
	<meta name="description" content="회원 정보 설정 페이지입니다." />
</svelte:head>

<Header>
	{#snippet left()}
		<a class="flex items-center" href={`/@${me?.handle}/accounts`}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</a>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{TITLE}</h1>
	{/snippet}
</Header>

<main>
	<div class="mx-5 mt-5 flex flex-col gap-[30px]">
		<a
			href={`/@${me?.handle}/accounts/profile/modify`}
			class="flex items-center justify-between"
		>
			<span>프로필 정보 수정</span>
			<svg
				width="7"
				height="13"
				viewBox="0 0 7 13"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.998535 11.1914L5.99853 6.19141L0.998535 1.19141"
					stroke="#909090"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
		<button
			class="flex items-center justify-between"
			onclick={() => (logout_modal = true)}
		>
			<span>로그아웃</span>
			<svg
				width="7"
				height="13"
				viewBox="0 0 7 13"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.998535 11.1914L5.99853 6.19141L0.998535 1.19141"
					stroke="#909090"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>
</main>

<Modal bind:is_modal_open={logout_modal} modal_position="center">
	<div in:scale={{ duration: 200, start: 0.95 }} out:fade={{ duration: 150 }}>
		<div class="flex flex-col gap-2 p-6">
			<p class="text-lg font-bold">로그아웃 하시겠어요?</p>
		</div>

		<div class="flex gap-3 px-6 pb-6">
			<button
				onclick={() => (logout_modal = false)}
				class="btn btn-gray flex-1"
			>
				취소
			</button>
			<button onclick={logout} class="btn btn-gray !text-error flex-1">
				로그아웃 하기
			</button>
		</div>
	</div>
</Modal>
