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

	let is_loading = $state(true);

	// 계좌 관련 상태
	let bank_accounts = $state([]);
	let show_account_modal = $state(false);
	let show_delete_modal = $state(false);
	let account_to_delete = $state(null);

	// 계좌 정보 로드
	onMount(async () => {
		if (!me?.id) {
			is_loading = false;
			return;
		}

		try {
			const accounts = await api.user_bank_accounts.select_by_user_id(me.id);
			bank_accounts = accounts || [];
		} catch (e) {
			console.error('Failed to load bank accounts:', e);
		} finally {
			is_loading = false;
		}
	});

	// 계좌 추가 완료 핸들러
	const handle_account_added = (new_account) => {
		bank_accounts = bank_accounts.map((a) => ({ ...a, is_default: false }));
		bank_accounts = [new_account, ...bank_accounts];
		show_toast('success', '계좌가 추가되었어요');
	};

	// 기본 계좌 설정
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

	// 삭제 모달 열기
	function open_delete_modal(account) {
		account_to_delete = account;
		show_delete_modal = true;
	}

	// 계좌 삭제 확인
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
	<title>정산 계좌 관리 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="정산 받을 계좌를 관리하는 페이지입니다."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<a href={`/@${me?.handle}/accounts`}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</a>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">정산 계좌 관리</h1>
	{/snippet}
</Header>

<main class="p-4 pb-20">
	{#if is_loading}
		<div class="flex justify-center py-8">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else}
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
				<li>• 프로젝트 완료 시 기본 계좌로 정산됩니다</li>
				<li>• 입력한 정보는 안전하게 암호화되어 저장돼요</li>
			</ul>
		</div>
	{/if}
</main>

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
