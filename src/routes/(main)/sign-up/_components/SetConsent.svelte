<script>
	import { RiCheckLine, RiArrowRightSLine } from 'svelte-remixicon';
	import colors from '$lib/config/colors';

	let {
		agree_terms = $bindable(false),
		agree_privacy = $bindable(false),
		agree_marketing = $bindable(false),
	} = $props();

	// 전체 동의
	let agree_all = $derived(agree_terms && agree_privacy && agree_marketing);

	const toggle_all = () => {
		const new_value = !agree_all;
		agree_terms = new_value;
		agree_privacy = new_value;
		agree_marketing = new_value;
	};
</script>

<div class="mx-4 mt-8">
	<h2 class="text-xl font-bold text-gray-900">서비스 이용약관에<br />동의해주세요</h2>
	<p class="mt-2 text-sm text-gray-500">
		퍼펙트랜서 서비스 이용을 위해 약관 동의가 필요합니다.
	</p>

	<div class="mt-8 space-y-3">
		<!-- 전체 동의 -->
		<button
			onclick={toggle_all}
			class="flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-colors {agree_all
				? 'border-blue-500 bg-blue-50'
				: 'border-gray-200 bg-white'}"
		>
			<div
				class="flex h-6 w-6 items-center justify-center rounded-full transition-colors {agree_all
					? 'bg-blue-500'
					: 'bg-gray-200'}"
			>
				<RiCheckLine size={16} color={agree_all ? 'white' : colors.gray[400]} />
			</div>
			<span class="font-semibold text-gray-900">전체 동의</span>
		</button>

		<div class="h-2"></div>

		<!-- 이용약관 동의 (필수) -->
		<div class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
			<button onclick={() => (agree_terms = !agree_terms)} class="flex flex-1 items-center gap-3">
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full transition-colors {agree_terms
						? 'bg-blue-500'
						: 'bg-gray-300'}"
				>
					<RiCheckLine size={14} color={agree_terms ? 'white' : colors.gray[100]} />
				</div>
				<span class="text-sm text-gray-700">
					<span class="text-blue-500">[필수]</span> 이용약관 동의
				</span>
			</button>
			<a href="/terms" target="_blank" class="p-1">
				<RiArrowRightSLine size={20} color={colors.gray[400]} />
			</a>
		</div>

		<!-- 개인정보처리방침 동의 (필수) -->
		<div class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
			<button
				onclick={() => (agree_privacy = !agree_privacy)}
				class="flex flex-1 items-center gap-3"
			>
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full transition-colors {agree_privacy
						? 'bg-blue-500'
						: 'bg-gray-300'}"
				>
					<RiCheckLine size={14} color={agree_privacy ? 'white' : colors.gray[100]} />
				</div>
				<span class="text-sm text-gray-700">
					<span class="text-blue-500">[필수]</span> 개인정보처리방침 동의
				</span>
			</button>
			<a href="/privacy" target="_blank" class="p-1">
				<RiArrowRightSLine size={20} color={colors.gray[400]} />
			</a>
		</div>

		<!-- 마케팅 정보 수신 동의 (선택) -->
		<div class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
			<button
				onclick={() => (agree_marketing = !agree_marketing)}
				class="flex flex-1 items-center gap-3"
			>
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full transition-colors {agree_marketing
						? 'bg-blue-500'
						: 'bg-gray-300'}"
				>
					<RiCheckLine size={14} color={agree_marketing ? 'white' : colors.gray[100]} />
				</div>
				<span class="text-sm text-gray-700">
					<span class="text-gray-400">[선택]</span> 마케팅 정보 수신 동의
				</span>
			</button>
		</div>

		<p class="px-2 text-xs text-gray-400">
			마케팅 정보 수신에 동의하시면 이벤트, 할인 혜택 등의 정보를 받아보실 수 있습니다.
		</p>
	</div>
</div>
