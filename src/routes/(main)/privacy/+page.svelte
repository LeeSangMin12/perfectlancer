<script>
	import colors from '$lib/config/colors';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import Header from '$lib/components/ui/Header.svelte';
</script>

<svelte:head>
	<title>개인정보처리방침 | 퍼펙트랜서</title>
</svelte:head>

<Header>
	{#snippet left()}
		<button onclick={smart_go_back}>
			<RiArrowLeftSLine size={26} color={colors.gray[600]} />
		</button>
	{/snippet}
	{#snippet center()}
		<h1 class="font-semibold">개인정보처리방침</h1>
	{/snippet}
</Header>

<main class="bg-white px-5 py-6">
	<div class="prose prose-sm max-w-none text-gray-700">
		<p class="text-xs text-gray-400 mb-6">시행일: 2024년 12월 24일</p>

		<p class="mb-6">
			퓨처밴스(이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
		</p>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제1조 (개인정보의 처리 목적)</h2>
			<p class="mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
			<ol class="list-decimal pl-5 space-y-2">
				<li><strong>회원가입 및 관리</strong>: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적</li>
				<li><strong>서비스 제공</strong>: 전문가-클라이언트 매칭 서비스, 콘텐츠 제공, 맞춤서비스 제공, 본인인증 목적</li>
				<li><strong>결제 및 정산</strong>: 서비스 이용료 결제, 전문가 정산, 환불 처리 목적</li>
				<li><strong>마케팅 및 광고</strong>: 이벤트 및 광고성 정보 제공, 서비스 이용 통계 분석 목적 (별도 동의 시)</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제2조 (수집하는 개인정보 항목)</h2>
			<p class="mb-3">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>

			<div class="overflow-x-auto">
				<table class="w-full text-sm border-collapse border border-gray-200 mb-4">
					<thead>
						<tr class="bg-gray-50">
							<th class="border border-gray-200 px-3 py-2 text-left">수집 시점</th>
							<th class="border border-gray-200 px-3 py-2 text-left">필수 항목</th>
							<th class="border border-gray-200 px-3 py-2 text-left">선택 항목</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="border border-gray-200 px-3 py-2">회원가입</td>
							<td class="border border-gray-200 px-3 py-2">이름, 이메일, 전화번호, 성별, 생년월일, 아이디(핸들)</td>
							<td class="border border-gray-200 px-3 py-2">프로필 사진</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">카카오 로그인</td>
							<td class="border border-gray-200 px-3 py-2">카카오 계정 정보(이름, 이메일, 프로필 이미지)</td>
							<td class="border border-gray-200 px-3 py-2">-</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">서비스 이용</td>
							<td class="border border-gray-200 px-3 py-2">서비스 이용기록, 접속 로그, 접속 IP, 쿠키</td>
							<td class="border border-gray-200 px-3 py-2">-</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">정산 신청</td>
							<td class="border border-gray-200 px-3 py-2">계좌번호, 예금주명, 은행명</td>
							<td class="border border-gray-200 px-3 py-2">-</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제3조 (개인정보의 처리 및 보유 기간)</h2>
			<p class="mb-3">회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>

			<div class="overflow-x-auto">
				<table class="w-full text-sm border-collapse border border-gray-200 mb-4">
					<thead>
						<tr class="bg-gray-50">
							<th class="border border-gray-200 px-3 py-2 text-left">보유 정보</th>
							<th class="border border-gray-200 px-3 py-2 text-left">보유 기간</th>
							<th class="border border-gray-200 px-3 py-2 text-left">근거 법령</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="border border-gray-200 px-3 py-2">회원 정보</td>
							<td class="border border-gray-200 px-3 py-2">회원 탈퇴 시까지</td>
							<td class="border border-gray-200 px-3 py-2">-</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">계약 또는 청약철회 기록</td>
							<td class="border border-gray-200 px-3 py-2">5년</td>
							<td class="border border-gray-200 px-3 py-2">전자상거래법</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">대금결제 및 재화 공급 기록</td>
							<td class="border border-gray-200 px-3 py-2">5년</td>
							<td class="border border-gray-200 px-3 py-2">전자상거래법</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">소비자 불만 또는 분쟁처리 기록</td>
							<td class="border border-gray-200 px-3 py-2">3년</td>
							<td class="border border-gray-200 px-3 py-2">전자상거래법</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">웹사이트 방문 기록</td>
							<td class="border border-gray-200 px-3 py-2">3개월</td>
							<td class="border border-gray-200 px-3 py-2">통신비밀보호법</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
			<p class="mb-3">회사는 원칙적으로 정보주체의 개인정보를 제1조에서 명시한 목적 범위 내에서 처리하며, 정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</p>
			<p>다만, 다음의 경우에는 예외로 합니다.</p>
			<ul class="list-disc pl-5 space-y-1 mt-2">
				<li>정보주체로부터 별도의 동의를 받은 경우</li>
				<li>법률에 특별한 규정이 있는 경우</li>
				<li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제5조 (개인정보 처리의 위탁)</h2>
			<p class="mb-3">회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>

			<div class="overflow-x-auto">
				<table class="w-full text-sm border-collapse border border-gray-200 mb-4">
					<thead>
						<tr class="bg-gray-50">
							<th class="border border-gray-200 px-3 py-2 text-left">수탁업체</th>
							<th class="border border-gray-200 px-3 py-2 text-left">위탁 업무</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="border border-gray-200 px-3 py-2">카카오</td>
							<td class="border border-gray-200 px-3 py-2">소셜 로그인 서비스</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">Supabase</td>
							<td class="border border-gray-200 px-3 py-2">데이터베이스 및 인증 서비스</td>
						</tr>
						<tr>
							<td class="border border-gray-200 px-3 py-2">Vercel</td>
							<td class="border border-gray-200 px-3 py-2">웹 호스팅 서비스</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
			<p class="mb-3">정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
			<ol class="list-decimal pl-5 space-y-2">
				<li>개인정보 열람 요구</li>
				<li>오류 등이 있을 경우 정정 요구</li>
				<li>삭제 요구</li>
				<li>처리정지 요구</li>
			</ol>
			<p class="mt-3">권리 행사는 회사에 대해 서면, 전화, 이메일 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제7조 (개인정보의 파기)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
				<li>파기 절차: 불필요한 개인정보는 개인정보보호책임자의 승인을 받아 파기합니다.</li>
				<li>파기 방법: 전자적 파일 형태의 정보는 복구가 불가능한 방법으로 파기하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제8조 (개인정보의 안전성 확보 조치)</h2>
			<p class="mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
			<ol class="list-decimal pl-5 space-y-2">
				<li><strong>관리적 조치</strong>: 내부관리계획 수립·시행, 개인정보 취급자 지정 최소화</li>
				<li><strong>기술적 조치</strong>: 개인정보처리시스템 접근권한 관리, 접근통제시스템 설치, 개인정보의 암호화, 보안프로그램 설치</li>
				<li><strong>물리적 조치</strong>: 전산실, 자료보관실 등의 접근통제</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제9조 (쿠키의 사용)</h2>
			<ol class="list-decimal pl-5 space-y-2">
				<li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
				<li>쿠키는 웹사이트가 이용자의 컴퓨터 브라우저로 전송하는 소량의 정보입니다.</li>
				<li>이용자는 웹브라우저의 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제10조 (개인정보 보호책임자)</h2>
			<p class="mb-3">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>

			<div class="p-4 bg-gray-50 rounded-lg">
				<p class="font-semibold text-gray-800 mb-2">개인정보 보호책임자</p>
				<p>성명: 이상민</p>
				<p>직책: 대표</p>
				<p>연락처: 070-8018-6194</p>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제11조 (개인정보 열람청구)</h2>
			<p class="mb-3">정보주체는 개인정보 보호법 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다.</p>
			<p>회사는 정보주체의 개인정보 열람청구가 신속하게 처리되도록 노력하겠습니다.</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-gray-900 mb-3">제12조 (권익침해 구제방법)</h2>
			<p class="mb-3">정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해구제, 상담 등을 문의하실 수 있습니다.</p>

			<div class="space-y-3 text-sm">
				<div class="p-3 bg-gray-50 rounded">
					<p class="font-semibold">개인정보 침해신고센터 (한국인터넷진흥원 운영)</p>
					<p>전화: (국번없이) 118</p>
					<p>홈페이지: privacy.kisa.or.kr</p>
				</div>
				<div class="p-3 bg-gray-50 rounded">
					<p class="font-semibold">개인정보 분쟁조정위원회</p>
					<p>전화: (국번없이) 1833-6972</p>
					<p>홈페이지: www.kopico.go.kr</p>
				</div>
				<div class="p-3 bg-gray-50 rounded">
					<p class="font-semibold">대검찰청 사이버수사과</p>
					<p>전화: (국번없이) 1301</p>
					<p>홈페이지: www.spo.go.kr</p>
				</div>
				<div class="p-3 bg-gray-50 rounded">
					<p class="font-semibold">경찰청 사이버안전국</p>
					<p>전화: (국번없이) 182</p>
					<p>홈페이지: cyberbureau.police.go.kr</p>
				</div>
			</div>
		</section>

		<section class="mb-8 pb-10">
			<h2 class="text-lg font-bold text-gray-900 mb-3">부칙</h2>
			<p>본 개인정보처리방침은 2024년 12월 24일부터 적용됩니다.</p>

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
