import { render, screen } from '@testing-library/react';
import StatusBar from '../StatusBar';

describe('StatusBar', () => {
  it('renders the vNext magazine status-bar contents', () => {
    render(<StatusBar />);

    expect(screen.getByTestId('app-status-bar')).toHaveTextContent('12:00');
    expect(screen.getByTestId('app-status-bar')).toHaveTextContent('정오');
  });
});
