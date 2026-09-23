import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import NetworkHistory from './NetworkHistory';
jest.mock('axios', () => ({ get: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
test('shows IP evidence, sampling limits and opens the matching player', async () => {
    const select = jest.fn();
    axios.get.mockResolvedValue({ data: { body: { retentionDays: 90, total: 11,
        sampling: 'Sampled once per minute; matches need not be simultaneous.', items: [{
            _id: 'row', ipAddress: '203.0.113.20', source: 'trusted_proxy', channels: ['http'],
            observations: 7, logins: 2, firstSeen: '2026-09-23T12:00:00Z', lastSeen: '2026-09-23T13:00:00Z',
            sharedAccounts: [{ userId: 'peer', username: 'Other player', observations: 3 }],
        }] } } });
    render(<NetworkHistory userId="player" onSelectPlayer={select} />);
    await screen.findByText('203.0.113.20');
    expect(screen.getByText(/Trusted load balancer/)).toBeTruthy();
    expect(screen.getByText(/2 successful logins/)).toBeTruthy();
    expect(screen.getByText(/never automatically bans/)).toBeTruthy();
    expect(screen.getByText(/Sampled once per minute/)).toBeTruthy();
    fireEvent.click(screen.getByText('Other player')); expect(select).toHaveBeenCalledWith('peer');
    fireEvent.click(screen.getByText('Next IP records'));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/integrity/players/player/networks?limit=10&offset=10'));
});
test('permission failure is visible and does not leave old IP evidence on screen', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Missing admin permission: integrity.view' } } });
    render(<NetworkHistory userId="player" onSelectPlayer={() => {}} />);
    expect((await screen.findByRole('alert')).textContent).toContain('integrity.view');
    expect(screen.queryByRole('table')).toBeNull();
});
