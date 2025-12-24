<script>
	import { PUBLIC_WEB_CLIENT_URL } from '$env/static/public';
	import colors from '$lib/config/colors';
	import perfect_lancer_logo from '$lib/img/perfect_lancer_logo/android/mipmap-xxxhdpi/ic_launcher.png';
	import { show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiBriefcaseLine,
		RiKakaoTalkFill,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let is_corporation_login = $state(false);
	let corporation_login_id = $state('');
	let corporation_login_pw = $state('');

	let { data } = $props();
	let { supabase, session } = $state(data);

	const sign_in_with_kakao = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'kakao',
			options: {
				redirectTo: `${PUBLIC_WEB_CLIENT_URL}/auth/callback`,
			},
		});
	};

	const corporation_login = async () => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: corporation_login_id,
			password: corporation_login_pw,
		});

		if (error) {
			show_toast('error', error.message);
			return;
		}

		show_toast('success', '로그인 완료');
		location.href = '/';
	};
</script>

<svelte:head>
	<title>로그인 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="퍼펙트랜서에 로그인하고 전문가들과 소통하세요. 외주, 사이드잡, 풀타임 매칭까지 모든 것을 퍼펙트랜서에서 경험하세요."
	/>
</svelte:head>

<div class="min-h-dvh to-white">
	<Header>
		{#snippet left()}
			<button
				onclick={smart_go_back}
				class="rounded-lg p-1 transition-colors hover:bg-slate-100"
			>
				<RiArrowLeftSLine size={28} color={colors.gray[600]} />
			</button>
		{/snippet}
	</Header>

	<main class="flex min-h-[calc(100dvh-56px)] flex-col justify-between px-6">
		<!-- 브랜딩 영역 -->
		<div class="flex flex-1 flex-col items-center justify-center pt-8">
			<!-- 로고 아이콘 -->
			<img
				src={perfect_lancer_logo}
				alt="퍼펙트랜서"
				class="mb-8 h-[72px] w-[72px] rounded-[20px] shadow-lg shadow-blue-500/30"
			/>

			<!-- 태그라인 -->
			<div class="mb-4 text-center">
				<p class="mb-2 text-[15px] font-medium text-slate-500">
					일이 필요한 모든 순간
				</p>
				<h1 class="text-[26px] leading-tight font-bold text-slate-800">
					전문가의 기준,
					<span class="text-blue-500">퍼펙트랜서</span>
				</h1>
			</div>

			<p class="text-sm text-slate-400">
				외주부터 채용까지, 검증된 전문가와 함께하세요
			</p>
		</div>

		<!-- 로그인 버튼 영역 -->
		<div class="pb-safe pb-10">
			<div class="mb-5 flex flex-col gap-3">
				<!-- 카카오 로그인 -->
				<button
					id="kakao_login_for_ga4"
					onclick={sign_in_with_kakao}
					class="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[15px] font-semibold text-[#191919] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#FDD800] hover:shadow-md active:translate-y-0"
				>
					<RiKakaoTalkFill size={20} color="#191919" />
					<span>카카오로 시작하기</span>
				</button>

				<!-- 기업 로그인 -->
				<button
					class="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
					onclick={() => (is_corporation_login = true)}
				>
					<RiBriefcaseLine size={18} color={colors.gray[500]} />
					<span>기업 회원 로그인</span>
				</button>
			</div>

			<p class="text-center text-xs leading-relaxed text-slate-400">
				로그인 시 <a
					href="/terms"
					class="text-slate-500 underline underline-offset-2 hover:text-blue-500"
					>이용약관</a
				>
				및
				<a
					href="/privacy"
					class="text-slate-500 underline underline-offset-2 hover:text-blue-500"
					>개인정보처리방침</a
				>에 동의합니다
			</p>
		</div>
	</main>
</div>

<Modal bind:is_modal_open={is_corporation_login} modal_position="bottom">
	<div class="p-5 px-6">
		<div class="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200" />

		<h3 class="mb-6 text-center text-xl font-bold text-slate-800">
			기업 로그인
		</h3>

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<label for="corp-id" class="text-sm font-medium text-slate-600"
					>아이디</label
				>
				<input
					id="corp-id"
					type="text"
					bind:value={corporation_login_id}
					placeholder="이메일을 입력하세요"
					class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label for="corp-pw" class="text-sm font-medium text-slate-600"
					>비밀번호</label
				>
				<input
					id="corp-pw"
					type="password"
					bind:value={corporation_login_pw}
					placeholder="비밀번호를 입력하세요"
					class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
				/>
			</div>

			<div class="pb-safe mt-2">
				<button
					class="h-[52px] w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0"
					onclick={corporation_login}
				>
					로그인
				</button>
			</div>
		</div>
	</div>
</Modal>
