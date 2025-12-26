<script>
	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine, RiCheckLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';

	let { data } = $props();
	let { supabase } = $derived(data);

	let password = $state('');
	let password_confirm = $state('');
	let password_error = $state('');
	let is_loading = $state(false);
	let is_success = $state(false);
	let is_ready = $state(false); // 세션 준비 상태
	let is_initializing = $state(true); // 초기화 중

	/**
	 * 페이지 로드 시 세션 확인
	 * auth/callback에서 코드 교환 후 리다이렉트되므로 세션이 이미 있어야 함
	 */
	onMount(async () => {
		const { data: session_data } = await supabase.auth.getSession();

		if (!session_data?.session) {
			show_toast('error', '로그인이 필요합니다. 다시 시도해주세요.');
			goto('/forgot-password');
			return;
		}

		is_ready = true;
		is_initializing = false;
	});

	/**
	 * 비밀번호 유효성 검사
	 */
	const validate_password = () => {
		if (!password) {
			password_error = '새 비밀번호를 입력해주세요';
			return false;
		}

		if (password !== password_confirm) {
			password_error = '비밀번호가 일치하지 않습니다';
			return false;
		}

		password_error = '';
		return true;
	};

	/**
	 * 비밀번호 업데이트
	 */
	const update_password = async () => {
		if (!validate_password()) return;

		is_loading = true;

		try {
			const { error } = await supabase.auth.updateUser({
				password: password,
			});

			if (error) {
				if (error.message.includes('same as your old password')) {
					password_error = '기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요';
					show_toast('error', '기존 비밀번호와 동일합니다');
				} else {
					throw error;
				}
				is_loading = false;
				return;
			}

			is_success = true;
			show_toast('success', '비밀번호가 변경되었습니다');
		} catch (err) {
			console.error('Password update error:', err);
			show_toast('error', '비밀번호 변경에 실패했습니다');
		} finally {
			is_loading = false;
		}
	};

	/**
	 * 비밀번호 입력 시 에러 초기화
	 */
	const handle_input = () => {
		if (password_error) {
			password_error = '';
		}
	};

	// 비밀번호 일치 체크
	const passwords_match = $derived(password && password === password_confirm);

	/**
	 * 버튼 비활성화 여부
	 */
	const is_disabled = $derived(
		is_loading || !password || !password_confirm || password !== password_confirm,
	);
</script>

<svelte:head>
	<title>비밀번호 재설정 | 퍼펙트랜서</title>
	<meta name="description" content="새로운 비밀번호를 설정하세요." />
</svelte:head>

<Header>
	{#snippet left()}
		<button
			onclick={() => goto('/login')}
			class="rounded-lg p-1 transition-colors hover:bg-slate-100"
		>
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">비밀번호 재설정</h1>
	{/snippet}
</Header>

<main class="px-4 py-8">
	{#if is_initializing}
		<!-- 초기화 중 -->
		<div class="flex flex-col items-center justify-center py-16">
			<span class="loading loading-spinner loading-lg text-primary"></span>
			<p class="mt-4 text-slate-500">잠시만 기다려주세요...</p>
		</div>
	{:else if is_success}
		<!-- 비밀번호 변경 완료 -->
		<div class="flex flex-col items-center justify-center py-16">
			<div
				class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
			>
				<RiCheckLine size={40} color="#22C55E" />
			</div>

			<h2 class="mb-2 text-xl font-bold text-slate-800">
				비밀번호가 변경되었습니다
			</h2>

			<p class="mb-8 text-center text-slate-500">
				새로운 비밀번호로 로그인해주세요
			</p>

			<button
				onclick={() => goto('/login')}
				class="btn btn-primary w-full max-w-xs"
			>
				로그인하러 가기
			</button>
		</div>
	{:else}
		<!-- 비밀번호 입력 폼 -->
		<div class="mb-8">
			<h2 class="text-xl font-bold text-slate-800">새 비밀번호 설정</h2>
			<p class="mt-2 text-slate-500">
				로그인에 사용할 새로운 비밀번호를 입력해주세요
			</p>
		</div>

		<div class="flex flex-col gap-6">
			<div class="flex flex-col gap-2">
				<label for="password" class="font-semibold text-slate-700"
					>새 비밀번호</label
				>
				<input
					id="password"
					type="password"
					placeholder="비밀번호를 입력하세요"
					bind:value={password}
					oninput={handle_input}
					class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none {password_error &&
					password
						? 'border-red-500'
						: ''}"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label for="password_confirm" class="font-semibold text-slate-700"
					>비밀번호 확인</label
				>
				<input
					id="password_confirm"
					type="password"
					placeholder="비밀번호를 다시 입력하세요"
					bind:value={password_confirm}
					oninput={handle_input}
					onkeydown={(e) => e.key === 'Enter' && update_password()}
					class="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none {password_error &&
					password_confirm
						? 'border-red-500'
						: ''}"
				/>
				{#if password_error}
					<p class="text-sm text-red-500">{password_error}</p>
				{/if}
			</div>

			<!-- 비밀번호 일치 확인 -->
			{#if password && password_confirm}
				<div class="rounded-xl bg-slate-50 p-4">
					<p
						class="text-sm font-medium {passwords_match
							? 'text-green-500'
							: 'text-slate-500'}"
					>
						{passwords_match ? '✓ 비밀번호가 일치합니다' : '• 비밀번호가 일치하지 않습니다'}
					</p>
				</div>
			{/if}
		</div>
	{/if}
</main>

{#if !is_success}
	<FixedBottomButton>
		<button
			onclick={update_password}
			class="btn btn-primary w-full"
			disabled={is_disabled}
		>
			{is_loading ? '변경 중...' : '비밀번호 변경'}
		</button>
	</FixedBottomButton>
{/if}
