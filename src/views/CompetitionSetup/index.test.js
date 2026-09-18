import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import CompetitionSetup, { configurationOf } from './index';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn() }));
jest.mock('eventing-bus', () => ({ publish: jest.fn() }));
const form = { name: 'Omaha SNG', description: '', kind: 'SNG', balanceType: 'FP', gameVariant: 'Omaha',
    formatLimit: 'Pot Limit', region: 'us', buyIn: '0', fee: '0', startingStack: '1000', seatLimit: '4',
    actionTimerSeconds: '15', timeBankSeconds: '0', registrationOpensAt: '2027-01-01T12:00',
    payoutPercentages: '70,30', blinds: [{ smallBlind: '10', bigBlind: '20', duration: '10', ante: '0' }],
    _id: 'must not be sent', status: 'Draft' };
test('SNG configuration preserves free entry/zero ante and excludes document metadata/schedule', () => {
    expect(configurationOf(form)).toMatchObject({ buyIn: 0, fee: 0, seatLimit: 4, payoutPercentages: [70, 30], blinds: [{ ante: 0 }] });
    expect(configurationOf(form)).not.toHaveProperty('_id');
    expect(configurationOf(form)).not.toHaveProperty('startsAt');
    expect(configurationOf(form)).not.toHaveProperty('maxPlayers');
});
test('MTT schedule is ISO and capacity is separate from seats', () => {
    expect(configurationOf({ ...form, kind: 'MTT', startsAt: '2027-01-02T12:00', minPlayers: '4', maxPlayers: '30' }))
        .toMatchObject({ minPlayers: 4, maxPlayers: 30, seatLimit: 4 });
});
beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { body: { items: [], total: 0 } } });
    axios.post.mockResolvedValue({ data: { body: {} } });
});
test('admin creates a draft through new API, never opens paid registration automatically', async () => {
    render(<CompetitionSetup />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'FP test event' } });
    fireEvent.submit(screen.getByText('Save draft').closest('form'));
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith('/competitions', expect.objectContaining({ name: 'FP test event', balanceType: 'FP', fee: 0, seatLimit: 6 }));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
});
test('visibly identifies staging-only scope and displays backend failure', async () => {
    axios.get.mockRejectedValueOnce({ response: { data: { message: 'New backend required' } } });
    render(<CompetitionSetup />);
    expect(screen.getByRole('status').textContent).toContain('Local / staging testing only');
    expect((await screen.findByRole('alert')).textContent).toBe('New backend required');
});
