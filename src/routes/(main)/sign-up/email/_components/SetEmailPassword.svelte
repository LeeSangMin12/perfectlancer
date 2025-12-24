<script>
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';

	let {
		email = $bindable(''),
		password = $bindable(''),
		password_confirm = $bindable(''),
		email_error = $bindable(''),
		password_error = $bindable(''),
		is_checking_email = $bindable(false),
	} = $props();

	const api = get_api_context();

	/**
	 * 이메일 유효성 검사 및 중복 체크
	 */
	const validate_email = async (value) => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!value) {
			email_error = '';
			return;
		}

		if (!regex.test(value)) {
			email_error = '올바른 이메일 주소를 입력해주세요';
			return;
		}

		// 이메일 중복 및 provider 체크
		is_checking_email = true;
		try {
			const { exists, provider } = await api.auth.check_email_provider(value);

			if (exists) {
				const provider_name = api.auth.get_provider_name(provider);
				email_error = `이미 ${provider_name}로 가입된 이메일입니다`;
			} else {
				email_error = '';
			}
		} catch (err) {
			console.error('Email check error:', err);
			email_error = '';
		} finally {
			is_checking_email = false;
		}
	};

	/**
	 * 비밀번호 유효성 검사
	 * - 8자 이상
	 * - 영문, 숫자 조합
	 */
	const validate_password = (value) => {
		if (!value) {
			password_error = '';
			return;
		}

		if (value.length < 8) {
			password_error = '비밀번호는 8자 이상이어야 합니다';
			return;
		}

		const has_letter = /[a-zA-Z]/.test(value);
		const has_number = /[0-9]/.test(value);

		if (!has_letter || !has_number) {
			password_error = '비밀번호는 영문과 숫자를 모두 포함해야 합니다';
			return;
		}

		if (password_confirm && value !== password_confirm) {
			password_error = '비밀번호가 일치하지 않습니다';
			return;
		}

		password_error = '';
	};

	/**
	 * 비밀번호 확인 검사
	 */
	const validate_password_confirm = (value) => {
		if (!value) {
			password_error = '';
			return;
		}

		if (password && value !== password) {
			password_error = '비밀번호가 일치하지 않습니다';
		} else {
			password_error = '';
		}
	};

	// 디바운스를 위한 타이머
	let email_debounce_timer;

	const debounced_validate_email = (value) => {
		clearTimeout(email_debounce_timer);
		email_debounce_timer = setTimeout(() => validate_email(value), 500);
	};
</script>

<div class="mx-4 mt-8">
	<h2 class="text-lg font-bold text-slate-800">이메일로 시작하기</h2>
	<p class="mt-1 text-sm text-slate-500">
		로그인에 사용할 이메일과 비밀번호를 입력해주세요
	</p>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">이메일</p>

	<div class="mt-2 relative">
		<input
			type="email"
			placeholder="예: example@email.com"
			bind:value={email}
			oninput={() => debounced_validate_email(email)}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none {email_error
				? 'border-red-500'
				: ''}"
		/>
		{#if is_checking_email}
			<div class="absolute right-3 top-1/2 -translate-y-1/2">
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"
				></div>
			</div>
		{/if}
	</div>

	{#if email_error}
		<p class="mt-1 text-sm text-red-500">{email_error}</p>
	{/if}
</div>

<div class="mx-4 mt-6">
	<p class="ml-1 font-semibold">비밀번호</p>

	<div class="mt-2">
		<input
			type="password"
			placeholder="8자 이상, 영문 + 숫자 조합"
			bind:value={password}
			oninput={() => validate_password(password)}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none {password_error &&
			password
				? 'border-red-500'
				: ''}"
		/>
	</div>
</div>

<div class="mx-4 mt-6">
	<p class="ml-1 font-semibold">비밀번호 확인</p>

	<div class="mt-2">
		<input
			type="password"
			placeholder="비밀번호를 다시 입력하세요"
			bind:value={password_confirm}
			oninput={() => validate_password_confirm(password_confirm)}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none {password_error &&
			password_confirm
				? 'border-red-500'
				: ''}"
		/>
	</div>

	{#if password_error}
		<p class="mt-1 text-sm text-red-500">{password_error}</p>
	{/if}
</div>
