<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, copy_to_clipboard, show_toast } from '$lib/utils/common';
	import { optimize_avatar } from '$lib/utils/image';
	import { goto } from '$app/navigation';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckLine,
		RiFileCopyLine,
	} from 'svelte-remixicon';

	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import AddBankAccountModal from '$lib/components/modals/AddBankAccountModal.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let work_request = $state(data.work_request);
	let proposal = $state(data.proposal);
	let bank_accounts = $state(data.bank_accounts);

	let is_processing = $state(false);
	let show_cancel_modal = $state(false);
	let show_add_account_modal = $state(false);

	const quote = $derived(proposal.quote_data);
	const payment_amount = $derived(
		proposal.proposed_amount || quote?.price || 0,
	);

	// 입금 계좌
	const deposit_info = {
		bank: '부산은행',
		number: '101-2094-2262-04',
		holder: '퓨처밴스 이상민',
	};

	// 계좌 선택
	let selected_account_id = $state(null);

	// 초기 계좌 선택
	$effect(() => {
		if (selected_account_id === null && bank_accounts.length > 0) {
			const default_account = bank_accounts.find((a) => a.is_default);
			selected_account_id = default_account?.id || bank_accounts[0]?.id || null;
		}
	});

	const selected_account = $derived(
		bank_accounts.find((a) => a.id === selected_account_id),
	);

	const can_submit = $derived(selected_account_id !== null);

	// 계좌 선택
	const select_account = (account) => {
		selected_account_id = account.id;
	};

	// 계좌 추가 성공 핸들러
	const handle_account_added = (new_account) => {
		bank_accounts = [...bank_accounts, new_account];
		selected_account_id = new_account.id;
	};

	// 결제(수락) 진행
	const handle_payment = async () => {
		if (!can_submit || is_processing) return;

		is_processing = true;
		update_global_store('loading', true);

		try {
			// 1. payments 테이블에 결제 정보 저장
			await api.payments.insert({
				user_id: me.id,
				amount: payment_amount,
				payment_type: 'proposal_acceptance',
				reference_type: 'work_request_proposals',
				reference_id: proposal.id,
				payment_method: 'bank_transfer',
				depositor_name: selected_account.account_holder,
				depositor_bank: selected_account.bank,
				depositor_account_number: selected_account.account_number,
			});

			// 2. 제안이 아직 pending이면 수락 처리 (재결제 시에는 이미 accepted)
			if (proposal.status === 'pending') {
				const result = await api.work_request_proposals.complete_payment(
					proposal.id,
					work_request.id,
					me.id,
				);

				show_toast('success', '제안이 수락되었습니다!');

				if (result.auto_closed) {
					show_toast('info', '모집 인원이 충족되어 공고가 마감되었습니다.');
				}
			} else {
				// 재결제 케이스
				show_toast(
					'success',
					'결제가 완료되었습니다. 입금 확인 후 진행됩니다.',
				);
			}

			await goto(`/work-request/${work_request.id}`, { replaceState: true });
		} catch (error) {
			console.error('Payment error:', error);
			show_toast('error', error.message || '결제 중 오류가 발생했습니다.');
		} finally {
			is_processing = false;
			update_global_store('loading', false);
		}
	};

	// 결제 취소 (이전 페이지로 이동)
	const handle_cancel = async () => {
		await goto(`/work-request/${work_request.id}`, { replaceState: true });
	};

	// 계좌 복사
	const copy_account = async () => {
		await copy_to_clipboard(deposit_info.number, '계좌번호가 복사되었습니다.');
	};
</script>

<svelte:head>
	<title>결제 | {work_request.title}</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={() => (show_cancel_modal = true)}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">결제하기</h1>
	{/snippet}
</Header>

<main class="min-h-screen bg-gray-50 pb-32">
	<!-- 공고 정보 -->
	<div class="bg-white px-5 py-4">
		<p class="text-sm text-gray-500">외주 공고</p>
		<p class="mt-1 font-semibold text-gray-900">{work_request.title}</p>
	</div>

	<!-- 전문가 정보 -->
	<div class="mt-2 bg-white px-5 py-4">
		<div class="flex items-center gap-3">
			<div
				class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100"
			>
				{#if proposal.users?.avatar_url}
					<img
						src={optimize_avatar(proposal.users.avatar_url)}
						alt=""
						class="h-full w-full object-cover"
					/>
				{:else}
					<span class="text-lg font-medium text-gray-400">
						{(proposal.users?.name ||
							proposal.users?.handle)?.[0]?.toUpperCase()}
					</span>
				{/if}
			</div>
			<div>
				<p class="font-semibold text-gray-900">
					{proposal.users?.name || proposal.users?.handle}
				</p>
				<p class="text-sm text-gray-500">전문가</p>
			</div>
		</div>

		<!-- 결제 금액 -->
		<div class="mt-4 border-t border-gray-100 pt-4">
			<div class="flex items-center justify-between">
				<span class="text-gray-600">결제 금액</span>
				<span class="text-xl font-bold text-gray-900"
					>₩{comma(payment_amount)}</span
				>
			</div>
			{#if quote?.title}
				<p class="mt-1 text-sm text-gray-500">{quote.title}</p>
			{/if}
		</div>
	</div>

	<!-- 입금 계좌 안내 -->
	<div class="mt-2 bg-white px-5 py-5">
		<p class="text-[13px] font-medium text-gray-500">입금 계좌</p>
		<div class="mt-3 flex items-center justify-between">
			<div>
				<p class="text-[15px] font-medium text-gray-900">{deposit_info.bank}</p>
				<p class="mt-0.5 text-[18px] font-bold text-gray-900">
					{deposit_info.number}
				</p>
				<p class="mt-0.5 text-[13px] text-gray-500">
					예금주: {deposit_info.holder}
				</p>
			</div>
			<button
				onclick={copy_account}
				class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
			>
				<RiFileCopyLine size={18} class="text-gray-600" />
			</button>
		</div>
	</div>

	<!-- 내 계좌 정보 -->
	<div class="mt-2 bg-white px-5 py-5">
		<p class="text-[13px] font-medium text-gray-500">입금자 계좌</p>

		{#if bank_accounts.length > 0}
			<div class="mt-3 space-y-2">
				{#each bank_accounts as account (account.id)}
					<button
						onclick={() => select_account(account)}
						class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition
							{selected_account_id === account.id
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200'}"
					>
						<div
							class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2
								{selected_account_id === account.id
								? 'border-blue-500 bg-blue-500'
								: 'border-gray-300'}"
						>
							{#if selected_account_id === account.id}
								<RiCheckLine size={12} class="text-white" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-[14px] font-medium text-gray-900">
								{account.bank}
								{account.account_number}
							</p>
							<p class="text-[12px] text-gray-500">
								{account.account_holder}
							</p>
						</div>
					</button>
				{/each}
			</div>

			<button
				onclick={() => (show_add_account_modal = true)}
				class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-3 text-[14px] text-gray-500"
			>
				<RiAddLine size={16} />
				다른 계좌 추가
			</button>
		{:else}
			<button
				onclick={() => (show_add_account_modal = true)}
				class="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-6 text-center"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50"
				>
					<RiAddLine size={20} class="text-blue-500" />
				</div>
				<p class="mt-2 text-[14px] font-medium text-gray-600">계좌 등록하기</p>
				<p class="mt-1 text-[12px] text-gray-400">
					입금자 확인을 위해 계좌를 등록해주세요
				</p>
			</button>
		{/if}
	</div>

	<!-- 안내 사항 -->
	<div class="mt-2 bg-white px-5 py-5">
		<h3 class="mb-3 font-semibold text-gray-900">안내 사항</h3>
		<ul class="space-y-2 text-sm text-gray-600">
			<li class="flex items-start gap-2">
				<span class="text-gray-400">•</span>
				<span>위 계좌로 입금 후 결제하기 버튼을 눌러주세요.</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-gray-400">•</span>
				<span>결제 완료 후 전문가에게 수락 알림이 전송됩니다.</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-gray-400">•</span>
				<span>입금 확인은 영업일 기준 1주일 내 처리됩니다.</span>
			</li>
		</ul>
	</div>
</main>

<!-- 하단 버튼 -->
<div
	class="fixed bottom-0 w-full max-w-screen-md bg-white px-5 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
>
	<div class="pb-safe flex gap-3">
		<button
			onclick={() => (show_cancel_modal = true)}
			class="btn btn-gray flex-1"
		>
			취소
		</button>
		<button
			onclick={handle_payment}
			disabled={!can_submit || is_processing}
			class="btn btn-primary flex-1"
		>
			{#if is_processing}
				처리 중...
			{:else}
				₩{comma(payment_amount)} 결제하기
			{/if}
		</button>
	</div>
</div>

<ConfirmModal
	bind:is_open={show_cancel_modal}
	title="결제를 취소할까요?"
	description="결제하지 않고 이전 페이지로 돌아갑니다."
	button_2_text="돌아가기"
	button_2_action={handle_cancel}
/>

<AddBankAccountModal
	bind:is_modal_open={show_add_account_modal}
	on_success={handle_account_added}
/>
