import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import Cashier from './index';
jest.mock('axios', () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock('eventing-bus', () => ({ publish: jest.fn() }));
const mockDispatch = jest.fn();
let mockAccess;
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch, useSelector: selector => selector({ Auth: mockAccess }) }));
beforeEach(() => {
  mockAccess = { role: 'admin', permissions: [] };
  axios.get.mockReset().mockImplementation(url => Promise.resolve({ data: { body: url === '/admin/settings' ? { settings: [{ key: 'minDepositSol', value: 0.001 }, { key: 'maxDepositSol', value: 10 }] } : { transactions: [{ _id: 'receipt-one', userId: { username: 'SOL player' }, type: 'solDeposit', solCommerceIntentId: 'intent', solCommerceOutcome: 'CREDITED_SOL', paidAmount: 1e-9, paidCoinType: 'sol', receivedAmount: 1e-9, receivedCoinType: 'sol', status: 'completed', createdAt: '2026-10-27T12:00:00Z' }], pagination: { totalTransactions: 1, currentPage: 1, totalPages: 1 } } } }));
  axios.put.mockReset().mockResolvedValue({ data: {} });
});
test('native SOL limits require an audit reason and preserve lamport precision', async () => {
  const ui = render(<Cashier />);
  await ui.findByText('SOL player');
  const card = ui.getByText('Minimum SOL deposit').closest('article');
  fireEvent.click(within(card).getByRole('button', { name: 'Edit' }));
  fireEvent.change(ui.getByLabelText('New value'), { target: { value: '0.000000001' } });
  expect(ui.getByRole('button', { name: 'Apply change' }).disabled).toBe(true);
  fireEvent.change(ui.getByLabelText('Required audit reason'), { target: { value: 'Set SOL limits' } });
  expect(ui.getByRole('button', { name: 'Apply change' }).disabled).toBe(false);
  fireEvent.change(ui.getByLabelText('New value'), { target: { value: '0.0000000001' } });
  expect(ui.getByRole('button', { name: 'Apply change' }).disabled).toBe(true);
  fireEvent.change(ui.getByLabelText('New value'), { target: { value: '0.000000001' } });
  fireEvent.click(ui.getByRole('button', { name: 'Apply change' }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/admin/settings', { key: 'minDepositSol', value: 1e-9, reason: 'Set SOL limits' }));
});
test('ledger separates retained SOL from dollars and filters purchases', async () => {
  const ui = render(<Cashier />);
  await ui.findByText('SOL player');
  const row = ui.getByText('SOL player').closest('tr');
  expect(within(row).getByText('Purchase unavailable · SOL retained')).toBeTruthy();
  expect(within(row).getByRole('cell', { name: '—' })).toBeTruthy();
  expect(within(row).getAllByText('0.000000001 SOL')).toHaveLength(2);
  expect(row.textContent).not.toContain('$');
  fireEvent.change(ui.getByLabelText('Transaction category'), { target: { value: 'purchases' } });
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('category=purchases')));
});
test('view-only cashier operators cannot change limits', async () => {
  mockAccess = { role: 'sub_admin', permissions: ['cashier.view'] };
  const ui = render(<Cashier />);
  await ui.findByText('SOL player');
  expect(ui.queryByRole('button', { name: 'Edit' })).toBeNull();
});
