<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import Select from 'svelte-select';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckLine,
		RiDeleteBinLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let form = $state({
		contact_phone: '',
		contact_email: '',
		business_name: '',
	});

	let phone_error = $state('');
	let email_error = $state('');
	let is_submitting = $state(false);
	let is_loading = $state(true);

	// 계좌 관련 상태
	let bank_accounts = $state([]);
	let show_account_modal = $state(false);
	let show_delete_modal = $state(false);
	let account_to_delete = $state(null);
	let account_submitting = $state(false);

	let account_form = $state({
		account_type: 'individual',
		bank: '',
		account_number: '',
		account_holder: '',
		resident_number: '',
		business_number: '',
	});

	// 은행 목록
	const banks = [
		'카카오뱅크',
		'농협은행',
		'국민은행',
		'토스뱅크',
		'신한은행',
		'우리은행',
		'기업은행',
		'하나은행',
		'새마을금고',
		'부산은행',
		'케이뱅크',
		'신협은행',
		'우체국',
		'SC제일',
		'광주은행',
		'경남은행',
		'수협은행',
		'전북은행',
		'제주은행',
		'씨티은행',
		'산업은행',
	];

	const bank_items = banks.map((bank) => ({ label: bank, value: bank }));
	let selected_bank = $state(null);

	// 정보 로드
	onMount(async () => {
		if (!me?.id) {
			is_loading = false;
			return;
		}

		try {
			const [contact, accounts] = await Promise.all([
				api.user_contacts.select_by_user_id(me.id),
				api.user_bank_accounts.select_by_user_id(me.id),
			]);

			if (contact) {
				form.contact_phone = format_to_display(contact.contact_phone);
				form.contact_email = contact.contact_email || '';
				form.business_name = contact.payment_info?.business_name || '';
			}

			bank_accounts = accounts || [];
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			is_loading = false;
		}
	});

	// 전화번호 표시용 포맷 (010-1234-5678)
	const format_to_display = (phone) => {
		if (!phone) return '';
		const cleaned = phone.replace(/[^0-9]/g, '');
		if (cleaned.length === 11) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
		}
		return phone;
	};

	// 전화번호 자동 포맷팅 (입력 시)
	const format_phone_input = (value) => {
		const cleaned = value.replace(/[^0-9]/g, '');
		if (cleaned.length <= 3) return cleaned;
		if (cleaned.length <= 7)
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
	};

	// 전화번호 유효성 검증
	const validate_phone = (value) => {
		if (!value) {
			phone_error = '전화번호를 입력해주세요.';
			return false;
		}
		const cleaned = value.replace(/-/g, '');
		const regex = /^010\d{8}$/;
		if (!regex.test(cleaned)) {
			phone_error = '올바른 전화번호를 입력해주세요 (예: 010-1234-5678)';
			return false;
		}
		phone_error = '';
		return true;
	};

	// 이메일 유효성 검증
	const validate_email = (value) => {
		if (!value) {
			email_error = '';
			return true;
		}
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!regex.test(value)) {
			email_error = '올바른 이메일 주소를 입력해주세요.';
			return false;
		}
		email_error = '';
		return true;
	};

	const handle_phone_input = (event) => {
		form.contact_phone = format_phone_input(event.target.value);
		validate_phone(form.contact_phone);
	};

	const handle_email_input = () => {
		validate_email(form.contact_email);
	};

	const handle_submit = async () => {
		if (!me?.id) return;

		const is_phone_valid = validate_phone(form.contact_phone);
		const is_email_valid = validate_email(form.contact_email);

		if (!is_phone_valid || !is_email_valid) {
			show_toast('error', '입력 정보를 확인해주세요.');
			return;
		}

		is_submitting = true;
		try {
			const contact_phone = form.contact_phone.replace(/-/g, '');

			const saved_contact = await api.user_contacts.upsert(me.id, {
				contact_phone,
				contact_email: form.contact_email || null,
				payment_info: {
					business_name: form.business_name || null,
				},
			});

			Object.assign(me, { user_contact: saved_contact });

			show_toast('success', '결제 정보가 저장되었습니다.');
		} catch (e) {
			console.error('Save error:', e);
			show_toast('error', '결제 정보 저장에 실패했습니다.');
		} finally {
			is_submitting = false;
		}
	};

	// 계좌 관련 함수들
	function reset_account_form() {
		account_form = {
			account_type: 'individual',
			bank: '',
			account_number: '',
			account_holder: '',
			resident_number: '',
			business_number: '',
		};
		selected_bank = null;
	}

	function open_account_modal() {
		reset_account_form();
		show_account_modal = true;
	}

	function close_account_modal() {
		show_account_modal = false;
	}

	const is_account_valid = $derived(
		selected_bank &&
			account_form.account_number.length >= 10 &&
			account_form.account_holder.length >= 2 &&
			(account_form.account_type === 'individual'
				? account_form.resident_number.length === 13
				: account_form.business_number.length === 10),
	);

	async function handle_account_submit() {
		if (!is_account_valid || account_submitting) return;

		account_submitting = true;
		try {
			const new_account = await api.user_bank_accounts.insert({
				user_id: me.id,
				account_type: account_form.account_type,
				bank: selected_bank.value,
				account_number: account_form.account_number.replace(/[^0-9]/g, ''),
				account_holder: account_form.account_holder,
				resident_number:
					account_form.account_type === 'individual'
						? account_form.resident_number.replace(/[^0-9]/g, '')
						: null,
				business_number:
					account_form.account_type === 'business'
						? account_form.business_number.replace(/[^0-9]/g, '')
						: null,
			});

			bank_accounts = bank_accounts.map((a) => ({ ...a, is_default: false }));
			bank_accounts = [new_account, ...bank_accounts];

			close_account_modal();
			show_toast('success', '계좌가 등록되었어요');
		} catch (err) {
			console.error('Add bank account error:', err);
			show_toast('error', '계좌 등록에 실패했어요');
		} finally {
			account_submitting = false;
		}
	}

	async function set_default(account) {
		if (account.is_default) return;

		try {
			await api.user_bank_accounts.set_default(account.id, me.id);
			bank_accounts = bank_accounts.map((a) => ({
				...a,
				is_default: a.id === account.id,
			}));
			show_toast('success', '기본 계좌로 설정되었어요');
		} catch (err) {
			console.error('Set default error:', err);
			show_toast('error', '설정에 실패했어요');
		}
	}

	function open_delete_modal(account) {
		account_to_delete = account;
		show_delete_modal = true;
	}

	async function confirm_delete() {
		if (!account_to_delete) return;

		try {
			await api.user_bank_accounts.delete(account_to_delete.id);
			bank_accounts = bank_accounts.filter(
				(a) => a.id !== account_to_delete.id,
			);
			show_toast('success', '계좌가 삭제되었어요');
		} catch (err) {
			console.error('Delete account error:', err);
			show_toast('error', '삭제에 실패했어요');
		} finally {
			show_delete_modal = false;
			account_to_delete = null;
		}
	}

	function on_resident_input(e) {
		let value = e.target.value.replace(/[^0-9]/g, '');
		if (value.length > 13) value = value.slice(0, 13);
		account_form.resident_number = value;
	}

	function on_business_input(e) {
		let value = e.target.value.replace(/[^0-9]/g, '');
		if (value.length > 10) value = value.slice(0, 10);
		account_form.business_number = value;
	}

	function on_account_input(e) {
		account_form.account_number = e.target.value.replace(/[^0-9-]/g, '');
	}

	const display_resident = $derived(() => {
		const num = account_form.resident_number;
		if (num.length <= 6) return num;
		return num.slice(0, 6) + '-' + num.slice(6);
	});

	const display_business = $derived(() => {
		const num = account_form.business_number;
		if (num.length <= 3) return num;
		if (num.length <= 5) return num.slice(0, 3) + '-' + num.slice(3);
		return num.slice(0, 3) + '-' + num.slice(3, 5) + '-' + num.slice(5);
	});
</script>

<svelte:head>
	<title>결제 정보 관리 | 문</title>
	<meta
		name="description"
		content="외주 프로젝트 결제 정보를 관리하는 페이지입니다."
	/>
</svelte:head>

<Header>
	<a slot="left" href={`/@${me?.handle}/accounts`}>
		<RiArrowLeftSLine size={24} color={colors.gray[800]} />
	</a>
	<h1 slot="center" class="font-semibold">결제 정보 관리</h1>
</Header>

<main class="p-4 pb-32">
	{#if is_loading}
		<div class="flex justify-center py-8">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else}
		<!-- 안내 문구 -->
		<div class="rounded-lg bg-gray-100 p-2">
			<p class="text-sm">
				프로젝트 진행 시 의뢰인 또는 전문가가 연락할 수 있는 정보입니다.
				<br />
				연락처를 입력 하시면, 소통을 위한 개인정보 활용 및 알림톡 수신에 동의하게
				됩니다.
			</p>
		</div>

		<!-- 사업자명/이름명 -->
		<div class="mt-6">
			<p class="ml-1 font-semibold">사업자명 (이름명)</p>

			<div class="mt-2">
				<input
					type="text"
					placeholder="사업자명 또는 이름을 입력해주세요"
					bind:value={form.business_name}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<!-- 전화번호 -->
		<div class="mt-6">
			<div class="flex items-center gap-1">
				<p class="ml-1 font-semibold">전화번호</p>
				<span class="text-red-500">*</span>
			</div>

			<div class="mt-2">
				<input
					type="tel"
					placeholder="010-1234-5678"
					value={form.contact_phone}
					oninput={handle_phone_input}
					maxlength="13"
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
					class:input-error={phone_error}
				/>
			</div>

			{#if phone_error}
				<p class="mt-1 ml-1 text-sm text-red-500">{phone_error}</p>
			{/if}
		</div>

		<!-- 이메일 -->
		<div class="mt-6">
			<p class="ml-1 font-semibold">이메일</p>

			<div class="mt-2">
				<input
					type="email"
					placeholder="example@email.com"
					bind:value={form.contact_email}
					oninput={handle_email_input}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
					class:input-error={email_error}
				/>
			</div>

			{#if email_error}
				<p class="mt-1 ml-1 text-sm text-red-500">{email_error}</p>
			{/if}
		</div>

		<!-- 구분선 -->
		<div class="my-8 border-t border-gray-200"></div>

		<!-- 계좌 관리 섹션 -->
		<div>
			<div class="flex items-center justify-between">
				<h2 class="ml-1 font-semibold">정산 계좌</h2>
				<button
					onclick={open_account_modal}
					class="text-primary flex items-center gap-1 text-sm"
				>
					<RiAddLine size={16} />
					계좌 추가
				</button>
			</div>

			{#if bank_accounts.length > 0}
				<ul class="mt-4 space-y-3">
					{#each bank_accounts as account}
						<li
							class="flex items-center justify-between rounded-lg border border-gray-200 p-4"
						>
							<button
								onclick={() => set_default(account)}
								class="flex flex-1 items-center gap-3 text-left"
							>
								<div
									class="flex h-5 w-5 items-center justify-center rounded-full border-2
										{account.is_default ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}"
								>
									{#if account.is_default}
										<RiCheckLine size={12} class="text-white" />
									{/if}
								</div>
								<div>
									<p class="text-[15px] font-medium text-gray-900">
										{account.bank}
										{#if account.is_default}
											<span class="ml-1 text-[12px] text-blue-600">기본</span>
										{/if}
									</p>
									<p class="mt-0.5 text-[14px] text-gray-500">
										{account.account_number}
									</p>
									<p class="text-[13px] text-gray-400">
										{account.account_holder}
									</p>
								</div>
							</button>
							<button
								onclick={() => open_delete_modal(account)}
								class="p-2 text-gray-400 active:text-red-500"
							>
								<RiDeleteBinLine size={18} />
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<div
					class="mt-4 rounded-lg border border-dashed border-gray-300 py-8 text-center"
				>
					<p class="text-sm text-gray-400">등록된 계좌가 없어요</p>
					<p class="mt-1 text-xs text-gray-400">
						정산 받을 계좌를 추가해주세요
					</p>
				</div>
			{/if}

			<!-- 안내 -->
			<ul class="mt-4 space-y-1.5 text-[12px] text-gray-400">
				<li>• 본인 명의의 계좌만 등록할 수 있어요</li>
				<li>• 주민등록번호는 원천징수 신고에 사용돼요</li>
				<li>• 입력한 정보는 안전하게 암호화되어 저장돼요</li>
			</ul>
		</div>
	{/if}
</main>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			class="btn btn-primary w-full"
			onclick={handle_submit}
			disabled={is_submitting || is_loading}
		>
			{is_submitting ? '저장 중...' : '저장'}
		</button>
	</div>
</div>

<!-- 계좌 추가 모달 -->
<Modal bind:is_modal_open={show_account_modal} modal_position="bottom">
	<div class="flex flex-col items-center p-4">
		<div class="h-1 w-10 self-center rounded-full bg-gray-300"></div>

		<h3 class="mt-4 text-[17px] font-semibold">계좌 등록</h3>

		<!-- 폼 -->
		<div class="pb-safe mt-4 w-full">
			<!-- 계좌 유형 -->
			<div>
				<p class="text-[13px] text-gray-500">계좌 유형</p>
				<div class="mt-2 flex gap-2">
					<button
						onclick={() => (account_form.account_type = 'individual')}
						class="flex-1 rounded-lg border py-3 text-[14px] font-medium transition
							{account_form.account_type === 'individual'
							? 'border-primary bg-primary text-white'
							: 'border-gray-100 bg-gray-100 text-gray-600'}"
					>
						개인
					</button>
					<button
						onclick={() => (account_form.account_type = 'business')}
						class="flex-1 rounded-lg border py-3 text-[14px] font-medium transition
							{account_form.account_type === 'business'
							? 'border-primary bg-primary text-white'
							: 'border-gray-100 bg-gray-100 text-gray-600'}"
					>
						사업자
					</button>
				</div>
			</div>

			<!-- 은행 선택 -->
			<div class="mt-5">
				<p class="text-[13px] text-gray-500">은행</p>
				<div class="mt-2">
					<Select
						items={bank_items}
						bind:value={selected_bank}
						placeholder="은행 선택"
						--border-radius="0.5rem"
						--padding="0 1rem"
						--height="48px"
						--font-size="15px"
						--border="1px solid #e5e7eb"
						--border-hover="1px solid #237bf8"
						--border-focused="1px solid #237bf8"
						--item-height="44px"
					/>
				</div>
			</div>

			<!-- 계좌번호 -->
			<div class="mt-5">
				<p class="text-[13px] text-gray-500">계좌번호</p>
				<input
					type="text"
					inputmode="numeric"
					value={account_form.account_number}
					oninput={on_account_input}
					placeholder="- 없이 숫자만 입력"
					class="focus:border-primary mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
				/>
			</div>

			<!-- 예금주 -->
			<div class="mt-5">
				<p class="text-[13px] text-gray-500">예금주</p>
				<input
					type="text"
					bind:value={account_form.account_holder}
					placeholder="예금주명 입력"
					class="focus:border-primary mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
				/>
			</div>

			<!-- 주민등록번호 / 사업자등록번호 -->
			{#if account_form.account_type === 'individual'}
				<div class="mt-5">
					<p class="text-[13px] text-gray-500">주민등록번호</p>
					<input
						type="text"
						inputmode="numeric"
						value={display_resident()}
						oninput={on_resident_input}
						placeholder="000000-0000000"
						class="focus:border-primary mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
					/>
					<p class="mt-2 text-[12px] text-gray-400">
						원천징수 신고를 위해 필요해요
					</p>
				</div>
			{:else}
				<div class="mt-5">
					<p class="text-[13px] text-gray-500">사업자등록번호</p>
					<input
						type="text"
						inputmode="numeric"
						value={display_business()}
						oninput={on_business_input}
						placeholder="000-00-00000"
						class="focus:border-primary mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
					/>
				</div>
			{/if}

			<!-- 제출 버튼 -->
			<button
				onclick={handle_account_submit}
				disabled={!is_account_valid || account_submitting}
				class="btn btn-primary mt-6 w-full"
			>
				{account_submitting ? '등록 중...' : '등록하기'}
			</button>
		</div>
	</div>
</Modal>

<!-- 삭제 확인 모달 -->
<Modal bind:is_modal_open={show_delete_modal} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">계좌를 삭제할까요?</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => (show_delete_modal = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={confirm_delete}
				class="flex-1 rounded-lg bg-red-500 py-3 text-[14px] font-medium text-white active:bg-red-600"
			>
				삭제하기
			</button>
		</div>
	</div>
</Modal>
