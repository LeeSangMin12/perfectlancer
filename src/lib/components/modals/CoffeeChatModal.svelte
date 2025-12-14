<script>
	import Modal from '$lib/components/ui/Modal.svelte';

	import { show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { is_open = $bindable(), recipient_user } = $props();

	let form_data = $state({
		email: '',
		subject: '',
		content: '',
	});

	const reset_form = () => {
		form_data = {
			email: '',
			subject: '',
			content: '',
		};
	};

	const handle_submit = async () => {
		if (!form_data.email.trim()) {
			show_toast('error', '이메일 주소를 입력해주세요.');
			return;
		}

		if (!form_data.subject.trim()) {
			show_toast('error', '커피챗 제목을 입력해주세요.');
			return;
		}

		if (!form_data.content.trim()) {
			show_toast('error', '커피챗 내용을 입력해주세요.');
			return;
		}

		// 이메일 형식 검증
		const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email_regex.test(form_data.email)) {
			show_toast('error', '올바른 이메일 형식을 입력해주세요.');
			return;
		}

		try {
			// 커피챗 요청 생성
			const new_coffee_chat = await api.coffee_chats.insert({
				sender_id: me.id,
				recipient_id: recipient_user.id,
				email: form_data.email,
				subject: form_data.subject,
				content: form_data.content,
				status: 'pending',
			});

			// 알림 생성
			try {
				await api.notifications.insert({
					recipient_id: recipient_user.id,
					actor_id: me.id,
					type: 'coffee_chat.requested',
					resource_type: 'coffee_chat',
					resource_id: String(new_coffee_chat.id),
					payload: {
						sender_id: me.id,
						sender_name: me.name,
						sender_handle: me.handle,
						subject: form_data.subject,
					},
					link_url: `/@${recipient_user.handle}/accounts/coffee-chat`,
				});
			} catch (notification_error) {
				// 알림 실패해도 커피챗 요청은 성공으로 처리
			}

			show_toast('success', '커피챗 요청이 성공적으로 전송되었습니다!');
			is_open = false;
			reset_form();
		} catch (error) {
			show_toast('error', '커피챗 요청 전송 중 오류가 발생했습니다.');
		}
	};

	const handle_close = () => {
		is_open = false;
		reset_form();
	};
</script>

<Modal bind:is_modal_open={is_open} modal_position="center">
	<div class="w-full p-6">
		<h2 class="mb-1 text-xl font-bold text-gray-900">
			{recipient_user?.name || '사용자'}님께 커피챗 요청
		</h2>
		<p class="mb-6 text-sm text-gray-500">
			커피챗을 통해 네트워킹하고 소통해보세요.
		</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handle_submit();
			}}
			class="space-y-4"
		>
			<!-- 이메일 주소 -->
			<div>
				<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
					이메일 주소
				</label>
				<input
					id="email"
					type="email"
					bind:value={form_data.email}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
					placeholder="your-email@example.com"
					required
				/>
				<p class="mt-1 text-xs text-gray-500">
					응답을 받을 이메일 주소를 입력해주세요.
				</p>
			</div>

			<!-- 커피챗 제목 -->
			<div>
				<label
					for="subject"
					class="mb-2 block text-sm font-medium text-gray-700"
				>
					커피챗 제목
				</label>
				<input
					id="subject"
					type="text"
					bind:value={form_data.subject}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
					placeholder="예: 마케팅 전략에 대해 이야기하고 싶어요"
					maxlength="100"
					required
				/>
			</div>

			<!-- 커피챗 내용 -->
			<div>
				<label
					for="content"
					class="mb-2 block text-sm font-medium text-gray-700"
				>
					커피챗 내용
				</label>
				<textarea
					id="content"
					bind:value={form_data.content}
					class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
					placeholder="어떤 주제로 대화하고 싶은지, 언제 만나고 싶은지 등을 자세히 적어주세요."
					rows="4"
					maxlength="1000"
					required
				></textarea>
				<div class="mt-1 flex justify-between text-xs text-gray-500">
					<span>구체적으로 작성할수록 좋은 응답을 받을 수 있어요.</span>
					<span>{form_data.content.length}/1000</span>
				</div>
			</div>
		</form>
	</div>

	<!-- 하단 버튼 -->
	<div class="flex">
		<button
			type="button"
			onclick={handle_close}
			class="flex-1 py-3 text-gray-600 transition-colors hover:bg-gray-50"
		>
			취소
		</button>
		<button
			type="button"
			onclick={handle_submit}
			class="flex-1 bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600"
		>
			커피챗 요청하기
		</button>
	</div>
</Modal>
