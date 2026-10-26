import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 - Romeo & Cupid',
  description: 'Romeo & Cupid 프리미엄 매칭 서비스 이용약관',
};

// 이용약관 정적 페이지 (앱스토어/플레이스토어 제출용)
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">이용약관</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-8">개정 공지일: 2026년 10월 7일 (제3자 AI 추천 제공자 변경)</p>

      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제1조 (목적)</h2>
          <p>
            이 약관은 PostAGI(이하 &quot;회사&quot;)가 운영하는 Romeo &amp; Cupid(이하 &quot;서비스&quot;)의
            이용에 관한 기본적인 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제2조 (정의)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>&quot;서비스&quot;란 회사가 제공하는 프리미엄 매칭 플랫폼 및 관련 부가 서비스를 말합니다.</li>
            <li>&quot;회원&quot;이란 본 약관에 동의하고 서비스에 가입한 자를 말합니다.</li>
            <li>&quot;하트&quot;란 서비스 내에서 매칭 요청 등에 사용되는 가상 화폐를 말하며, 하트 1개는 1,000원에 해당합니다.</li>
            <li>&quot;OK&quot;란 상대방에 대한 호감 표시를 의미하며, 소모되는 하트 수는 회원의 성별과 매칭 성사 여부(매칭 전/매칭 이후)에 따라 달라집니다. 정확한 차감 하트 수는 서비스 화면에서 발신 직전 안내되는 금액을 따릅니다.</li>
            <li>&quot;Super OK&quot;란 강한 호감 표시를 의미하며, OK와 마찬가지로 소모 하트 수가 성별·매칭 성사 여부에 따라 달라집니다.</li>
            <li>&quot;매칭&quot;이란 두 회원이 상호 호감을 표시하여 대화가 가능해진 상태를 말합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제3조 (서비스 내용)</h2>
          <p className="mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>프로필 등록 및 관리:</strong> 사진, 기본 정보, 자기소개 등을 포함한 프로필 작성</li>
            <li><strong>Cupid 매거진 큐레이션:</strong> 매일 정오(KST 12:00) 단 한 분을 큐레이션하여 추천. 별도 동의 시 제3자 AI가 후보 선정과 추천 이유 생성을 보조</li>
            <li><strong>답장(OK/Super OK) 전송:</strong> 하트를 사용한 정중한 답장</li>
            <li><strong>실시간 채팅:</strong> 매칭 성사 후 1:1 실시간 대화</li>
            <li><strong>인증 4종 뱃지:</strong> 학력·직장·자산·소득 인증(증빙 서류 심사)</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제4조 (회원 가입)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>회원가입은 <strong>만 19세 이상</strong>의 성인만 가능합니다.</li>
            <li>출시 시점에는 <strong>문자(SMS) 6자리 인증번호</strong>로 전화번호를 확인하고, 회원이 출생연도와 만 19세 이상 여부를 직접 신고합니다. 이는 본인확인 대행사의 인증 완료를 뜻하지 않습니다.</li>
            <li>
              <strong>Cupid 매거진 큐레이션:</strong> 모든 회원의 프로필은 매일 정오 단 한 분을 큐레이션하여 추천하며,
              인증 4종(학력·직장·자산·소득)으로 검증됩니다. 익일 정오부터 첫 추천이 도착합니다.
            </li>
            <li>1인 1계정 원칙이며, 중복 가입이 확인될 경우 서비스 이용이 제한될 수 있습니다.</li>
            <li>허위 연령을 포함한 허위 정보로 가입한 경우 사전 통보 없이 이용이 제한되거나 계정이 삭제될 수 있습니다. 추후 본인확인 결과와 신고한 출생연도가 다르면 본인확인 결과를 우선하며, 미성년으로 확인되면 이용이 차단됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제5조 (하트 충전 및 결제)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              하트는 서비스 내 가상 화폐로, OK·Super OK 발신에 사용됩니다. 하트 1개는 1,000원에 해당합니다.
              발신에 필요한 하트 수는 <strong>회원 성별</strong>과 <strong>상대방과 매칭 성사 여부(매칭 전/매칭 이후)</strong>에 따라 다음과 같이 4가지 조합으로 나뉩니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>매칭 전 · 남성: OK 10하트 / Super OK 20하트</li>
                <li>매칭 전 · 여성: OK 0하트(무료) / Super OK 10하트</li>
                <li>매칭 이후 · 남성: OK 30하트 / Super OK 60하트</li>
                <li>매칭 이후 · 여성: OK 10하트 / Super OK 20하트</li>
              </ul>
              위 기준은 회장 결정에 따라 변경될 수 있으며, 실제 차감 하트 수는 언제나 서비스 화면에서 발신 직전 안내되는 금액이 우선합니다.
            </li>
            <li>
              하트 충전은 토스페이먼츠(Toss Payments)를 통해 안전하게 처리됩니다. 충전 상품(금액·지급 하트 수)은
              서비스 내 충전 화면에 안내된 내용을 따르며, 상품 구성은 회사 정책에 따라 변경될 수 있습니다.
            </li>
            <li>결제 완료 후 하트는 즉시 계정에 충전됩니다.</li>
            <li>하트는 유효기간이 없으며, 회원 탈퇴 시 소멸됩니다.</li>
            <li>결제 관련 문의는 support@romeoncupid.art으로 연락해 주시기 바랍니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제6조 (환불 정책)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>미사용 하트 환불:</strong> 구매일로부터 <strong>7일 이내</strong>이며 해당 결제로 충전된
              하트를 전혀 사용하지 않은 경우 전액 환불이 가능합니다.
            </li>
            <li><strong>사용한 하트:</strong> 이미 사용한(OK/Super OK 전송 등) 하트는 환불이 불가합니다.</li>
            <li>
              <strong>부분 환불:</strong> 충전된 하트의 일부만 사용한 경우, 미사용 하트에 해당하는
              금액에서 수수료(10%)를 공제한 금액을 환불합니다.
            </li>
            <li><strong>환불 절차:</strong> 앱 내 설정 &gt; 결제 내역에서 환불 요청하거나, 이메일(support@romeoncupid.art)로 신청합니다.</li>
            <li><strong>환불 소요 시간:</strong> 환불 승인 후 영업일 기준 3~5일 이내 원래 결제 수단으로 환불됩니다.</li>
            <li>
              앱스토어/플레이스토어를 통해 결제한 경우, 해당 스토어의 환불 정책이 우선 적용될 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제7조 (제3자 AI를 이용한 추천)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>회사는 회원이 별도로 동의한 경우에만 OpenAI, L.L.C.의 AI를 오늘의 후보 선정 보조와 추천 이유 생성에 이용합니다.</li>
            <li>공통 취미, 생활권, MBTI, 결혼 계획, 자녀 계획, 음주, 흡연 정보를 국외에서 처리할 수 있습니다.</li>
            <li>이름, 연락처, 사진, 정확한 위치, 직장·회사, 소득·자산, 인증 자료, 종교는 제3자 AI에 전송하지 않습니다.</li>
            <li>동의하지 않거나 철회해도 규칙 기반 추천을 계속 이용할 수 있습니다.</li>
            <li>장애 대응으로 제공자가 Anthropic PBC로 전환되면 별도 Anthropic 고지와 동의가 있는 경우에만 전송합니다.</li>
            <li>동의 상태와 철회는 설정 &gt; AI 추천 정보 처리에서 확인할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제8조 (회원의 의무)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>회원은 정확하고 최신의 정보를 제공하여야 합니다.</li>
            <li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
            <li>회원은 관계 법령, 본 약관, 서비스 이용 안내 등을 준수하여야 합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제9조 (금지 행위)</h2>
          <p className="mb-2">회원은 다음 각 호에 해당하는 행위를 하여서는 안 됩니다.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>허위 프로필 등록 또는 타인 사칭</li>
            <li>타인의 사진을 도용하여 프로필에 사용하는 행위</li>
            <li>상업적 목적(광고, 홍보, 판매 등)으로 서비스를 이용하는 행위</li>
            <li>다른 회원에 대한 괴롭힘, 스토킹, 위협, 욕설, 성희롱</li>
            <li>불법적이거나 음란한 콘텐츠를 게시하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위 (해킹, 크롤링, 자동화 도구 사용 등)</li>
            <li>타 회원의 개인정보를 무단으로 수집하거나 유포하는 행위</li>
            <li>매칭을 통해 알게 된 연락처 등 개인정보를 서비스 외부에 유출하는 행위</li>
            <li>금전 거래를 요구하거나 유도하는 행위</li>
            <li>미성년자가 서비스에 가입하거나 이용하는 행위</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제10조 (서비스 이용 제한 및 해지)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>약관 또는 관계 법령을 위반한 회원에 대해 사전 통보 없이 서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.</li>
            <li>다른 회원으로부터 3회 이상 신고를 받은 경우, 관리자 검토 후 이용이 제한될 수 있습니다.</li>
            <li>회원은 언제든지 앱 내 설정 &gt; 회원 탈퇴 기능을 통해 서비스 이용을 해지할 수 있습니다.</li>
            <li>탈퇴 시 모든 데이터(프로필, 사진, 채팅 기록 등)는 즉시 삭제되며 복구가 불가합니다.</li>
            <li>탈퇴 전 미사용 하트가 있는 경우, 환불 요청 후 탈퇴하시기 바랍니다. 탈퇴 후에는 환불이 불가합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제11조 (서비스 변경 및 중단)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>회사는 상당한 이유가 있는 경우 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.</li>
            <li>서비스 변경 또는 중단 시 사전에 공지하며, 불가피한 경우 사후에 공지할 수 있습니다.</li>
            <li>정기 점검, 시스템 업데이트 등으로 인한 일시적 서비스 중단이 있을 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제12조 (지적 재산권)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>서비스에 관한 저작권, 상표권 등 지적재산권은 회사에 귀속됩니다.</li>
            <li>회원이 서비스 내에 게시한 콘텐츠(프로필 사진, 게시글 등)에 대한 저작권은 해당 회원에게 귀속됩니다.</li>
            <li>회원은 서비스를 이용하여 얻은 정보를 회사의 사전 승인 없이 복제, 배포, 출판할 수 없습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제13조 (면책 조항)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              회사는 회원 간의 만남을 주선하는 플랫폼을 제공할 뿐, 매칭 결과 또는 만남의 결과에 대해
              어떠한 책임도 지지 않습니다.
            </li>
            <li>회원 간에 발생한 분쟁은 당사자 간에 해결하여야 하며, 회사는 이에 개입할 의무가 없습니다.</li>
            <li>회원이 제공한 정보의 정확성, 진실성에 대해서는 해당 회원이 책임을 집니다.</li>
            <li>천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
            <li>회사는 무료로 제공되는 서비스 이용과 관련하여 발생한 손해에 대해 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제14조 (손해배상)</h2>
          <p>
            회사 또는 회원이 본 약관을 위반하여 상대방에게 손해를 입힌 경우,
            그 손해를 배상하여야 합니다. 다만, 고의 또는 과실이 없는 경우에는 그러하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제15조 (분쟁 해결)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>본 약관에 관한 분쟁은 대한민국 법률을 준거법으로 합니다.</li>
            <li>서비스 이용으로 발생한 분쟁에 대한 소송은 서울중앙지방법원을 제1심 관할 법원으로 합니다.</li>
            <li>회사와 회원 간 분쟁이 발생한 경우, 양 당사자는 분쟁 해결을 위해 성실히 협의합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">제16조 (약관의 변경)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>회사는 관계 법령에 위배되지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
            <li>약관을 변경할 경우, 변경 내용과 시행일을 서비스 내 공지사항 또는 푸시 알림을 통해 시행일 7일 전에 공지합니다.</li>
            <li>
              변경된 약관에 동의하지 않는 회원은 서비스 이용을 중단하고 탈퇴할 수 있으며,
              시행일 이후 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">부칙</h2>
          <p>본 개정 약관은 2026년 10월 14일부터 시행됩니다.</p>
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
