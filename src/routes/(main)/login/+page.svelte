<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_WEB_CLIENT_URL } from '$env/static/public';
	import colors from '$lib/config/colors';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import perfect_lancer_logo from '$lib/img/perfect_lancer_logo/android/mipmap-xxxhdpi/ic_launcher.png';
	import { show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiKakaoTalkFill,
		RiMailLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	const api = get_api_context();

	let is_email_login = $state(false);
	let email_login_id = $state('');
	let email_login_pw = $state('');
	let email_login_error = $state('');
	let is_email_loading = $state(false);

	let { data } = $props();
	let { supabase, session } = $state(data);

	// URL에서 에러 파라미터 확인 (OAuth 중복 이메일 에러)
	$effect(() => {
		const error_type = $page.url.searchParams.get('error');
		const provider = $page.url.searchParams.get('provider');

		if (error_type === 'duplicate_email' && provider) {
			const provider_name = api.auth.get_provider_name(provider);
			show_toast('error', `이미 ${provider_name}로 가입된 이메일입니다`);
		}
	});

	const sign_in_with_kakao = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'kakao',
			options: {
				redirectTo: `${PUBLIC_WEB_CLIENT_URL}/auth/callback`,
			},
		});
	};

	const sign_in_with_google = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${PUBLIC_WEB_CLIENT_URL}/auth/callback`,
			},
		});
	};

	const email_login = async () => {
		if (!email_login_id || !email_login_pw) {
			email_login_error = '이메일과 비밀번호를 입력해주세요';
			return;
		}

		is_email_loading = true;
		email_login_error = '';

		try {
			// 이메일로 가입된 provider 확인
			const { exists, provider } = await api.auth.check_email_provider(email_login_id);

			if (exists && provider !== 'email') {
				// 다른 provider로 가입된 경우
				const provider_name = api.auth.get_provider_name(provider);
				email_login_error = `이미 ${provider_name}로 가입된 이메일입니다`;
				is_email_loading = false;
				return;
			}

			// 이메일 로그인 시도
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email_login_id,
				password: email_login_pw,
			});

			if (error) {
				if (error.message.includes('Invalid login credentials')) {
					email_login_error = '이메일 또는 비밀번호가 올바르지 않습니다';
				} else if (error.message.includes('Email not confirmed')) {
					email_login_error = '이메일 인증이 필요합니다. 메일함을 확인해주세요';
				} else {
					email_login_error = error.message;
				}
				is_email_loading = false;
				return;
			}

			// 프로필 완성 여부 확인
			if (data?.user?.id) {
				const profile = await api.users.select(data.user.id);

				if (!profile || !profile.handle) {
					// 미완성 프로필 → 회원가입 페이지로 이동
					show_toast('info', '회원가입을 완료해주세요');
					location.href = '/sign-up/email';
					return;
				}
			}

			show_toast('success', '로그인 완료');
			location.href = '/';
		} catch (err) {
			console.error('Email login error:', err);
			email_login_error = '로그인 중 오류가 발생했습니다';
		} finally {
			is_email_loading = false;
		}
	};

	const open_email_login_modal = () => {
		email_login_id = '';
		email_login_pw = '';
		email_login_error = '';
		is_email_login = true;
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

				<!-- 구글 로그인 -->
				<button
					id="google_login_for_ga4"
					onclick={sign_in_with_google}
					class="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:translate-y-0"
				>
					<svg width="20" height="20" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					<span>Google로 시작하기</span>
				</button>

				<!-- 구분선 -->
				<div class="flex items-center gap-3 py-2">
					<div class="h-px flex-1 bg-slate-200"></div>
					<span class="text-xs text-slate-400">또는</span>
					<div class="h-px flex-1 bg-slate-200"></div>
				</div>

				<!-- 이메일 로그인 -->
				<button
					onclick={open_email_login_modal}
					class="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
				>
					<RiMailLine size={18} color={colors.gray[500]} />
					<span>이메일로 시작하기</span>
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

<!-- 이메일 로그인 모달 -->
<Modal bind:is_modal_open={is_email_login} modal_position="bottom">
	<div class="p-5 px-6">
		<div class="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200" />

		<h3 class="mb-6 text-center text-xl font-bold text-slate-800">
			이메일 로그인
		</h3>

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<label for="email-id" class="text-sm font-medium text-slate-600"
					>이메일</label
				>
				<input
					id="email-id"
					type="email"
					bind:value={email_login_id}
					placeholder="이메일을 입력하세요"
					class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label for="email-pw" class="text-sm font-medium text-slate-600"
					>비밀번호</label
				>
				<input
					id="email-pw"
					type="password"
					bind:value={email_login_pw}
					placeholder="비밀번호를 입력하세요"
					onkeydown={(e) => e.key === 'Enter' && email_login()}
					class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
				/>
			</div>

			{#if email_login_error}
				<p class="text-sm text-red-500">{email_login_error}</p>
			{/if}

			<div class="pb-safe mt-2 flex flex-col gap-3">
				<button
					class="h-[52px] w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-base font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
					onclick={email_login}
					disabled={is_email_loading}
				>
					{is_email_loading ? '로그인 중...' : '로그인'}
				</button>

				<div class="flex items-center justify-between text-sm">
					<a
						href="/sign-up/email"
						class="text-slate-500 hover:text-blue-500 transition-colors"
						onclick={() => (is_email_login = false)}
					>
						회원가입
					</a>
					<a
						href="/forgot-password"
						class="text-slate-500 hover:text-blue-500 transition-colors"
						onclick={() => (is_email_login = false)}
					>
						비밀번호 찾기
					</a>
				</div>
			</div>
		</div>
	</div>
</Modal>
