import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Marketplace from './index';
const mockDispatch = jest.fn();
let mockState;
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch, useSelector: selector => selector(mockState) }));
jest.mock('react-table-6', () => ({ data, columns }) => <div>{data.map((row, index) => <div key={row._id}>{columns.map((column, i) => <div key={i}>{column.Cell ? column.Cell({ original: row, index, value: row[column.accessor] }) : row[column.accessor]}</div>)}</div>)}</div>);
const item = { _id: 'test-item', sku: 'MPC-TEST', name: 'Deck', price: 4.99, solPrice: 0.02, itemType: 'cosmetic', stock: 0, isActive: true };
beforeEach(() => {
    mockDispatch.mockClear();
    mockState = { Auth: { isModal: true }, Marketplace: { items: [item], pagination: { totalItems: 1, totalPages: 1 }, filters: { itemTypes: ['cosmetic', 'currency_bundle'] } } };
});
test('editor loads SOL pricing and persists exact changes without changing zero stock', () => {
    const ui = render(<MemoryRouter><Marketplace /></MemoryRouter>);
    expect(ui.getByText('0.02 SOL')).toBeTruthy();
    fireEvent.click(ui.getByRole('button', { name: 'Edit' }));
    expect(ui.getByLabelText('SOL price per item').value).toBe('0.02');
    fireEvent.change(ui.getByLabelText('SOL price per item'), { target: { value: '0.000000001' } });
    fireEvent.click(ui.getByRole('button', { name: 'Update' }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_MARKETPLACE_ITEM', payload: expect.objectContaining({ _id: item._id, solPrice: 1e-9, price: 4.99, stock: 0 }) });
});
test('clearing a SOL price disables it; sub-lamport prices are blocked', () => {
    const ui = render(<MemoryRouter><Marketplace /></MemoryRouter>);
    fireEvent.click(ui.getByRole('button', { name: 'Edit' }));
    fireEvent.change(ui.getByLabelText('SOL price per item'), { target: { value: '0.0000000001' } });
    expect(ui.getByRole('alert').textContent).toMatch(/at most 9 decimal/);
    expect(ui.getByRole('button', { name: 'Update' }).disabled).toBe(true);
    fireEvent.change(ui.getByLabelText('SOL price per item'), { target: { value: '' } });
    fireEvent.click(ui.getByRole('button', { name: 'Update' }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_MARKETPLACE_ITEM', payload: expect.objectContaining({ solPrice: null }) });
});
test('FP packs require configured points and submit the per-pack amount with the SOL price', () => {
    mockState.Marketplace.items = [{ ...item, itemType: 'currency_bundle', fpAmount: 0 }];
    const ui = render(<MemoryRouter><Marketplace /></MemoryRouter>);
    fireEvent.click(ui.getByRole('button', { name: 'Edit' }));
    expect(ui.getByRole('button', { name: 'Update' }).disabled).toBe(true);
    fireEvent.change(ui.getByLabelText('Free Points per pack'), { target: { value: '1200' } });
    fireEvent.click(ui.getByRole('button', { name: 'Update' }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_MARKETPLACE_ITEM', payload: expect.objectContaining({ fpAmount: 1200, solPrice: 0.02 }) });
});
test('SOL-only packs show disabled USD checkout and save independently editable pack terms', () => {
    mockState.Marketplace.items = [{ ...item, name: '150 FP Pack', price: 0, itemType: 'currency_bundle', fpAmount: 150, solPrice: 0.1, stock: null }];
    const ui = render(<MemoryRouter><Marketplace /></MemoryRouter>);
    expect(ui.getByText('USD disabled')).toBeTruthy();
    expect(ui.getByText('0.1 SOL')).toBeTruthy();
    fireEvent.click(ui.getByRole('button', { name: 'Edit' }));
    expect(ui.getByLabelText('Free Points per pack').value).toBe('150');
    fireEvent.change(ui.getByLabelText('Free Points per pack'), { target: { value: '300' } });
    fireEvent.change(ui.getByLabelText('SOL price per item'), { target: { value: '0.2' } });
    fireEvent.click(ui.getByRole('button', { name: 'Update' }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_MARKETPLACE_ITEM', payload: expect.objectContaining({ price: 0, solPrice: 0.2, fpAmount: 300, stock: null }) });
});
