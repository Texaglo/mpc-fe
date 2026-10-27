import React from 'react';
import { render } from '@testing-library/react';
import PlayerActivity, { PlayerPresence } from './PlayerActivity';
test('distinguishes a live socket from recent API activity', () => {
    const ui = render(<PlayerPresence presence={{ status: 'online', connectionCount: 2, measuredAt: new Date().toISOString() }} />);
    expect(ui.getByText('Online').title).toContain('2 authenticated live');
    ui.rerender(<PlayerPresence presence={{ status: 'recent_activity', measuredAt: new Date().toISOString() }} />);
    expect(ui.getByText('Recently active').title).toContain('no confirmed live socket');
});
test('stale readings never keep displaying a player as online', () => {
    const ui = render(<PlayerPresence presence={{ status: 'online', measuredAt: new Date(Date.now() - 120000).toISOString() }} />);
    expect(ui.getByText('Status unavailable')).toBeTruthy();
    expect(ui.queryByText('Online')).toBeNull();
});
test('shows login history, date coverage and connection counts without confusing logins with reconnects', () => {
    const now = new Date().toISOString();
    const ui = render(<PlayerActivity activity={{ lastLoginAt: now, trackingStartedAt: now, loginsLast90Days: 3, connectionSessionsLast90Days: 5, presence: { status: 'offline', measuredAt: now }, recentLogins: [{ at: now, provider: 'wallet', client: 'unknown' }] }} />);
    expect(ui.getByText('3')).toBeTruthy(); expect(ui.getByText('5')).toBeTruthy();
    expect(ui.getByText('Wallet')).toBeTruthy(); expect(ui.getByText('Unspecified client')).toBeTruthy();
    expect(ui.getByText(/Reconnecting opens a new connection session/)).toBeTruthy();
});
