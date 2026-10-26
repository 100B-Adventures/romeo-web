import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Child Safety Standards - Romeo & Cupid',
  description: 'Romeo & Cupid 아동 성적 학대 및 착취(CSAE) 금지 정책 및 아동 안전 표준',
};

// Google Play 아동 안전 표준 정책 대응 페이지
export default function ChildSafetyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        Child Safety Standards / 아동 안전 표준
      </h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-8">
        Last Updated / 최종 수정일: April 21, 2026
      </p>

      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">
            1. Commitment / 약속
          </h2>
          <p className="mb-3">
            <strong>PostAGI</strong> and <strong>Romeo &amp; Cupid</strong> (&quot;the App&quot;, &quot;the Service&quot;, developed by PostAGI / lessor-god)
            maintain a <strong>zero-tolerance policy</strong> against child sexual abuse and
            exploitation (CSAE), including but not limited to child sexual abuse material (CSAM).
            Romeo &amp; Cupid is a premium matchmaking service strictly for adults aged 19 and over,
            and minors are not permitted to use the Service under any circumstances.
          </p>
          <p>
            PostAGI가 운영하는 <strong>Romeo &amp; Cupid</strong>는 만 19세 이상의 성인만을 위한
            프리미엄 매칭 서비스로서, 아동 성적 학대 및 착취(CSAE) 및 아동 성적 학대 자료(CSAM)에
            대해 <strong>무관용 원칙</strong>을 적용합니다. 미성년자는 어떠한 경우에도 본 서비스를
            이용할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">
            2. Prohibited Conduct / 금지 행위
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Creation, upload, sharing, solicitation, or distribution of any content that
              sexualizes minors — including images, videos, text, or links. /
              미성년자를 성적 대상화하는 모든 콘텐츠(이미지, 동영상, 텍스트, 링크)의 생성,
              업로드, 공유, 요구, 배포.
            </li>
            <li>
              Grooming, luring, or any predatory behavior directed at minors. /
              미성년자를 대상으로 한 그루밍, 유인, 포식적 행동.
            </li>
            <li>
              Use of the Service by anyone under the age of 19. /
              만 19세 미만 사용자의 서비스 이용.
            </li>
            <li>
              Impersonation of a minor or creation of profiles misrepresenting age. /
              미성년자 사칭 또는 연령을 허위 기재한 프로필 생성.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">
            3. Safeguards in Romeo &amp; Cupid / 안전 장치
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Age declaration at signup:</strong> A text-message code confirms the phone
              number, and users declare their birth year and that they are 19 or older. This is
              not third-party identity verification. All profiles are curated by Cupid AI based on
              profile verification
              (education, employment, income, assets) before being shown. /
              회원가입 시 문자 인증으로 전화번호를 확인하고 출생연도와 만 19세 이상 여부를 자기신고합니다.
              이는 본인확인 대행사의 인증 완료를 뜻하지 않습니다. 모든 프로필은 Cupid AI가 인증
              4종(학력·직장·자산·소득) 기반으로 큐레이션하여 추천합니다.
            </li>
            <li>
              <strong>Identity verification:</strong> Profile photos are reviewed by the
              admin team. Five optional verification badges (identity, occupation, education,
              income, assets) require document review. /
              프로필 사진은 관리자 검토 대상. 신원, 직업, 학력, 소득, 자산 5종 인증 배지는
              증빙 서류 심사를 거침.
            </li>
            <li>
              <strong>User reporting:</strong> Any user can report a profile or post within
              one tap. Reports are reviewed by the PostAGI admin team within 24 hours. /
              모든 사용자는 1탭으로 프로필 및 게시물을 신고할 수 있으며, PostAGI 관리팀은
              24시간 내 검토합니다.
            </li>
            <li>
              <strong>Blocking:</strong> Users may block others; blocked content is
              immediately removed from their feed. /
              사용자는 상대를 차단할 수 있으며, 차단 시 해당 콘텐츠는 즉시 피드에서
              제거됩니다.
            </li>
            <li>
              <strong>Three-strike automatic suspension:</strong> Accounts accumulating three
              verified reports are automatically suspended. /
              신고 3회 누적 시 자동 정지.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">
            4. Reporting CSAE / CSAE 신고
          </h2>
          <p className="mb-3">
            If you encounter content or behavior that violates these standards, please report
            immediately:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>In-app report:</strong> Tap the report button on any profile, post, or
              chat message. / 프로필, 게시물, 채팅 메시지의 신고 버튼.
            </li>
            <li>
              <strong>Email:</strong>{' '}
              <a className="underline" href="mailto:support@romeoncupid.art">
                support@romeoncupid.art
              </a>
            </li>
            <li>
              <strong>Korea — 경찰청 사이버범죄 신고시스템 (ECRM):</strong>{' '}
              <a
                className="underline"
                href="https://ecrm.police.go.kr"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://ecrm.police.go.kr
              </a>{' '}
              / 국번없이 117
            </li>
            <li>
              <strong>International — NCMEC CyberTipline:</strong>{' '}
              <a
                className="underline"
                href="https://report.cybertip.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://report.cybertip.org
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">
            5. Response / 대응 절차
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Verified CSAE content is removed within 24 hours of report. /
              검증된 CSAE 콘텐츠는 신고 접수 후 24시간 내 삭제.
            </li>
            <li>
              Offending accounts are permanently banned. /
              위반 계정은 영구 정지.
            </li>
            <li>
              Confirmed CSAM is reported to NCMEC and relevant Korean authorities (경찰청,
              방송통신심의위원회) as required by law. /
              확인된 CSAM은 법에 따라 NCMEC 및 국내 수사기관(경찰청, 방송통신심의위원회)에
              신고.
            </li>
            <li>
              Technical and account data is preserved for law-enforcement cooperation. /
              수사기관 협조를 위해 기술 로그 및 계정 정보 보존.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">
            6. Contact / 연락처
          </h2>
          <p>
            PostAGI — Romeo &amp; Cupid Trust &amp; Safety Team
            <br />
            Email:{' '}
            <a className="underline" href="mailto:support@romeoncupid.art">
              support@romeoncupid.art
            </a>
            <br />
            Website:{' '}
            <a className="underline" href="https://romeoncupid.art">
              https://romeoncupid.art
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
