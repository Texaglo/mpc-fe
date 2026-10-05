import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import PokerStatistics from './PokerStatistics';
jest.mock('axios', () => ({ get: jest.fn() }));
const result = { units: 'FP', statistics: { handsPlayed: 20, totalProfitLoss: 42, vpipPercent: 25, sessions: null, handsWithCompleteActions: 19, netChipsKnownHands: 20, timingKnownHands: 20, threeBetOpportunities: 4 }, bankroll: { availableBalance: 100 }, coverage: { missingNetworkHands: 3 }, recentHands: [{ handId: 'ring:one', result: 'SPLIT', tableName: 'Test table', completedAt: '2026-10-05T10:00:00Z' }], definitions: { hoursPlayed: 'Overlapping tables counted once' } };
beforeEach(() => axios.get.mockReset());
test('shows coverage, unknown values, and navigates to the exact completed hand', async () => {
    axios.get.mockResolvedValue({ data: { body: result } });
    const open = jest.fn(); const ui = render(<PokerStatistics userId="player" onOpenHand={open} />);
    await waitFor(() => expect(ui.getByText(/20 dealt hands/)).toBeTruthy());
    expect(ui.getAllByText('Not available').length).toBeGreaterThan(0);
    expect(ui.getByText(/3 older cash hands/)).toBeTruthy();
    fireEvent.click(ui.getByText('Review hand ring:one')); expect(open).toHaveBeenCalledWith('ring:one');
    fireEvent.change(ui.getByLabelText('Statistics period'), { target: { value: 'week' } });
    await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith('/history/admin/users/player/profile-statistics?period=week&balanceType=CASH&network=mainnet-beta'));
    fireEvent.change(ui.getByLabelText('Statistics economy'), { target: { value: 'FP' } });
    await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith('/history/admin/users/player/profile-statistics?period=week&balanceType=FP&network=mainnet-beta'));
    expect(ui.queryByLabelText('Statistics network')).toBeNull();
});
test('denied API access is visible instead of displaying zero statistics', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Permission denied' } } });
    const ui = render(<PokerStatistics userId="player" onOpenHand={() => {}} />);
    await waitFor(() => expect(ui.getByRole('alert').textContent).toBe('Permission denied'));
    expect(ui.queryByText('No completed hands for these filters.')).toBeNull();
});
test('late response for previous filters cannot replace current statistics', async () => {
    let resolveOld; axios.get.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }));
    axios.get.mockResolvedValue({ data: { body: { ...result, statistics: null, recentHands: [] } } });
    const ui = render(<PokerStatistics userId="player" onOpenHand={() => {}} />);
    fireEvent.change(ui.getByLabelText('Statistics network'), { target: { value: 'devnet' } });
    await waitFor(() => expect(ui.getByText('No completed hands for these filters.')).toBeTruthy());
    resolveOld({ data: { body: result } });
    await waitFor(() => expect(ui.queryByText('Review hand ring:one')).toBeNull());
});
