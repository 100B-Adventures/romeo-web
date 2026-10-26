import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filters, SearchBar } from '../_components/AdminUI';

describe('관리자 공용 UI 계약', () => {
  it('TC-ADMIN-U01 필터 선택 시 선택값을 부모에게 전달한다', async () => {
    const onChange = jest.fn();
    render(
      <Filters
        options={[{ value: 'ALL', label: '전체' }, { value: 'ACTIVE', label: 'ACTIVE' }]}
        value="ALL"
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'ACTIVE' }));
    expect(onChange).toHaveBeenCalledWith('ACTIVE');
  });

  it('TC-ADMIN-U02 검색어 입력 후 제출하면 조회 콜백을 실행한다', async () => {
    const onChange = jest.fn();
    const onSearch = jest.fn();
    render(<SearchBar value="준호" onChange={onChange} onSearch={onSearch} placeholder="회원 검색" />);

    await userEvent.click(screen.getByRole('button', { name: '조회' }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
