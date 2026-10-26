import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminApi } from '@/lib/api/admin';
import AdminDashboardPage from '../page';
import AdminReviewPage from '../review/page';
import AdminReportsPage from '../reports/page';
import AdminUsersPage from '../users/page';
import AdminUserDetailPage from '../users/[id]/page';
import AdminHeartsPage from '../hearts/page';
import AdminBulkLikesPage from '../bulk-likes/page';
import { isAdminRole } from '../_components/adminAuth';

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    getStats: jest.fn(),
    getFunnel: jest.fn(),
    getPendingVerifications: jest.fn(),
    getVerifications: jest.fn(),
    reviewVerification: jest.fn(),
    getReports: jest.fn(),
    processReport: jest.fn(),
    updateUserStatus: jest.fn(),
    getUsers: jest.fn(),
    searchUsers: jest.fn(),
    getUserDetail: jest.fn(),
    getUserActivityLog: jest.fn(),
    getHeartBalance: jest.fn(),
    getHeartHistory: jest.fn(),
    getHeartGrantAudit: jest.fn(),
    issueHearts: jest.fn(),
    getBulkLikeSender: jest.fn(),
    getBulkLikeQuota: jest.fn(),
    getFemaleUsers: jest.fn(),
    getBulkLikeHistory: jest.fn(),
    sendBulkLikes: jest.fn(),
  },
}));

const api = adminApi as jest.Mocked<typeof adminApi>;

const userPage = {
  content: [
    { userId: 40218, phoneNumber: '01012345678', nickname: '한서연', gender: 'FEMALE', role: 'USER', status: 'ACTIVE', verified: true, createdAt: '2026-08-03T09:00:00' },
    { userId: 40213, phoneNumber: '01098765432', nickname: '준호', gender: 'MALE', role: 'ADMIN', status: 'ACTIVE', verified: false, createdAt: '2026-08-10T09:12:00' },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 20,
  first: true,
  last: true,
} as const;

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/admin');
  jest.spyOn(window, 'confirm').mockReturnValue(true);

  api.getStats.mockResolvedValue({
    totalUsers: 4182,
    activeUsers: 3914,
    maleUsers: 2100,
    femaleUsers: 2082,
    pendingVerifications: 12,
    totalMatchings: 400,
    activeMatchings: 20,
    coupleRegistrations: 10,
    todaySignups: 48,
    todayMatchings: 7,
    pendingReports: 2,
  });
  api.getFunnel.mockResolvedValue({ periodDays: 7, signupCompleted: 100, interviewCompleted: 82, reviewApproved: 64, firstRecommendation: 61, okSent: 38, matchCompleted: 14, cardsShown: 61, cardsViewed: 82, likesSent: 38, superLikesSent: 8, matched: 14, contactsRevealed: 12, couplesRegistered: 2 });
  api.getPendingVerifications.mockResolvedValue({
    ...userPage,
    content: [{ id: 12, userId: 40213, userNickname: '준호', type: 'EDUCATION', status: 'PENDING', documentUrl: '/degree.pdf', memo: null, reviewMemo: null, reviewerId: null, approvedAt: null, expiresAt: null, createdAt: new Date().toISOString() }],
  });
  api.getVerifications.mockResolvedValue({ ...userPage, content: [] });
  api.reviewVerification.mockResolvedValue({ id: 12, userId: 40213, userNickname: '준호', type: 'EDUCATION', status: 'APPROVED', documentUrl: '/degree.pdf', memo: null, reviewMemo: null, reviewerId: 1, approvedAt: new Date().toISOString(), expiresAt: null, createdAt: new Date().toISOString() });
  api.getReports.mockResolvedValue({ content: [{ id: 3, reportedUserId: 40213, reportedUserNickname: '준호', targetType: 'PROFILE', reason: '사진 불일치 신고', description: '프로필 사진과 실제가 다름', status: 'PENDING', createdAt: new Date().toISOString() }] });
  api.processReport.mockResolvedValue({ status: 'success' });
  api.updateUserStatus.mockResolvedValue(undefined);
  api.getUsers.mockResolvedValue(userPage as never);
  api.searchUsers.mockResolvedValue(userPage as never);
  api.getUserDetail.mockResolvedValue({
    userId: 40213,
    phoneNumber: '010-****-5432',
    nickname: '준호',
    gender: 'MALE',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-10T09:12:00',
    lastLoginAt: '2026-08-11T11:58:00',
    age: 34,
    profileCompleteness: 80,
    verificationRecords: [{ id: 1, type: 'EDUCATION', status: 'PENDING' }],
    heartBalance: 128,
    matchingsCount: 3,
    reportedCount: 0,
    blockedByCount: 0,
  });
  api.getUserActivityLog.mockResolvedValue({ sentLikes: 10, receivedLikes: 12, communityPosts: 1, communityComments: 2, reportsFiled: 0, blocksCreated: 0 });
  api.getHeartBalance.mockResolvedValue({ userId: 40213, balance: 128 });
  api.getHeartHistory.mockResolvedValue({ content: [{ id: 1, amount: 10, balanceAfter: 128, type: 'CHARGE', reason: '인증 완료 보너스', createdAt: '2026-08-11T12:04:00' }] });
  api.getHeartGrantAudit.mockResolvedValue({ content: [{ actionId: 77, adminId: 1, adminNickname: '운영자', recipientUserId: 40218, recipientNickname: '한서연', amount: 10, reason: '인증 완료 감사 보너스', createdAt: '2026-08-11T12:04:00' }] });
  api.issueHearts.mockResolvedValue({ status: 'success' });
  api.getBulkLikeSender.mockResolvedValue(userPage.content[1] as never);
  api.getBulkLikeQuota.mockResolvedValue({ dailyLimit: 100, usedToday: 40, remainingToday: 60 });
  api.getFemaleUsers.mockResolvedValue({ ...userPage, content: [userPage.content[0]] } as never);
  api.getBulkLikeHistory.mockResolvedValue({ content: [] });
  api.sendBulkLikes.mockResolvedValue({ totalRequested: 1, successCount: 1, skippedCount: 0, matchedCount: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('관리자 화면 API 및 라우팅 통합 계약', () => {
  it('TC-ADMIN-I01 대시보드는 통계와 7일 퍼널을 함께 조회한다', async () => {
    render(<AdminDashboardPage />);
    expect(await screen.findByText('48')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^대시보드 · \d{4}\.\d{2}\.\d{2}$/ })).toBeInTheDocument();
    expect(api.getStats).toHaveBeenCalledTimes(1);
    expect(api.getFunnel).toHaveBeenCalledWith(7);
  });

  it('TC-ADMIN-I02 인증 승인 버튼은 선택한 인증의 심사 API를 호출한다', async () => {
    render(<AdminReviewPage />);
    await screen.findByText('심사 중 · 준호 · 학력');
    const approveButtons = screen.getAllByRole('button', { name: '승인' });
    const approve = approveButtons[approveButtons.length - 1];
    await userEvent.click(approve);
    await waitFor(() => expect(api.reviewVerification).toHaveBeenCalledWith(12, 'APPROVED', '관리자 심사 승인', '서류 확인 완료'));
  });

  it('ADM-REPORT-04 정상 경로: 신고 이용 정지는 서버의 SUSPEND 동작을 한 번만 호출한다', async () => {
    render(<AdminReportsPage />);
    await userEvent.click(await screen.findByRole('button', { name: '이용 정지' }));
    await waitFor(() => expect(api.processReport).toHaveBeenCalledWith(3, 'SUSPEND', '이용 정지 조치'));
    expect(api.updateUserStatus).not.toHaveBeenCalled();
  });

  it('ADM-REPORT-05 거절 조건: 경고는 서버의 WARN 동작만 호출하고 이용 정지를 호출하지 않는다', async () => {
    render(<AdminReportsPage />);
    await userEvent.click(await screen.findByRole('button', { name: '경고' }));
    await waitFor(() => expect(api.processReport).toHaveBeenCalledWith(3, 'WARN', '경고 조치'));
    expect(api.processReport).not.toHaveBeenCalledWith(3, 'SUSPEND', expect.any(String));
    expect(api.updateUserStatus).not.toHaveBeenCalled();
  });

  it('TC-ADMIN-I04 회원 목록 상세 링크는 /admin/users/{id}로 연결된다', async () => {
    render(<AdminUsersPage />);
    const links = await screen.findAllByRole('link', { name: '상세 ›' });
    expect(links[0]).toHaveAttribute('href', '/admin/users/40218');
  });

  it('ADM-USERS-03 정상 경로: 다음 페이지 버튼은 서버의 다음 20명을 조회한다', async () => {
    api.getUsers.mockResolvedValueOnce({ ...userPage, totalElements: 51, totalPages: 3, number: 0, size: 20, first: true, last: false } as never);
    render(<AdminUsersPage />);
    await userEvent.click(await screen.findByRole('button', { name: '다음' }));
    await waitFor(() => expect(api.getUsers).toHaveBeenCalledWith(1, 20));
  });

  it('TC-ADMIN-I05 회원 상세의 이용 정지는 해당 회원 상태 API를 호출한다', async () => {
    render(<AdminUserDetailPage params={{ id: '40213' }} />);
    await userEvent.click(await screen.findByRole('button', { name: '이용 정지' }));
    await waitFor(() => expect(api.updateUserStatus).toHaveBeenCalledWith(40213, 'SUSPENDED', '관리자 회원 상세 조치'));
  });

  it('ADM-USER-DETAIL-03 정상 경로: 접속·결제·매칭·제재 섹션을 모두 노출한다', async () => {
    render(<AdminUserDetailPage params={{ id: '40213' }} />);
    expect(await screen.findByText('접속 IP')).toBeInTheDocument();
    expect(screen.getByText('누적 접속')).toBeInTheDocument();
    expect(screen.getByText('누적 결제')).toBeInTheDocument();
    expect(screen.getByText('매칭 기록')).toBeInTheDocument();
    expect(screen.getByText('신고 · 제재 이력')).toBeInTheDocument();
  });

  it('TC-ADMIN-I06 하트 지급은 잘못된 ID를 거절하고 정상 입력만 API를 호출한다', async () => {
    render(<AdminHeartsPage />);
    expect(await screen.findByText('운영자 · #1')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('한서연') && content.includes('40218'))).toBeInTheDocument();
    expect(api.getHeartGrantAudit).toHaveBeenCalledWith(0, 20);
    const issueButton = screen.getByRole('button', { name: '보너스 지급' });
    expect(issueButton).toBeDisabled();
    expect(api.issueHearts).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('회원 ID', { selector: '#heart-issue-id' }), '40218');
    await userEvent.click(issueButton);
    await waitFor(() => expect(api.issueHearts).toHaveBeenCalledWith(40218, 10, '인증 완료 감사 보너스'));
  });

  it('TC-ADMIN-I07 대량 좋아요는 대상 미선택을 거절하고 확인 뒤 실제 발송 API를 호출한다', async () => {
    render(<AdminBulkLikesPage />);
    const initialButton = await screen.findByRole('button', { name: '받을 분을 고르면 보낼 수 있어요' });
    expect(initialButton).toBeDisabled();

    const row = screen.getByText((content) => content.includes('한서연') && content.includes('40218')).closest('tr');
    expect(row).not.toBeNull();
    await userEvent.click(within(row as HTMLElement).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('checkbox', { name: '위 내용을 확인했습니다' }));
    await userEvent.click(screen.getByRole('button', { name: '1명에게 OK 보내기' }));

    await waitFor(() => expect(api.sendBulkLikes).toHaveBeenCalledWith([40218], 40213, 'OK', expect.any(String)));
  });

  it('ADM-BULK-03 정상 경로: 받은 OK 0 필터와 다음 지면을 서버 조회 조건으로 보낸다', async () => {
    api.getFemaleUsers.mockResolvedValue({
      ...userPage,
      content: [userPage.content[0]],
      totalElements: 41,
      totalPages: 3,
      number: 0,
      first: true,
      last: false,
    } as never);
    render(<AdminBulkLikesPage />);

    await userEvent.click(await screen.findByRole('button', { name: '받은 OK 0' }));
    await waitFor(() => expect(api.getFemaleUsers).toHaveBeenCalledWith(0, 20, {
      keyword: undefined,
      recent: false,
      activeOnly: false,
      receivedOkZero: true,
    }));

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(api.getFemaleUsers).toHaveBeenCalledWith(1, 20, {
      keyword: undefined,
      recent: false,
      activeOnly: false,
      receivedOkZero: true,
    }));
  });

  it('ADM-BULK-04 정상 경로: 발송 배치의 종류와 매칭 수를 이력 표에 표시한다', async () => {
    api.getBulkLikeHistory.mockResolvedValue({
      content: [{
        batchId: 42,
        operatorId: 1,
        senderUserId: 40213,
        senderNickname: '준호',
        likeType: 'SUPER_OK',
        requestedCount: 2,
        sentCount: 2,
        skippedCount: 0,
        matchedCount: 1,
        createdAt: '2026-08-28T12:00:00',
        items: [],
      }],
    } as never);
    render(<AdminBulkLikesPage />);

    expect((await screen.findAllByText('슈퍼 OK')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('columnheader', { name: '매칭' })).toBeInTheDocument();
    expect(screen.getAllByText(/준호/).length).toBeGreaterThanOrEqual(2);
  });
});

describe('관리자 권한 기본 거부 계약', () => {
  it('ADM-AUTH-02 거절 조건: 누락 권한과 일반 회원 권한은 기본 거부한다', () => {
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole('USER')).toBe(false);
    expect(isAdminRole('ADMIN')).toBe(true);
    expect(isAdminRole('OPERATOR')).toBe(true);
  });
});
