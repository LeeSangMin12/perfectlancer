<script>
	import colors from '$lib/config/colors';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine, RiMailSendLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';

	const api = get_api_context();

	let { data } = $props();
	let { supabase } = $derived(data);

	let email = $state('');
	let email_error = $state('');
	let is_loading = $state(false);
	let is_sent = $state(false);

	/**
	 * 이메일 유효성 검사 및 provider 확인
	 */
	const validate_email = async () => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			email_error = '이메일을 입력해주세요';
			return false;
		}

		if (!regex.test(email)) {
			email_error = '올바른 이메일 주소를 입력해주세요';
			return false;
		}

		// provider 확인 - email로 가입한 경우만 비밀번호 재설정 가능
		const { exists, provider } = await api.auth.check_email_provider(email);

		if (!exists) {
			email_error = '가입되지 않은 이메일입니다';
			return false;
		}

		if (provider !== 'email') {
			const provider_name = api.auth.get_provider_name(provider);
			email_error = `${provider_name}로 가입된 이메일입니다. ${provider_name} 로그인을 이용해주세요`;
			return false;
		}

		email_error = '';
		return true;
	};

	/**
	 * 비밀번호 재설정 이메일 발송 (Magic Link 방식)
	 */
	const send_reset_email = async () => {
		is_loading = true;

		try {
			const is_valid = await validate_email();
			if (!is_valid) {
				is_loading = false;
				return;
			}

			// Magic Link로 이메일 전송 - auth/callback을 통해 처리
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
				},
			});

			if (error) {
				throw error;
			}

			is_sent = true;
			show_toast('success', '비밀번호 재설정 링크가 발송되었습니다');
		} catch (err) {
			console.error('Reset email error:', err);
			show_toast('error', '이메일 발송에 실패했습니다');
		} finally {
			is_loading = false;
		}
	};
</script>

<svelte:head>
	<title>비밀번호 찾기 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="퍼펙트랜서 비밀번호를 잊으셨나요? 이메일을 통해 비밀번호를 재설정하세요."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button
			onclick={smart_go_back}
			class="rounded-lg p-1 transition-colors hover:bg-slate-100"
		>
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">비밀번호 찾기</h1>
	{/snippet}
</Header>

<main class="px-4 py-8">
	{#if is_sent}
		<!-- 이메일 발송 완료 -->
		<div class="flex flex-col items-center justify-center py-16">
			<div
				class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100"
			>
				<RiMailSendLine size={40} color="#3B82F6" />
			</div>

			<h2 class="mb-2 text-xl font-bold text-slate-800">이메일을 확인해주세요</h2>

			<p class="mb-6 text-center text-slate-500">
				<span class="font-medium text-slate-700">{email}</span>으로<br />
				비밀번호 재설정 링크를 발송했습니다
			</p>

			<div class="w-full rounded-xl bg-slate-50 p-4">
				<p class="text-sm text-slate-600">
					이메일이 도착하지 않았나요?
				</p>
				<ul class="mt-2 list-disc pl-5 text-sm text-slate-500">
					<li>스팸 메일함을 확인해주세요</li>
					<li>이메일 주소가 정확한지 확인해주세요</li>
				</ul>
			</div>

			<button
				onclick={() => (is_sent = false)}
				class="mt-6 text-sm text-blue-500 hover:text-blue-600"
			>
				다른 이메일로 다시 시도
			</button>
		</div>
	{:else}
		<!-- 이메일 입력 폼 -->
		<div class="mb-8">
			<h2 class="text-xl font-bold text-slate-800">비밀번호를 잊으셨나요?</h2>
			<p class="mt-2 text-slate-500">
				가입할 때 사용한 이메일 주소를 입력해주세요.<br />
				비밀번호 재설정 링크를 보내드립니다.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<label for="email" class="font-semibold text-slate-700">이메일</label>
			<input
				id="email"
				type="email"
				placeholder="example@email.com"
				bind:value={email}
				oninput={() => (email_error = '')}
				onkeydown={(e) => e.key === 'Enter' && send_reset_email()}
				class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none {email_error
					? 'border-red-500'
					: ''}"
			/>
			{#if email_error}
				<p class="text-sm text-red-500">{email_error}</p>
			{/if}
		</div>
	{/if}
</main>

{#if !is_sent}
	<FixedBottomButton>
		<button
			onclick={send_reset_email}
			class="btn btn-primary w-full"
			disabled={is_loading || !email}
		>
			{is_loading ? '발송 중...' : '비밀번호 재설정 이메일 받기'}
		</button>
	</FixedBottomButton>
{/if}
