import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Mint from './index';

beforeEach(() => {
  sessionStorage.clear();
  window.solana = { connect: jest.fn(), signMessage: jest.fn() };
  window.phantom = undefined;
});

test.each([true, false])('coming soon prevents wallet connection and minting when enabled is %s', async enabled => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ enabled, message: 'Mint availability loaded.' }) }));
  const ui = render(<MemoryRouter><Mint /></MemoryRouter>);
  const button = await waitForElement(() => ui.getByText('Coming soon'));
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(window.solana.connect).not.toHaveBeenCalled();
  expect(global.fetch.mock.calls.every(([url]) => url.endsWith('/config'))).toBe(true);
});

test('a pending mint cannot bypass coming soon', async () => {
  const pending = JSON.stringify({ wallet: 'test-wallet', requestId: 'same-request', signature: 'same-signature' });
  sessionStorage.setItem('mpc-native-mint-request-v1', pending);
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ enabled: true }) }));
  const ui = render(<MemoryRouter><Mint /></MemoryRouter>);
  fireEvent.click(await waitForElement(() => ui.getByText('Coming soon')));
  expect(window.solana.signMessage).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('mpc-native-mint-request-v1')).toBe(pending);
  expect(global.fetch.mock.calls.every(([url]) => url.endsWith('/config'))).toBe(true);
});
