<script>
	import { goto } from '$app/navigation';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { smart_go_back } from '$lib/utils/navigation';
	import Modal from '$lib/components/ui/Modal.svelte';

	const me = get_user_context();

	let { is_modal_open = $bindable(false) } = $props();

	const go_to_payment_info = () => {
		is_modal_open = false;
		goto(`/@${me.handle}/accounts/contact`);
	};

	const handle_cancel = () => {
		is_modal_open = false;
		smart_go_back();
	};
</script>

<Modal bind:is_modal_open modal_position="center" disable_backdrop_close={true}>
	<div class="p-5">
		<h3 class="text-lg font-semibold text-gray-900">결제 정보를 입력해주세요</h3>
		<p class="mt-2 text-sm text-gray-500">
			서비스를 등록하거나 외주에 지원하려면<br />
			연락처와 정산 계좌 정보가 필요해요.
		</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={handle_cancel}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-700"
			>
				돌아가기
			</button>
			<button
				onclick={go_to_payment_info}
				class="btn-primary flex-1 rounded-lg py-3 text-sm font-medium text-white"
			>
				입력하러 가기
			</button>
		</div>
	</div>
</Modal>
