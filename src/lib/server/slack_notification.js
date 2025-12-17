/**
 * Slack 웹훅을 통한 관리자 알림 발송
 * 외주 관련 이벤트를 관리자에게 실시간으로 알림
 */

// 환경 변수 - Slack 설정이 없어도 빌드/실행 가능하도록 optional import
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

/**
 * Slack 메시지 전송
 * @param {object} message - Slack Block Kit 형식의 메시지
 * @returns {Promise<boolean>} - 성공 여부
 */
async function send_slack_message(message) {
	if (!SLACK_WEBHOOK_URL) {
		console.warn('⚠️ SLACK_WEBHOOK_URL is not configured');
		return false;
	}

	try {
		const response = await fetch(SLACK_WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			console.error('❌ Slack webhook failed:', response.status, await response.text());
			return false;
		}

		console.log('✅ Slack notification sent');
		return true;
	} catch (error) {
		console.error('❌ Slack notification error:', error);
		return false;
	}
}

/**
 * 외주 공고 등록 요청 알림 (관리자 승인 대기)
 */
export async function notify_work_request_created(work_request, requester) {
	const message = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '📋 새 외주 공고 등록 요청',
					emoji: true,
				},
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*제목:*\n${work_request.title}`,
					},
					{
						type: 'mrkdwn',
						text: `*의뢰인:*\n${requester.name || requester.handle}`,
					},
					{
						type: 'mrkdwn',
						text: `*예산:*\n${work_request.budget?.toLocaleString() || '협의'}원`,
					},
					{
						type: 'mrkdwn',
						text: `*마감일:*\n${work_request.deadline || '미정'}`,
					},
				],
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*설명:*\n${work_request.description?.substring(0, 200) || '내용 없음'}${work_request.description?.length > 200 ? '...' : ''}`,
				},
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							text: '관리자 페이지에서 확인',
							emoji: true,
						},
						url: `${process.env.PUBLIC_BASE_URL || 'https://moonjin.io'}/admin/work-requests`,
						style: 'primary',
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
					},
				],
			},
		],
	};

	return send_slack_message(message);
}

/**
 * 결제 완료 알림 (입금 확인 대기)
 */
export async function notify_payment_submitted(payment, work_request, requester, expert) {
	const message = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '💰 결제 신청 접수',
					emoji: true,
				},
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*외주 제목:*\n${work_request.title}`,
					},
					{
						type: 'mrkdwn',
						text: `*결제 금액:*\n${payment.amount?.toLocaleString()}원`,
					},
					{
						type: 'mrkdwn',
						text: `*의뢰인:*\n${requester.name || requester.handle}`,
					},
					{
						type: 'mrkdwn',
						text: `*전문가:*\n${expert.name || expert.handle}`,
					},
				],
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*입금자명:*\n${payment.depositor_name || '미입력'}`,
				},
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							text: '입금 확인하기',
							emoji: true,
						},
						url: `${process.env.PUBLIC_BASE_URL || 'https://moonjin.io'}/admin/payments`,
						style: 'primary',
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
					},
				],
			},
		],
	};

	return send_slack_message(message);
}

/**
 * 서비스 완료 알림 (정산 처리 필요)
 */
export async function notify_service_completed(work_request, proposal, requester, expert) {
	const payout = Math.floor(proposal.total_price * 0.9); // 10% 수수료 제외

	const message = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '✅ 서비스 완료 - 정산 필요',
					emoji: true,
				},
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*외주 제목:*\n${work_request.title}`,
					},
					{
						type: 'mrkdwn',
						text: `*전문가:*\n${expert.name || expert.handle}`,
					},
					{
						type: 'mrkdwn',
						text: `*결제 금액:*\n${proposal.total_price?.toLocaleString()}원`,
					},
					{
						type: 'mrkdwn',
						text: `*정산 금액:*\n${payout.toLocaleString()}원`,
					},
				],
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							text: '정산 처리하기',
							emoji: true,
						},
						url: `${process.env.PUBLIC_BASE_URL || 'https://moonjin.io'}/admin/payments`,
						style: 'primary',
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
					},
				],
			},
		],
	};

	return send_slack_message(message);
}

/**
 * 자동 완료 알림 (7일 경과)
 */
export async function notify_auto_completed(work_request, proposal, expert) {
	const message = {
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '⏰ 자동 완료 처리됨',
					emoji: true,
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `외주 *${work_request.title}*의 서비스가 7일 경과로 자동 완료 처리되었습니다.`,
				},
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*전문가:*\n${expert.name || expert.handle}`,
					},
					{
						type: 'mrkdwn',
						text: `*정산 금액:*\n${Math.floor(proposal.total_price * 0.9).toLocaleString()}원`,
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
					},
				],
			},
		],
	};

	return send_slack_message(message);
}

/**
 * 일반 알림 메시지 (커스텀)
 */
export async function notify_admin(title, message_text, url = null) {
	const blocks = [
		{
			type: 'header',
			text: {
				type: 'plain_text',
				text: title,
				emoji: true,
			},
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: message_text,
			},
		},
	];

	if (url) {
		blocks.push({
			type: 'actions',
			elements: [
				{
					type: 'button',
					text: {
						type: 'plain_text',
						text: '확인하기',
						emoji: true,
					},
					url,
					style: 'primary',
				},
			],
		});
	}

	blocks.push({
		type: 'context',
		elements: [
			{
				type: 'mrkdwn',
				text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
			},
		],
	});

	return send_slack_message({ blocks });
}
