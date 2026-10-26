import { selectVerificationItem } from './verificationState';

describe('selectVerificationItem', () => {
  it('VER-WEB-UNIT-01 REJECTED 다음 APPROVED 순서면 APPROVED 행을 선택한다', () => {
    const selected = selectVerificationItem([
      { id: 1, type: 'EDUCATION', status: 'REJECTED' },
      { id: 2, type: 'EDUCATION', status: 'APPROVED' },
    ], 'EDUCATION');

    expect(selected?.id).toBe(2);
  });

  it('VER-WEB-UNIT-02 APPROVED 다음 REJECTED 순서여도 APPROVED 행을 우선한다', () => {
    const selected = selectVerificationItem([
      { id: 1, type: 'EDUCATION', status: 'APPROVED' },
      { id: 2, type: 'EDUCATION', status: 'REJECTED' },
    ], 'EDUCATION');

    expect(selected?.id).toBe(1);
  });

  it('VER-WEB-UNIT-03 APPROVED가 없으면 마지막 최신 행을 선택한다', () => {
    const selected = selectVerificationItem([
      { id: 1, type: 'EDUCATION', status: 'REJECTED' },
      { id: 2, type: 'EDUCATION', status: 'PENDING' },
    ], 'EDUCATION');

    expect(selected?.id).toBe(2);
  });
});
