import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Operations from './Operations';
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
const data = { event: { name: 'Test final', status: 'Running', roundNumber: 2, prizePool: 20, collectedFees: 2, balanceType: 'FP', blinds: [{ smallBlind: 10, bigBlind: 20 }] }, level: { index: 0, smallBlind: 10, bigBlind: 20, ante: 0 }, tables: [], results: [{ _id: 'a', userId: 'winner', status: 'Winner', finishPosition: 1, payout: 20, paidAt: '2026-09-18' }] };
beforeEach(() => { jest.clearAllMocks(); axios.get.mockResolvedValue({ data: { body: data } }); });
test('shows readable live results and refuses operator action without audit reason', async () => {
    render(<Operations id="test" onClose={() => {}} />);
    await screen.findByText('Test final — Running');
    expect(screen.getByText('winner')).toBeTruthy();
    expect(screen.getByText('Settled')).toBeTruthy();
    fireEvent.click(screen.getByText('Pause'));
    expect((await screen.findByRole('alert')).textContent).toContain('audit reason');
    expect(axios.post).not.toHaveBeenCalled();
});
test('pause uses audited backend control and switches to resume', async () => {
    axios.post.mockResolvedValue({ data: { body: { ...data, event: { ...data.event, status: 'Paused' } } } });
    render(<Operations id="test" onClose={() => {}} />);
    await screen.findByText('Pause');
    fireEvent.change(screen.getByLabelText('Audit reason'), { target: { value: 'Investigate player issue' } });
    fireEvent.click(screen.getByText('Pause'));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/competitions/test/control', { command: 'pause', reason: 'Investigate player issue', level: 0 }));
    expect(await screen.findByText('Resume')).toBeTruthy();
    expect(screen.getByLabelText('Next-hand blind level')).toBeTruthy();
});
