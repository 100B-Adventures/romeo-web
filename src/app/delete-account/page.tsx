import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '계정 삭제 - Romeo-N-Cupid | PostAGI',
  description: 'Romeo-N-Cupid 계정 삭제 안내. PostAGI가 운영하는 프리미엄 매칭 서비스.',
};

// 계정 삭제 안내 정적 페이지 (Google Play 데이터 보안 양식 제출용)
export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">계정 삭제 안내</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-8">
        Romeo-N-Cupid · 운영: PostAGI
      </p>

      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <p>
            <strong>PostAGI</strong>가 운영하는 <strong>Romeo-N-Cupid</strong> 프리미엄 매칭 서비스의
            계정 삭제 방법을 안내합니다. 계정을 삭제하면 모든 개인정보가 삭제되며 복구할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">1. 앱 내 계정 삭제</h2>
          <p className="mb-3">Romeo-N-Cupid 앱에서 직접 계정을 삭제할 수 있습니다.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>앱 하단 메뉴에서 <strong>더보기</strong> 탭을 선택합니다.</li>
            <li><strong>설정</strong>을 누릅니다.</li>
            <li><strong>계정 관리</strong> 섹션에서 <strong>회원 탈퇴</strong>를 선택합니다.</li>
            <li>확인을 위해 &quot;탈퇴합니다&quot;를 입력한 후 삭제를 완료합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">2. 이메일을 통한 삭제 요청</h2>
          <p className="mb-3">
            앱에 접근할 수 없는 경우, 아래 이메일로 계정 삭제를 요청할 수 있습니다.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p><strong>이메일:</strong> support@romeoncupid.art</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              가입 시 사용한 전화번호를 포함하여 요청해 주세요. 본인 확인 후 7일 이내에 처리됩니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">3. 삭제되는 데이터</h2>
          <p className="mb-2">계정 삭제 시 아래의 모든 데이터가 즉시 삭제됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>프로필 정보 (닉네임, 나이, 직업, 자기소개 등)</li>
            <li>프로필 사진 (클라우드 저장소에서 즉시 삭제)</li>
            <li>매칭 기록 및 채팅 내역</li>
            <li>커뮤니티 게시글 및 댓글</li>
            <li>인증 서류 및 뱃지</li>
            <li>알림 내역</li>
            <li>하트(포인트) 잔액</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-gray-900 dark:text-gray-100">4. 보존되는 데이터</h2>
          <p className="mb-2">관련 법령에 따라 일부 데이터는 일정 기간 보존됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>결제 기록: 전자상거래법에 따라 <strong>5년</strong> 보존</li>
            <li>접속 로그: 통신비밀보호법에 따라 <strong>3개월</strong> 보존</li>
            <li>전화번호 해시: 부정 이용 방지를 위해 <strong>30일</strong> 보관 후 파기</li>
          </ul>
        </section>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <strong>앱 이름:</strong> Romeo-N-Cupid
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <strong>운영사:</strong> PostAGI
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <strong>문의:</strong> support@romeoncupid.art
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">
              개인정보처리방침
            </a>
            {' · '}
            <a href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">
              이용약관
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
