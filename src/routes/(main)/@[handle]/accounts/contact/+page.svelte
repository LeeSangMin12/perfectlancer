<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckLine,
		RiDeleteBinLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AddBankAccountModal from '$lib/components/modals/AddBankAccountModal.svelte';

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
	const handle_account_added = (new_account) => {
		bank_accounts = bank_accounts.map((a) => ({ ...a, is_default: false }));
		bank_accounts = [new_account, ...bank_accounts];
	};

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
</script>

<svelte:head>
	<title>결제 정보 관리 | 문</title>
	<meta
		name="description"
		content="외주 프로젝트 결제 정보를 관리하는 페이지입니다."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<a href={`/@${me?.handle}/accounts`}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</a>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">결제 정보 관리</h1>
	{/snippet}
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
					onclick={() => (show_account_modal = true)}
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
<AddBankAccountModal
	bind:is_modal_open={show_account_modal}
	on_success={handle_account_added}
/>

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
