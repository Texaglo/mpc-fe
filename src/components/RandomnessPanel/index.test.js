import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import RandomnessPanel from './index';
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
test('active hand shows locked verification and no deck or secret', async () => {
    axios.get.mockResolvedValueOnce({ data: { requests: [{ id: 'proof', status: 'READY', network: 'devnet', payer: 'treasury', commitment: 'commit' }] } })
        .mockResolvedValueOnce({ data: { id: 'proof', verificationAvailable: false, commitment: 'commit' } });
    render(<RandomnessPanel tableId="table" />);
    fireEvent.click(await screen.findByText('View request status'));
    expect(await screen.findByText('Verification locked until settlement')).toBeTruthy();
    expect(screen.queryByText(/Deck in deal order/)).toBeNull();
    expect(screen.queryByText('Cancel undealt request')).toBeNull();
});
test('completed proof shows readable hand, deck order and disclosure', async () => {
    axios.get.mockResolvedValueOnce({ data: { requests: [{ id: 'proof', status: 'SETTLED', network: 'devnet', payer: 'treasury' }] } })
        .mockResolvedValueOnce({ data: { id: 'proof', verificationAvailable: true, binding: { identity: { gameHandNumber: 42 } }, completedAt: '2026-10-04T12:00:00Z', deck: ['C_A', 'S_K'], disclosure: 'Includes folded cards' } });
    render(<RandomnessPanel tableId="table" />);
    fireEvent.click(await screen.findByText('View completed-hand proof'));
    expect(await screen.findByText('Deck in deal order: C_A, S_K')).toBeTruthy();
    expect(screen.getByText('Includes folded cards')).toBeTruthy();
});

test('reviewed retry posts the same request ID with an audit reason', async () => {
    const row = { id: 'pending-proof', status: 'PENDING', network: 'devnet', payer: 'treasury', reason: 'Signed-attempt limit reached' };
    axios.get.mockResolvedValue({ data: { requests: [row] } });
    axios.post.mockResolvedValue({ data: {} });
    render(<RandomnessPanel tableId="table" canRetry />);
    const button = await screen.findByText('Retry same request');
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Operator action reason'), { target: { value: 'RPC repaired; reviewed previous transactions' } });
    fireEvent.click(button);
    await screen.findByText('Signed-attempt limit reached');
    expect(axios.post).toHaveBeenCalledWith('/randomness/admin/requests/pending-proof/retry', { reason: 'RPC repaired; reviewed previous transactions' });
});
