<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	// 공통 컴포넌트 재사용
	import PhoneVerification from '../_components/PhoneVerification.svelte';
	import SetAvatar from '../_components/SetAvatar.svelte';
	import SetConsent from '../_components/SetConsent.svelte';
	import SetPersonal from '../_components/SetPersonal.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { supabase } = $derived(data);

	const TITLE = '이메일 회원가입';
	const TOTAL_STEPS = 6;

	let page_count = $state(1);
	let is_back_modal = $state(false);
	let created_user_id = $state(null);
	let is_resuming = $state(false); // 중간 이탈 후 재진입 여부
	let email_error = $state('');

	let sign_up_form_data = $state({
		// 이메일 + 비밀번호
		email: '',
		password: '',
		password_confirm: '',
		// 약관 동의
		agree_terms: false,
		agree_privacy: false,
		agree_marketing: false,
		// 회원 정보
		phone: '',
		phone_verified: false,
		gender: '',
		handle: '',
		name: '',
		birth_date: '',
		avatar_url: '',
	});

	// 에러 상태
	let password_error = $state('');
	let handle_error = $state(false);

	// 비밀번호 일치 체크
	const passwords_match = $derived(
		sign_up_form_data.password &&
			sign_up_form_data.password === sign_up_form_data.password_confirm,
	);

	// 이메일 유효성 검사
	const is_valid_email = $derived(() => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(sign_up_form_data.email);
	});

	/**
	 * 페이지 로드 시 로그인 상태 확인 (중간 이탈 후 재진입 처리)
	 */
	onMount(() => {
		check_existing_session();
	});

	const check_existing_session = async () => {
		const { data: session_data } = await supabase.auth.getSession();

		if (session_data?.session?.user) {
			const user = session_data.session.user;
			created_user_id = user.id;
			sign_up_form_data.email = user.email || '';
			is_resuming = true;

			// 프로필 정보 조회
			const profile = await api.users.select(user.id);

			if (profile) {
				// 어디까지 진행했는지 확인하고 해당 단계로 이동
				if (profile.handle) {
					// 이미 가입 완료된 사용자
					goto('/');
					return;
				}

				// 저장된 정보 복원
				if (profile.phone) {
					sign_up_form_data.phone = profile.phone;
					sign_up_form_data.phone_verified = true;
				}
				if (profile.name) sign_up_form_data.name = profile.name;
				if (profile.gender) sign_up_form_data.gender = profile.gender;
				if (profile.birth_date) sign_up_form_data.birth_date = profile.birth_date;

				// 적절한 단계로 이동
				if (!sign_up_form_data.phone_verified) {
					page_count = 3; // 전화번호 인증
				} else if (!sign_up_form_data.name || !sign_up_form_data.handle) {
					page_count = 4; // 기본 정보
				} else if (!sign_up_form_data.gender || !sign_up_form_data.birth_date) {
					page_count = 5; // 개인 정보
				} else {
					page_count = 6; // 아바타
				}
			} else {
				// 프로필이 없으면 전화번호 인증부터
				page_count = 3;
			}
		}
	};

	/**
	 * 이메일 중복 체크 및 기존 사용자 로그인 시도
	 */
	const check_email_duplicate = async () => {
		if (!sign_up_form_data.email) {
			email_error = '이메일을 입력해주세요';
			return false;
		}

		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!regex.test(sign_up_form_data.email)) {
			email_error = '올바른 이메일 형식이 아닙니다';
			return false;
		}

		const { exists, provider } = await api.auth.check_email_provider(
			sign_up_form_data.email,
		);

		if (exists) {
			// 이메일 provider로 가입된 경우, 입력한 비밀번호로 로그인 시도
			if (provider === 'email') {
				const login_result = await try_login_existing_user();
				if (login_result) {
					// 로그인 성공 → 회원가입 재개
					return true;
				}
				// 로그인 실패 → 비밀번호 오류
				return false;
			}

			// 다른 provider로 가입된 경우
			const provider_name = api.auth.get_provider_name(provider);
			email_error = `이미 ${provider_name}로 가입된 이메일입니다`;
			return false;
		}

		email_error = '';
		return true;
	};

	/**
	 * 기존 이메일 사용자 로그인 시도 (중간 이탈 후 재가입 처리)
	 */
	const try_login_existing_user = async () => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: sign_up_form_data.email,
				password: sign_up_form_data.password,
			});

			if (error) {
				if (error.message.includes('Invalid login credentials')) {
					email_error = '이미 가입된 이메일입니다. 비밀번호가 올바르지 않습니다';
				} else {
					email_error = '이미 가입된 이메일입니다. 로그인 페이지에서 로그인해주세요';
				}
				return false;
			}

			if (data?.user) {
				created_user_id = data.user.id;
				is_resuming = true;

				// 프로필 확인
				const profile = await api.users.select(data.user.id);

				if (profile?.handle) {
					// 이미 가입 완료된 사용자
					show_toast('info', '이미 가입된 계정입니다. 메인으로 이동합니다');
					goto('/');
					return false;
				}

				// 미완성 프로필 → 저장된 정보 복원
				if (profile) {
					if (profile.phone) {
						sign_up_form_data.phone = profile.phone;
						sign_up_form_data.phone_verified = true;
					}
					if (profile.name) sign_up_form_data.name = profile.name;
					if (profile.gender) sign_up_form_data.gender = profile.gender;
					if (profile.birth_date) sign_up_form_data.birth_date = profile.birth_date;
				}

				// step 2(약관)는 건너뛰고 step 3(전화인증)부터 진행
				// go_next에서 page_count를 3으로 설정
				show_toast('info', '회원가입을 이어서 진행합니다');
				return true;
			}

			return false;
		} catch (err) {
			console.error('Login attempt error:', err);
			email_error = '로그인 시도 중 오류가 발생했습니다';
			return false;
		}
	};

	/**
	 * Supabase Auth 사용자 생성 (약관 동의 후 호출)
	 * 이미 auth.users에 존재하면 로그인 시도
	 */
	const create_auth_user = async () => {
		update_global_store('loading', true);

		try {
			const { data, error } = await supabase.auth.signUp({
				email: sign_up_form_data.email,
				password: sign_up_form_data.password,
			});

			console.log('signUp response:', { data, error });

			if (error) {
				console.log('signUp error:', error.message);
				// 이미 가입된 이메일 또는 rate limit → 로그인 시도
				if (
					error.message.includes('already registered') ||
					error.message.includes('security purposes')
				) {
					const login_success = await try_login_and_resume();
					return login_success;
				}
				throw error;
			}

			// 이메일 확인이 필요한 경우에도 user는 생성됨
			if (data?.user?.id) {
				created_user_id = data.user.id;
				console.log('User created:', created_user_id);
				return true;
			}

			// data.user가 없는 경우 (fake signup 방지 등)
			console.log('No user in response, data:', data);
			show_toast('error', '회원가입을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
			return false;
		} catch (err) {
			console.error('Auth user creation error:', err);
			show_toast('error', '계정 생성에 실패했습니다');
			return false;
		} finally {
			update_global_store('loading', false);
		}
	};

	/**
	 * signUp 실패 시 로그인 시도 후 회원가입 재개
	 */
	const try_login_and_resume = async () => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: sign_up_form_data.email,
				password: sign_up_form_data.password,
			});

			if (error) {
				if (error.message.includes('Invalid login credentials')) {
					show_toast('error', '이미 가입된 이메일입니다. 비밀번호가 올바르지 않습니다');
				} else {
					show_toast('error', '이미 가입된 이메일입니다. 로그인 페이지에서 로그인해주세요');
				}
				return false;
			}

			if (data?.user) {
				created_user_id = data.user.id;
				is_resuming = true;

				// 프로필 확인
				const profile = await api.users.select(data.user.id);

				if (profile?.handle) {
					show_toast('info', '이미 가입된 계정입니다. 메인으로 이동합니다');
					goto('/');
					return false;
				}

				// 저장된 정보 복원
				if (profile) {
					if (profile.phone) {
						sign_up_form_data.phone = profile.phone;
						sign_up_form_data.phone_verified = true;
					}
					if (profile.name) sign_up_form_data.name = profile.name;
					if (profile.gender) sign_up_form_data.gender = profile.gender;
					if (profile.birth_date) sign_up_form_data.birth_date = profile.birth_date;
				}

				show_toast('info', '회원가입을 이어서 진행합니다');

				// step 3(전화인증)부터 재개 (page_count는 go_next에서 +1 됨)
				// 현재 page_count가 2이고 go_next 마지막에 +1 되므로
				// phone_verified 상태에 따라 적절한 위치로 설정
				if (sign_up_form_data.phone_verified) {
					if (!sign_up_form_data.name || !sign_up_form_data.handle) {
						page_count = 3; // go_next에서 +1 → 4
					} else if (!sign_up_form_data.gender || !sign_up_form_data.birth_date) {
						page_count = 4; // go_next에서 +1 → 5
					} else {
						page_count = 5; // go_next에서 +1 → 6
					}
				} else {
					page_count = 2; // go_next에서 +1 → 3
				}

				return true;
			}

			return false;
		} catch (err) {
			console.error('Login attempt error:', err);
			show_toast('error', '로그인 시도 중 오류가 발생했습니다');
			return false;
		}
	};

	/**
	 * 비밀번호 유효성 검사
	 */
	const validate_password = () => {
		const { password, password_confirm } = sign_up_form_data;

		if (!password) {
			password_error = '비밀번호를 입력해주세요';
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
	 * 전화번호 인증 완료 핸들러
	 */
	const handle_phone_verified = (international_phone) => {
		sign_up_form_data.phone_verified = true;
		sign_up_form_data.phone = international_phone;
	};

	/**
	 * 회원 가입 이전페이지 이동
	 */
	const go_prev = () => {
		// 재진입 시 1단계로 돌아가지 않음
		const min_step = is_resuming ? 3 : 1;

		if (page_count <= min_step) {
			is_back_modal = true;
		} else {
			page_count -= 1;
		}
	};

	/**
	 * 다음 버튼 disabled 검사
	 */
	const is_next_btn_disabled = () => {
		const {
			email,
			password,
			password_confirm,
			agree_terms,
			agree_privacy,
			phone_verified,
			name,
			handle,
			gender,
			birth_date,
		} = sign_up_form_data;

		switch (page_count) {
			case 1: // 이메일 + 비밀번호
				return (
					!email ||
					!password ||
					!password_confirm ||
					password !== password_confirm ||
					!!password_error ||
					!!email_error
				);
			case 2: // 약관 동의
				return !agree_terms || !agree_privacy;
			case 3: // 전화번호 인증
				return !phone_verified;
			case 4: // 기본 정보
				return name === '' || handle === '' || handle_error === true;
			case 5: // 개인 정보
				return gender === '' || birth_date === '';
			default:
				return false;
		}
	};

	/**
	 * 회원 가입 다음페이지 이동
	 */
	const go_next = async () => {
		if (page_count === 1) {
			// 이메일 중복 및 비밀번호 유효성 검사
			const email_valid = await check_email_duplicate();
			if (!email_valid) return;

			if (!validate_password()) return;

			// 기존 사용자 로그인 성공 시 step 3(전화인증)으로 바로 이동
			if (is_resuming) {
				// 이미 전화인증까지 완료한 경우 적절한 단계로 이동
				if (sign_up_form_data.phone_verified) {
					if (!sign_up_form_data.name || !sign_up_form_data.handle) {
						page_count = 4;
					} else if (!sign_up_form_data.gender || !sign_up_form_data.birth_date) {
						page_count = 5;
					} else {
						page_count = 6;
					}
				} else {
					page_count = 3;
				}
				return;
			}
		} else if (page_count === 2) {
			// 약관 동의 확인 후 계정 생성
			if (!sign_up_form_data.agree_terms || !sign_up_form_data.agree_privacy) {
				show_toast('error', '필수 약관에 동의해주세요');
				return;
			}

			const success = await create_auth_user();
			if (!success) return;
		} else if (page_count === 3) {
			// 전화번호 인증 완료 확인
			if (!sign_up_form_data.phone_verified) {
				show_toast('error', '전화번호 인증을 완료해주세요');
				return;
			}
		} else if (page_count === 4) {
			// 아이디 중복 확인
			const handle_exists = await api.users.check_handle_exists(
				sign_up_form_data.handle,
			);

			if (handle_exists) {
				show_toast('error', '중복된 아이디입니다.');
				return;
			}
		} else if (page_count === 6) {
			// 회원가입 완료
			await save_users();
			return;
		}

		page_count += 1;
	};

	const save_users = async () => {
		update_global_store('loading', true);

		try {
			const user_id = created_user_id;

			if (!user_id) {
				throw new Error('사용자 정보가 없습니다');
			}

			await api.users.upsert(user_id, {
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				email: sign_up_form_data.email,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
				marketing_consent: sign_up_form_data.agree_marketing,
			});

			Object.assign(me, {
				id: user_id,
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				email: sign_up_form_data.email,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
				avatar_url: sign_up_form_data.avatar_url,
				marketing_consent: sign_up_form_data.agree_marketing,
			});

			show_toast('success', '가입이 완료되었어요!');
			goto('/?signup=complete');
		} catch (err) {
			console.error('회원가입 저장 실패:', err);
			show_toast('error', '회원가입에 실패했습니다');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>이메일 회원가입 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="퍼펙트랜서에 이메일로 가입하세요. 간단한 회원가입으로 전문가들과 소통을 시작하세요."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button class="flex items-center" onclick={go_prev}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">{TITLE}</h1>
	{/snippet}
</Header>

<!-- Progress bar -->
<div class="mb-4">
	<div class="h-1 w-full rounded-full bg-gray-200">
		<div
			class="h-1 rounded-lg bg-blue-600 transition-all duration-300"
			style="width: {page_count * (100 / TOTAL_STEPS)}%"
		></div>
	</div>
</div>

<main>
	{#if page_count === 1}
		<!-- 1단계: 이메일 + 비밀번호 -->
		<div class="mx-4 mt-8">
			<h2 class="text-lg font-bold text-slate-800">이메일 회원가입</h2>
			<p class="mt-1 text-sm text-slate-500">
				로그인에 사용할 이메일과 비밀번호를 입력해주세요
			</p>
		</div>

		<div class="mx-4 mt-8">
			<p class="ml-1 font-semibold">이메일</p>
			<div class="mt-2">
				<input
					type="email"
					placeholder="example@email.com"
					bind:value={sign_up_form_data.email}
					oninput={() => (email_error = '')}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none {email_error
						? 'border-red-500'
						: ''}"
				/>
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
					placeholder="비밀번호를 입력하세요"
					bind:value={sign_up_form_data.password}
					oninput={() => (password_error = '')}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<div class="mx-4 mt-4">
			<p class="ml-1 font-semibold">비밀번호 확인</p>
			<div class="mt-2">
				<input
					type="password"
					placeholder="비밀번호를 다시 입력하세요"
					bind:value={sign_up_form_data.password_confirm}
					oninput={() => (password_error = '')}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
			{#if password_error}
				<p class="mt-1 text-sm text-red-500">{password_error}</p>
			{/if}
		</div>

		<!-- 비밀번호 일치 확인 -->
		{#if sign_up_form_data.password || sign_up_form_data.password_confirm}
			<div class="mx-4 mt-4">
				<p class="text-sm {passwords_match ? 'text-green-500' : 'text-slate-400'}">
					{passwords_match ? '✓ 비밀번호가 일치합니다' : '• 비밀번호가 일치하지 않습니다'}
				</p>
			</div>
		{/if}
	{:else if page_count === 2}
		<!-- 2단계: 약관 동의 -->
		<SetConsent
			bind:agree_terms={sign_up_form_data.agree_terms}
			bind:agree_privacy={sign_up_form_data.agree_privacy}
			bind:agree_marketing={sign_up_form_data.agree_marketing}
		/>
	{:else if page_count === 3}
		<!-- 3단계: 전화번호 인증 -->
		<PhoneVerification
			bind:phone={sign_up_form_data.phone}
			on_verified={handle_phone_verified}
		/>
	{:else if page_count === 4}
		<!-- 4단계: 기본 정보 -->
		<div class="mx-4 mt-8">
			<p class="ml-1 font-semibold">이름</p>
			<div class="mt-2">
				<input
					type="text"
					placeholder="예: 홍길동"
					bind:value={sign_up_form_data.name}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<div class="mx-4 mt-8">
			<p class="ml-1 font-semibold">아이디</p>
			<div class="mt-2">
				<input
					type="text"
					placeholder="예: devsangmin32"
					bind:value={sign_up_form_data.handle}
					oninput={() => {
						const regex = /^[a-zA-Z0-9._]+$/;
						handle_error =
							sign_up_form_data.handle &&
							!regex.test(sign_up_form_data.handle);
					}}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
			{#if handle_error}
				<p class="mt-1 text-sm text-red-500">
					아이디에는 영어, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다.
				</p>
			{/if}
		</div>

		<div class="mx-4 mt-8">
			<p class="ml-1 font-semibold text-slate-400">이메일</p>
			<div class="mt-2">
				<input
					type="email"
					value={sign_up_form_data.email}
					disabled
					class="input input-bordered h-[52px] w-full bg-slate-100 text-slate-500"
				/>
			</div>
			<p class="mt-1 text-xs text-slate-400">입력한 이메일이 사용됩니다</p>
		</div>
	{:else if page_count === 5}
		<!-- 5단계: 개인 정보 -->
		<SetPersonal bind:data={sign_up_form_data} />
	{:else if page_count === 6}
		<!-- 6단계: 프로필 사진 -->
		<SetAvatar
			bind:avatar_url={sign_up_form_data.avatar_url}
			user_id={created_user_id}
		/>
	{/if}
</main>

<FixedBottomButton>
	<button
		onclick={go_next}
		class="btn btn-primary w-full"
		disabled={is_next_btn_disabled()}
	>
		{page_count === TOTAL_STEPS ? '시작하기' : '다음'}
	</button>
</FixedBottomButton>

<Modal bind:is_modal_open={is_back_modal} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			가입을 그만두시겠어요?
		</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => {
					location.href = '/login';
				}}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				나가기
			</button>
			<button
				onclick={() => (is_back_modal = false)}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600"
			>
				계속하기
			</button>
		</div>
	</div>
</Modal>
