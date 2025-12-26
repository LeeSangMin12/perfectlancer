<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { comma } from '$lib/utils/common';
	import { optimize_avatar } from '$lib/utils/image';
	import { smart_go_back } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiBookmarkLine,
		RiBriefcaseLine,
		RiContactsLine,
		RiCustomerService2Line,
		RiFileList2Line,
		RiFileTextLine,
		RiGiftLine,
		RiHeartLine,
		RiQuestionnaireLine,
		RiSettings4Line,
		RiShieldUserLine,
		RiShoppingBag3Line,
		RiTeamLine,
		RiWallet3Line,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
</script>

<svelte:head>
	<title>더보기 | 퍼펙트랜서</title>
	<meta
		name="description"
		content="내 프로필, 포인트, 구매 내역, 북마크 등을 관리할 수 있는 문의 더보기 페이지입니다."
	/>
</svelte:head>

<Header>
	{#snippet left()}
		<button class="flex items-center" onclick={smart_go_back}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">더보기</h1>
	{/snippet}
</Header>

<main class="min-h-screen pb-20">
	<!-- 프로필 영역 -->
	<div class="px-4 py-5">
		<a href={`/@${me?.handle}/accounts/profile`} class="flex items-center">
			<img
				src={optimize_avatar(me?.avatar_url)}
				alt="프로필"
				class="h-14 w-14 rounded-full object-cover"
				width="56"
				height="56"
			/>
			<div class="ml-3 flex-1">
				<p class="text-lg font-semibold text-gray-900">
					{me?.name || '사용자'}
				</p>
				<p class="text-sm text-gray-500">@{me?.handle}</p>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>
	</div>

	<!-- 포인트 -->
	<a
		href={`/@${me?.handle}/accounts/point`}
		class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
	>
		<div class="flex items-center">
			<RiWallet3Line size={22} color={colors.primary} class="mr-3" />
			<span class="font-medium text-gray-900">포인트</span>
		</div>
		<div class="flex items-center">
			<span class="mr-1 font-semibold text-blue-600"
				>{comma(me?.point || 0)}원</span
			>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</div>
	</a>

	<!-- 활동 관리 -->
	<div class="bg-gray-50 px-4 py-2">
		<span class="text-sm text-gray-500">활동 관리</span>
	</div>
	<div>
		<a
			href={`/@${me?.handle}/accounts/contact`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiContactsLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>정산 계좌 관리</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/quote-templates`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiFileList2Line size={22} color={colors.gray[600]} class="mr-3" />
				<span>견적서 템플릿</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href="/expert/accounts"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiBriefcaseLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>외주 관리</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/orders`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiShoppingBag3Line size={22} color={colors.gray[600]} class="mr-3" />
				<span>서비스 관리</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/inquiries`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiQuestionnaireLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>문의함</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>
	</div>

	<!-- 저장한 콘텐츠 -->
	<div class="bg-gray-50 px-4 py-2">
		<span class="text-sm text-gray-500">저장한 콘텐츠</span>
	</div>
	<div>
		<a
			href={`/@${me?.handle}/accounts/bookmark?tab=post`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiBookmarkLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>게시글 북마크</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/bookmark?tab=work_request`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiBookmarkLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>외주 북마크</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/like`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiHeartLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>좋아요한 서비스</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/community`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiTeamLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>참여 커뮤니티</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>
	</div>

	<!-- 기타 -->
	<div class="bg-gray-50 px-4 py-2">
		<span class="text-sm text-gray-500">기타</span>
	</div>
	<div>
		<a
			href="/event"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiGiftLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>이벤트</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/support`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiCustomerService2Line
					size={22}
					color={colors.gray[600]}
					class="mr-3"
				/>
				<span>고객센터</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/settings`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiSettings4Line size={22} color={colors.gray[600]} class="mr-3" />
				<span>설정</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href="/terms"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiFileTextLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>이용약관</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href="/privacy"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiShieldUserLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>개인정보처리방침</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>
	</div>
</main>
