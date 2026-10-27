import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import FreePlay from './index';
jest.mock('axios', () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock('eventing-bus', () => ({ publish: jest.fn() }));
const mockDispatch = jest.fn();
let mockAccess;
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch, useSelector: selector => selector({ Auth: mockAccess }) }));
const settings = { enabled: true, purchasesEnabled: true, tokensPerUsd: 10, minPurchaseUsd: 1, maxPurchaseUsd: 100, solPurchasesEnabled: false, tokensPerSol: 750, minPurchaseSol: 0.001, maxPurchaseSol: 10, dailyBonuses: [] };
const open = async () => {
    const ui = render(<MemoryRouter><FreePlay /></MemoryRouter>);
    await waitFor(() => expect(ui.getByLabelText('Maximum SOL purchase').value).toBe('10'));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    return ui;
};
beforeEach(() => {
    mockAccess = { role: 'admin', permissions: [] };
    mockDispatch.mockClear();
    axios.get.mockReset().mockImplementation(url => Promise.resolve({ data: { body: url.includes('/settings') ? settings : { entries: [] } } }));
    axios.put.mockReset().mockImplementation((url, payload) => Promise.resolve({ data: { body: payload } }));
});
test('admin enables SOL purchasing, previews the rate and saves exact SOL limits with the required audit reason', async () => {
    const ui = await open();
    fireEvent.change(ui.getByLabelText('Free Points per SOL'), { target: { value: '5000' } });
    fireEvent.change(ui.getByLabelText('Minimum SOL purchase'), { target: { value: '0.000000001' } });
    fireEvent.click(ui.getByRole('button', { name: 'SOL purchases' }));
    expect(ui.getByText('1 SOL = 5,000 FP')).toBeTruthy();
    expect(ui.getByRole('button', { name: 'Save changes' }).disabled).toBe(true);
    fireEvent.change(ui.getByPlaceholderText('Why are these Free Play settings changing?'), { target: { value: 'Set SOL launch prices' } });
    fireEvent.click(ui.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/free-play/admin/settings', expect.objectContaining({ solPurchasesEnabled: true, tokensPerSol: 5000, minPurchaseSol: 1e-9, maxPurchaseSol: 10, reason: 'Set SOL launch prices' })));
    await waitFor(() => expect(ui.getByRole('button', { name: 'Save changes' }).disabled).toBe(true));
});
test('invalid enabled rate and conflicting limits cannot be saved', async () => {
    const ui = await open();
    fireEvent.change(ui.getByLabelText('Free Points per SOL'), { target: { value: '0' } });
    fireEvent.click(ui.getByRole('button', { name: 'SOL purchases' }));
    expect(ui.getByText(/Set a positive FP per SOL/)).toBeTruthy();
    fireEvent.change(ui.getByLabelText('Free Points per SOL'), { target: { value: '1000' } });
    fireEvent.change(ui.getByLabelText('Minimum SOL purchase'), { target: { value: '20' } });
    expect(ui.getByText('Minimum SOL purchase cannot exceed maximum SOL purchase.')).toBeTruthy();
    fireEvent.change(ui.getByPlaceholderText('Why are these Free Play settings changing?'), { target: { value: 'Change terms' } });
    expect(ui.getByRole('button', { name: 'Save changes' }).disabled).toBe(true);
    expect(axios.put).not.toHaveBeenCalled();
});
test('standard rate starts at 750 with the 0.1 SOL example and explicitly excludes store packs', async () => {
    const ui = await open();
    expect(ui.getByLabelText('Free Points per SOL').value).toBe('750');
    expect(ui.getByText('1 SOL = 750 FP')).toBeTruthy();
    expect(ui.getByText('0.1 SOL = 75 FP')).toBeTruthy();
    expect(ui.getByText(/Changing this rate or these purchase limits does not change pack pricing/)).toBeTruthy();
});
test('view-only operators cannot modify SOL terms', async () => {
    mockAccess = { role: 'sub_admin', permissions: ['free_play.view'] };
    const ui = await open();
    expect(ui.getByLabelText('Free Points per SOL').closest('fieldset').disabled).toBe(true);
});
test('SOL ledger payments display all nine decimals', async () => {
    axios.get.mockImplementation(url => Promise.resolve({ data: { body: url.includes('/settings') ? settings : { entries: [{ _id: 'one', paidAmount: 1e-9, paidCoinType: 'sol', receivedCoinType: 'fp', receivedAmount: 1, updatedFpBalance: 1 }] } } }));
    const ui = await open();
    await waitFor(() => expect(ui.getByText('0.000000001 SOL')).toBeTruthy());
});
