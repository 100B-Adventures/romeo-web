import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 - Romeo & Cupid',
  description: 'Romeo & Cupid 프리미엄 매칭 서비스 개인정보처리방침',
};

// 개인정보처리방침 정적 페이지 (앱스토어/플레이스토어 제출용)
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">개인정보처리방침</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-8">최종 수정일: 2026년 10월 12일 (문자 인증·출생연도 자기신고 및 제3자 AI 처리 고지 반영)</p>

      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <p>
            PostAGI(이하 &quot;회사&quot;)는 Romeo &amp; Cupid(이하 &quot;서비스&quot;) 이용자의 개인정보를
            소중히 여기며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등
            관련 법령을 준수합니다. 본 개인정보처리방침은 이용자의 개인정보가 어떻게 수집, 이용,
            보관, 파기되는지를 안내합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">1. 수집하는 개인정보</h2>
          <p className="mb-3">회사는 서비스 제공을 위해 아래의 개인정보를 수집합니다.</p>

          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">가. 필수 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li><strong>회원가입:</strong> 전화번호, 성별, 출생연도, 만 19세 이상 자기신고, 닉네임</li>
            <li><strong>전화번호 확인:</strong> 전화번호 (문자 인증번호 발송용)</li>
          </ul>

          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">나. 선택 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li><strong>프로필 정보:</strong> 키, 체형, 직업, 학교, 종교, 흡연/음주 여부, 자기소개, 성격, 취미, MBTI</li>
            <li><strong>프로필 사진:</strong> 얼굴 사진, 전신 사진 등 (AWS S3에 암호화 저장)</li>
            <li><strong>매칭 선호도:</strong> 선호 연령대, 선호 지역, 선호 체형 등</li>
          </ul>

          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">다. 인증 서류 (선택, R21 Cupid 컨셉 — 민감정보)</h3>
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">
            ※ 「개인정보 보호법」 제23조 민감정보 — 별도 동의 후 KMS 암호화 저장, admin 권한만 접근 가능. 운영자 검토 후 30일 자동 파기.
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li><strong>학력인증 서류</strong> (졸업증명서·재학증명서 등)</li>
            <li><strong>직장인증 서류</strong> (재직증명서·사업자등록증 등)</li>
            <li><strong>자산인증 서류</strong> (예금잔액증명서·부동산등기부등본·금융자산명세 등)</li>
            <li><strong>소득인증 서류</strong> (원천징수영수증·소득금액증명원·근로소득원천징수영수증 등)</li>
            <li>신원인증 서류 (신분증 등) — Phase 2 도입 검토</li>
          </ul>
          <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
            인증 서류는 별도 격리된 AWS S3 버킷(<code>postagi-verification</code>, KMS Customer-Managed Key 암호화)에 저장되며,
            운영자(관리자) 권한 외에는 접근이 불가능합니다. 검토 후 30일 이내 자동 파기됩니다.
          </p>

          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">라. 결제 정보</h3>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>결제 수단 정보 (Toss Payments를 통해 처리, 회사는 카드번호 등을 직접 저장하지 않음)</li>
            <li>결제 내역 (충전 금액, 충전 일시, 결제 상태)</li>
          </ul>

          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">마. 자동 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 이용 기록, 접속 로그, IP 주소</li>
            <li>기기 정보 (OS 종류, 기기 모델, 앱 버전)</li>
            <li>쿠키, 세션 정보</li>
            <li>푸시 알림 토큰 (FCM)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">2. 개인정보 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>회원 관리:</strong> 회원가입, 전화번호 확인, 성인 이용 자격 판단, 부정 이용 방지, 회원 탈퇴 처리</li>
            <li><strong>매칭 서비스 제공:</strong> 규칙 기반 프로필 추천, 선택적 동의 시 제3자 AI를 이용한 후보 선정 보조와 추천 이유 생성</li>
            <li><strong>나이 기반 기능:</strong> 나이 표시, 선호 연령 조건 적용, 추천 후보 필터링</li>
            <li><strong>커뮤니케이션:</strong> 실시간 채팅, 매칭 알림, 서비스 공지사항 전달</li>
            <li><strong>인증 뱃지 발급:</strong> 프로필 인증(신원/학력/소득/직업/거주지) 심사 및 뱃지 부여</li>
            <li><strong>결제 처리:</strong> 하트 충전, 결제 확인, 환불 처리</li>
            <li><strong>안전 관리:</strong> 부정 이용 탐지, 신고 처리, 차단 관리</li>
            <li><strong>서비스 개선:</strong> 이용 통계 분석, 서비스 품질 향상, 신규 기능 개발</li>
            <li><strong>고객 지원:</strong> 문의 응대, 분쟁 해결</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">3. 개인정보 보유 및 이용 기간</h2>
          <p className="mb-2">
            회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            다만, 관련 법령에 의하여 보존할 필요가 있는 경우 아래와 같이 일정 기간 보존합니다.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>회원 정보:</strong> 출생연도를 포함한 프로필 정보는 회원 탈퇴 시 즉시 파기 (단, 부정 이용 방지를 위해 탈퇴 후 30일간 전화번호 해시값 보관)</li>
            <li><strong>결제 기록:</strong> 전자상거래 등에서의 소비자보호에 관한 법률에 따라 <strong>5년</strong> 보존
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              </ul>
            </li>
            <li><strong>접속 로그:</strong> 통신비밀보호법에 따라 <strong>3개월</strong> 보존</li>
            <li><strong>인증 서류:</strong> 인증 승인/반려 후 <strong>30일</strong> 이내 파기</li>
            <li><strong>프로필 사진:</strong> 회원 탈퇴 시 S3 저장소에서 즉시 삭제</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">4. 개인정보의 제3자 제공</h2>
          <p className="mb-2">
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 아래의 경우에는 예외로 합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>

          <h3 className="font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200">개인정보 처리 위탁</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs mt-2">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700">
                  <th className="text-left py-2 pr-4">수탁업체</th>
                  <th className="text-left py-2 pr-4">위탁 업무</th>
                  <th className="text-left py-2">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-2 pr-4">토스페이먼츠</td>
                  <td className="py-2 pr-4">결제 처리</td>
                  <td className="py-2">위탁 계약 종료 시</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-2 pr-4">Amazon Web Services</td>
                  <td className="py-2 pr-4">클라우드 서버 운영, 파일 저장 (S3)</td>
                  <td className="py-2">위탁 계약 종료 시</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-2 pr-4">Google (Firebase)</td>
                  <td className="py-2 pr-4">푸시 알림 발송 (FCM)</td>
                  <td className="py-2">위탁 계약 종료 시</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">5. 제3자 AI 추천을 위한 국외 처리</h2>
          <p className="mb-3">
            회사는 이용자가 별도로 동의한 경우에만 오늘의 후보 선정과 추천 이유 생성을 보조하기 위해
            아래 정보를 OpenAI, L.L.C.의 API로 전송합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">제공받는 자</th><td className="py-2">OpenAI, L.L.C.</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">이전받는 자 연락처</th><td className="py-2"><a className="underline" href="https://privacy.openai.com/">privacy.openai.com</a> / <a className="underline" href="mailto:dsar@openai.com">dsar@openai.com</a></td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">이전 국가</th><td className="py-2">미국 등 OpenAI의 처리 지역</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">이전 일시·방법</th><td className="py-2">동의 후 하루 추천 생성 시 암호화된 HTTPS API로 전송</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">전송 항목</th><td className="py-2">공통 취미, 생활권, MBTI, 결혼 계획, 자녀 계획, 음주, 흡연</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">이용 목적</th><td className="py-2">회원이 추천을 받을 때와 다른 회원의 후보로 검토될 때 후보 선정 보조와 추천 이유 생성</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><th className="py-2 pr-4 text-left">보유 기간</th><td className="py-2">표준 API 입력·출력은 최대 30일 후 삭제. 법적·안전상 예외가 있을 수 있음</td></tr>
                <tr><th className="py-2 pr-4 text-left">학습 이용</th><td className="py-2">API 입력·출력은 기본적으로 OpenAI 모델 학습에 사용되지 않음</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-medium text-gray-900 dark:text-gray-100">
            이름, 연락처, 사진, 정확한 위치, 직장·회사, 소득·자산, 인증 자료, 종교는 OpenAI에 전송하지 않습니다.
          </p>
          <p className="mt-3">
            장애 대응으로 제공자가 Anthropic PBC로 전환되면 동의 화면에 별도 제공자와 고지 버전을 표시하며,
            해당 동의가 없으면 외부 전송하지 않습니다.
          </p>
          <p className="mt-3">
            동의를 거부하거나 철회해도 규칙 기반 추천을 계속 이용할 수 있습니다. 설정 &gt; AI 추천 정보 처리에서
            현재 동의 상태와 고지 버전을 확인하고 언제든 철회할 수 있습니다. 철회 시 오늘 이미 받은 추천은 유지되고,
            다음 추천부터 규칙 기반으로 제공됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">6. 개인정보의 안전성 확보 조치</h2>
          <p className="mb-2">회사는 이용자의 개인정보를 안전하게 관리하기 위하여 다음과 같은 조치를 취하고 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>전화번호 해시 처리:</strong> 전화번호는 해시 처리(SHA-256 + 솔트)하여 저장하며, 원본은 보관하지 않습니다.</li>
            <li><strong>연락처 암호화:</strong> 매칭 후 공유되는 연락처 정보는 AES 암호화하여 저장합니다.</li>
            <li><strong>비밀번호 암호화:</strong> BCrypt 단방향 해시 알고리즘을 사용합니다.</li>
            <li><strong>통신 암호화:</strong> 모든 데이터 전송 시 TLS(HTTPS) 프로토콜을 적용합니다.</li>
            <li><strong>접근 제한:</strong> 개인정보 접근 권한을 최소한의 인원에게만 부여하고, 접근 기록을 관리합니다.</li>
            <li><strong>사진 보안:</strong> 프로필 사진은 AWS S3에 저장되며, 서명된 URL을 통해서만 접근 가능합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">7. 이용자의 권리와 행사 방법</h2>
          <p className="mb-2">이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>개인정보 열람 요청:</strong> 수집된 개인정보의 항목, 이용 목적, 보유 기간 등을 확인할 수 있습니다.</li>
            <li><strong>개인정보 수정:</strong> 일반 프로필 정보는 앱에서 직접 수정할 수 있습니다. 출생연도는 임의 변경을 막기 위해 고객센터(support@romeoncupid.art)를 통해 사유와 함께 정정을 요청해야 합니다.</li>
            <li><strong>개인정보 삭제:</strong> 회원 탈퇴를 통해 모든 개인정보 삭제를 요청할 수 있습니다 (설정 &gt; 회원 탈퇴).</li>
            <li><strong>처리 정지 요청:</strong> 개인정보의 처리 정지를 요청할 수 있습니다.</li>
            <li><strong>동의 철회:</strong> 마케팅 목적과 제3자 AI 추천 정보 처리 동의를 각각 철회할 수 있습니다.</li>
            <li><strong>알림 설정:</strong> 푸시 알림, 이메일 알림 수신 여부를 설정에서 변경할 수 있습니다.</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 서비스 내 설정 메뉴 또는 이메일(support@romeoncupid.art)을 통해 가능하며,
            회사는 지체 없이 필요한 조치를 취하겠습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">8. 개인정보의 파기 절차 및 방법</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>파기 절차:</strong> 수집 목적이 달성된 개인정보는 별도의 DB로 옮겨져 관련 법령에 따른 보존 기간 경과 후 파기됩니다.</li>
            <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 복구 불가능한 방법으로 삭제하며, 종이 문서는 분쇄기로 분쇄합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">9. 만 19세 미만 이용자의 개인정보</h2>
          <p>
            서비스는 만 19세 이상의 성인만 이용할 수 있으며, 만 19세 미만 이용자의 회원가입을 받지 않습니다.
            만 19세 미만 이용자의 개인정보가 수집된 사실을 인지한 경우, 계정 이용을 차단하고 관련 법령과 회사 정책에 따라 해당 정보를 삭제합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">10. 개인정보 자동 수집 장치의 설치/운영 및 거부</h2>
          <p className="mb-2">
            회사는 서비스 이용 편의를 위해 쿠키를 사용합니다. 이용자는 웹 브라우저 설정을 통해
            쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">11. 개인정보 보호 책임자</h2>
          <p className="mb-2">
            회사는 이용자의 개인정보를 보호하고 관련 불만을 처리하기 위해 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-2">
            <p><strong>회사명:</strong> PostAGI</p>
            <p><strong>이메일:</strong> support@romeoncupid.art</p>
          </div>
          <p className="mt-3">
            기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우, 아래 기관에 문의하실 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
            <li>대검찰청 사이버수사과 (spo.go.kr / 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr / 182)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">12. 개인정보처리방침 변경</h2>
          <p>
            이 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며,
            변경 시 서비스 내 공지사항 또는 푸시 알림을 통해 사전에 안내합니다.
            변경된 방침은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            시행 예정일: 2026년 10월 14일
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            문의: support@romeoncupid.art
          </p>
        </div>
      </div>
    </div>
  );
}
