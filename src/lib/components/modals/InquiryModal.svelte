<script>
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';

	import Modal from '$lib/components/ui/Modal.svelte';

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
			show_toast('error', '문의 제목을 입력해주세요.');
			return;
		}

		if (!form_data.content.trim()) {
			show_toast('error', '문의 내용을 입력해주세요.');
			return;
		}

		// 이메일 형식 검증
		const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email_regex.test(form_data.email)) {
			show_toast('error', '올바른 이메일 형식을 입력해주세요.');
			return;
		}

		try {
			// 문의 생성
			const new_inquiry = await api.inquiries.insert({
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
					type: 'inquiry.requested',
					resource_type: 'inquiry',
					resource_id: String(new_inquiry.id),
					payload: {
						sender_id: me.id,
						sender_name: me.name,
						sender_handle: me.handle,
						subject: form_data.subject,
					},
					link_url: `/@${recipient_user.handle}/accounts/inquiries`,
				});
			} catch (notification_error) {
				// 알림 실패해도 문의는 성공으로 처리
			}

			show_toast('success', '문의가 성공적으로 전송되었습니다!');
			is_open = false;
			reset_form();
		} catch (error) {
			show_toast('error', '문의 전송 중 오류가 발생했습니다.');
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
			{recipient_user?.name || '사용자'}님께 문의하기
		</h2>
		<p class="mb-6 text-sm text-gray-500">
			궁금한 점이나 협업 제안을 보내보세요.
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
			</div>

			<!-- 문의 제목 -->
			<div>
				<label
					for="subject"
					class="mb-2 block text-sm font-medium text-gray-700"
				>
					문의 제목
				</label>
				<input
					id="subject"
					type="text"
					bind:value={form_data.subject}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
					placeholder="예: 프로젝트 협업 문의드립니다"
					maxlength="100"
					required
				/>
			</div>

			<!-- 문의 내용 -->
			<div>
				<label
					for="content"
					class="mb-2 block text-sm font-medium text-gray-700"
				>
					문의 내용
				</label>
				<textarea
					id="content"
					bind:value={form_data.content}
					class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
					placeholder="문의하실 내용을 자세히 적어주세요."
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

		<div class="mt-8 flex gap-3">
			<button class="btn btn-gray flex-1" onclick={handle_close}> 취소</button>
			<button class="btn btn-primary flex-1" onclick={handle_submit}
				>문의하기</button
			>
		</div>
	</div>
</Modal>
