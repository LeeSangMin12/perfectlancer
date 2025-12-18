<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiTimeLine, RiMailLine, RiQuestionnaireLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { optimize_avatar } from '$lib/utils/image';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	const tabs = ['받은 문의', '보낸 문의'];
	let selected_tab = $state(0);
	let received_inquiries = $state(data.received_inquiries || []);
	let sent_inquiries = $state(data.sent_inquiries || []);

	onMount(async () => {
		// 서버에서 이미 데이터를 받았으므로 추가 로딩은 필요시에만
		if (received_inquiries.length === 0 && sent_inquiries.length === 0) {
			await load_inquiries();
		}
	});

	const load_inquiries = async () => {
		try {
			if (me?.id) {
				const [received, sent] = await Promise.all([
					api.inquiries.select_received(me.id),
					api.inquiries.select_sent(me.id)
				]);
				received_inquiries = received;
				sent_inquiries = sent;
			}
		} catch (error) {
			console.error('Error loading inquiries:', error);
			show_toast('error', '문의를 불러오는데 실패했습니다.');
		}
	};

	const get_status_text = (status) => {
		const status_map = {
			pending: '대기중',
			accepted: '수락됨',
			rejected: '거절됨'
		};
		return status_map[status] || status;
	};

	const get_status_color = (status) => {
		const color_map = {
			pending: 'text-yellow-600 bg-yellow-100',
			accepted: 'text-green-600 bg-green-100',
			rejected: 'text-red-600 bg-red-100'
		};
		return color_map[status] || 'text-gray-600 bg-gray-100';
	};

	const format_date = (date_string) => {
		return new Date(date_string).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const go_to_profile = (handle) => {
		goto(`/@${handle}`);
	};
</script>

<svelte:head>
	<title>문의함 | 문</title>
	<meta
		name="description"
		content="받은 문의와 보낸 문의를 확인하고 관리할 수 있습니다."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button class="flex items-center" onclick={() => goto(`/@${me?.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">문의함</h1>
	{/snippet}
</Header>

<main>
	<div class="px-4 py-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	{#if selected_tab === 0}
		<!-- 받은 문의 -->
		<div class="px-4 pb-20">
			{#if received_inquiries.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 rounded-full bg-gray-100 p-4">
						<RiQuestionnaireLine size={48} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 받은 문의가 없어요
					</h3>
					<p class="text-sm text-gray-500">
						다른 사용자가 문의하면 여기에 표시됩니다.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each received_inquiries as inquiry}
						<div class="rounded-xl border border-gray-200 bg-white p-5">
							<!-- 헤더: 보낸 사람 정보와 상태 -->
							<div class="mb-4 flex items-center justify-between">
								<button
									class="flex items-center space-x-3"
									onclick={() => go_to_profile(inquiry.sender.handle)}
								>
									<img
										src={optimize_avatar(inquiry.sender.avatar_url)}
										alt={inquiry.sender.name}
										class="h-10 w-10 rounded-full object-cover"
										loading="lazy"
										width="40"
										height="40"
									/>
									<div class="text-left">
										<p class="font-medium text-gray-900">{inquiry.sender.name}</p>
										<p class="text-sm text-gray-500">@{inquiry.sender.handle}</p>
									</div>
								</button>
								<span class={`rounded-full px-3 py-1 text-xs font-medium ${get_status_color(inquiry.status)}`}>
									{get_status_text(inquiry.status)}
								</span>
							</div>

							<!-- 문의 내용 -->
							<div class="mb-4">
								<h3 class="mb-2 font-semibold text-gray-900">{inquiry.subject}</h3>
								<p class="text-sm leading-relaxed text-gray-600">{inquiry.content}</p>
							</div>

							<!-- 이메일 정보 -->
							<div class="mb-4 flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
								<RiMailLine size={16} color={colors.gray[500]} />
								<span class="text-sm text-gray-600">{inquiry.email}</span>
							</div>

							<!-- 하단: 날짜와 액션 버튼 -->
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2 text-xs text-gray-500">
									<RiTimeLine size={14} />
									<span>{format_date(inquiry.created_at)}</span>
								</div>

								{#if inquiry.status === 'pending'}
									<div class="flex space-x-2">
										<button
											class="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
											onclick={async () => {
												try {
													await api.inquiries.update_status(inquiry.id, 'accepted');

													// 수락 알림 생성
													try {
														await api.notifications.insert({
															recipient_id: inquiry.sender.id,
															actor_id: me.id,
															type: 'inquiry.accepted',
															resource_type: 'inquiry',
															resource_id: String(inquiry.id),
															payload: {
																recipient_id: me.id,
																recipient_name: me.name,
																recipient_handle: me.handle,
																subject: inquiry.subject
															},
															link_url: `/@${me.handle}/accounts/inquiries`
														});
													} catch (notification_error) {
														console.error('Failed to create acceptance notification:', notification_error);
													}

													await load_inquiries();
													show_toast('success', '문의를 수락했습니다.');
												} catch (error) {
													show_toast('error', '오류가 발생했습니다.');
												}
											}}
										>
											수락
										</button>
										<button
											class="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
											onclick={async () => {
												try {
													await api.inquiries.update_status(inquiry.id, 'rejected');

													// 거절 알림 생성
													try {
														await api.notifications.insert({
															recipient_id: inquiry.sender.id,
															actor_id: me.id,
															type: 'inquiry.rejected',
															resource_type: 'inquiry',
															resource_id: String(inquiry.id),
															payload: {
																recipient_id: me.id,
																recipient_name: me.name,
																recipient_handle: me.handle,
																subject: inquiry.subject
															},
															link_url: `/@${me.handle}/accounts/inquiries`
														});
													} catch (notification_error) {
														console.error('Failed to create rejection notification:', notification_error);
													}

													await load_inquiries();
													show_toast('success', '문의를 거절했습니다.');
												} catch (error) {
													show_toast('error', '오류가 발생했습니다.');
												}
											}}
										>
											거절
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- 보낸 문의 -->
		<div class="px-4 pb-20">
			{#if sent_inquiries.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 rounded-full bg-gray-100 p-4">
						<RiQuestionnaireLine size={48} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 보낸 문의가 없어요
					</h3>
					<p class="text-sm text-gray-500">
						다른 사용자에게 문의해보세요!
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each sent_inquiries as inquiry}
						<div class="rounded-xl border border-gray-200 bg-white p-5">
							<!-- 헤더: 받는 사람 정보와 상태 -->
							<div class="mb-4 flex items-center justify-between">
								<button
									class="flex items-center space-x-3"
									onclick={() => go_to_profile(inquiry.recipient.handle)}
								>
									<img
										src={optimize_avatar(inquiry.recipient.avatar_url)}
										alt={inquiry.recipient.name}
										class="h-10 w-10 rounded-full object-cover"
										loading="lazy"
										width="40"
										height="40"
									/>
									<div class="text-left">
										<p class="font-medium text-gray-900">{inquiry.recipient.name}</p>
										<p class="text-sm text-gray-500">@{inquiry.recipient.handle}</p>
									</div>
								</button>
								<span class={`rounded-full px-3 py-1 text-xs font-medium ${get_status_color(inquiry.status)}`}>
									{get_status_text(inquiry.status)}
								</span>
							</div>

							<!-- 문의 내용 -->
							<div class="mb-4">
								<h3 class="mb-2 font-semibold text-gray-900">{inquiry.subject}</h3>
								<p class="text-sm leading-relaxed text-gray-600">{inquiry.content}</p>
							</div>

							<!-- 이메일 정보 -->
							<div class="mb-4 flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
								<RiMailLine size={16} color={colors.gray[500]} />
								<span class="text-sm text-gray-600">{inquiry.email}</span>
							</div>

							<!-- 하단: 날짜 -->
							<div class="flex items-center space-x-2 text-xs text-gray-500">
								<RiTimeLine size={14} />
								<span>{format_date(inquiry.created_at)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</main>
