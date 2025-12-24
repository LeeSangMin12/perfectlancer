<script>
	import colors from '$lib/config/colors';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import Header from '$lib/components/ui/Header.svelte';
</script>

<svelte:head>
	<title>이용약관 | 퍼펙트랜서</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">이용약관</h1>
	{/snippet}
</Header>

<main class="bg-white px-5 py-6">
	<div class="prose prose-sm max-w-none text-gray-700">
		<p class="text-xs text-gray-400 mb-6">시행일: 2024년 12월 24일</p>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제1조 (목적)</h2>
			<p>
				본 약관은 퓨처밴스(이하 "회사")가 운영하는 퍼펙트랜서 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제2조 (정의)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>"서비스"란 회사가 제공하는 전문가-클라이언트 매칭 플랫폼으로, 외주 프로젝트 의뢰, 전문 서비스 등록 및 거래, 채용 연결 등의 기능을 포함합니다.</li>
				<li>"회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.</li>
				<li>"전문가"란 서비스를 통해 자신의 전문 서비스를 등록하고 판매하는 회원을 말합니다.</li>
				<li>"의뢰인"이란 서비스를 통해 전문가에게 서비스를 의뢰하거나 구매하는 회원을 말합니다.</li>
				<li>"포인트"란 서비스 내에서 결제 및 거래에 사용되는 가상의 결제 수단을 말합니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
				<li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
				<li>약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 서비스 내 공지사항을 통해 공지합니다.</li>
				<li>회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제4조 (회원가입)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회원가입은 이용자가 본 약관에 동의하고, 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 회사가 이를 승낙함으로써 체결됩니다.</li>
				<li>회사는 다음 각 호에 해당하는 경우 회원가입을 거부하거나 사후에 이용계약을 해지할 수 있습니다.
					<ul class="list-disc pl-5 mt-2 space-y-1">
						<li>타인의 정보를 도용한 경우</li>
						<li>허위 정보를 기재한 경우</li>
						<li>회사가 정한 가입 요건을 충족하지 못한 경우</li>
						<li>기타 회원으로 등록하는 것이 서비스 운영에 현저히 지장이 있다고 판단되는 경우</li>
					</ul>
				</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제5조 (서비스의 제공)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회사는 다음과 같은 서비스를 제공합니다.
					<ul class="list-disc pl-5 mt-2 space-y-1">
						<li>전문가 서비스 등록 및 판매 중개</li>
						<li>외주 프로젝트 의뢰 및 매칭</li>
						<li>회원 간 소통 기능 (채팅, 문의 등)</li>
						<li>결제 및 정산 서비스</li>
						<li>기타 회사가 정하는 서비스</li>
					</ul>
				</li>
				<li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검 등의 사유로 일시적으로 중단될 수 있습니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제6조 (서비스 이용료 및 수수료)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회사는 서비스 이용에 대하여 거래 금액의 5%를 수수료로 부과합니다.</li>
				<li>수수료는 거래 완료 시 정산 금액에서 자동으로 차감됩니다.</li>
				<li>수수료율은 회사 정책에 따라 변경될 수 있으며, 변경 시 사전에 공지합니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제7조 (결제 및 환불)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>서비스 내 결제는 계좌이체 방식으로 진행됩니다.</li>
				<li>환불은 다음 기준에 따라 처리됩니다.
					<ul class="list-disc pl-5 mt-2 space-y-1">
						<li>작업 시작 전: 결제 금액 전액 환불</li>
						<li>작업 진행 중: 진행률에 따라 협의 후 부분 환불</li>
						<li>작업 완료 후: 환불 불가 (단, 결과물에 하자가 있는 경우 협의)</li>
					</ul>
				</li>
				<li>환불 요청은 고객센터를 통해 접수하며, 처리 기간은 영업일 기준 7일 이내입니다.</li>
				<li>회원 간 분쟁 발생 시 회사는 중재 역할을 수행하며, 최종 결정은 관련 법령에 따릅니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제8조 (회원의 의무)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회원은 다음 행위를 하여서는 안 됩니다.
					<ul class="list-disc pl-5 mt-2 space-y-1">
						<li>타인의 정보 도용 또는 허위 정보 등록</li>
						<li>서비스를 이용한 불법 행위</li>
						<li>회사 또는 제3자의 지식재산권 침해</li>
						<li>회사 또는 제3자의 명예를 손상시키는 행위</li>
						<li>서비스의 안정적 운영을 방해하는 행위</li>
						<li>직거래 유도 등 플랫폼을 우회하는 거래 행위</li>
						<li>기타 관련 법령 및 본 약관에서 금지하는 행위</li>
					</ul>
				</li>
				<li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 이를 제3자에게 양도하거나 대여할 수 없습니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제9조 (서비스 등록 및 승인)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>전문가가 등록한 서비스는 회사의 승인 절차를 거쳐 공개됩니다.</li>
				<li>회사는 다음의 경우 서비스 등록을 거부하거나 삭제할 수 있습니다.
					<ul class="list-disc pl-5 mt-2 space-y-1">
						<li>법령에 위반되는 내용이 포함된 경우</li>
						<li>허위 또는 과장된 내용이 포함된 경우</li>
						<li>타인의 권리를 침해하는 경우</li>
						<li>서비스 품질 기준에 부합하지 않는 경우</li>
					</ul>
				</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제10조 (지식재산권)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>서비스 내 회사가 제작한 콘텐츠에 대한 저작권은 회사에 귀속됩니다.</li>
				<li>회원이 서비스 내에 게시한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다.</li>
				<li>거래를 통해 생성된 결과물의 저작권은 별도 합의가 없는 한 의뢰인에게 귀속됩니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제11조 (면책조항)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회사는 회원 간 거래에서 발생하는 분쟁에 대해 중개자로서의 역할만을 수행하며, 거래 당사자 간의 분쟁에 대해 직접적인 책임을 지지 않습니다.</li>
				<li>회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
				<li>회사는 회원이 게시한 정보의 정확성, 신뢰성에 대해 보증하지 않습니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제12조 (서비스 이용의 제한 및 해지)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회사는 회원이 본 약관을 위반한 경우 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.</li>
				<li>회원은 언제든지 서비스 내 탈퇴 기능을 통해 이용계약을 해지할 수 있습니다.</li>
				<li>탈퇴 시 회원의 개인정보는 관련 법령에서 정한 기간 동안 보관 후 파기됩니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제13조 (분쟁해결)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>본 약관과 관련하여 분쟁이 발생한 경우 회사와 회원은 상호 협의하여 해결합니다.</li>
				<li>협의가 이루어지지 않는 경우 관할 법원은 회사 소재지의 법원으로 합니다.</li>
			</ol>
		</section>

		<section class="mb-8 pb-10">
			<h2 class="text-lg font-bold text-gray-900 mb-3">부칙</h2>
			<p>본 약관은 2024년 12월 24일부터 시행됩니다.</p>
			<div class="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
				<p class="font-semibold text-gray-800 mb-2">퓨처밴스</p>
				<p>대표: 이상민</p>
				<p>사업자등록번호: 507-06-34662</p>
				<p>주소: 부산시 수영구 수영로 642번길 28, 2층 1호</p>
				<p>고객센터: 070-8018-6194</p>
			</div>
		</section>
	</div>
</main>
