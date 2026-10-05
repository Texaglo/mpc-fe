import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Mint from './index';
jest.mock('../../components/navbar', () => () => null);
jest.mock('../../components/footer', () => () => null);
beforeEach(() => { sessionStorage.clear(); window.solana = undefined; window.phantom = undefined; });
const config = { enabled: true, firstTokenId: 1207, lastTokenId: 1231, perWalletLimit: 3, migration: { firstEligibleTokenId: 0, lastEligibleTokenId: 1206, firstNativeTokenId: 1207 } };
test('missing wallet explains the requirement without sending a mint request', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => config }));
  const ui = render(<MemoryRouter><Mint /></MemoryRouter>);
  fireEvent.click(await waitForElement(() => ui.getByText('Connect wallet & mint')));
  await waitForElement(() => ui.getByText('Open this page with a Solana wallet such as Phantom installed.'));
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test('shows test-only mint range and migration boundary', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => config }));
  const ui = render(<MemoryRouter><Mint /></MemoryRouter>);
  await waitForElement(() => ui.getByText('DEVNET TESTING'));
  expect(ui.getByText(/Test pool: #1207–#1231/)).toBeTruthy();
  expect(ui.getByText(/Ethereum IDs #0–#1206/)).toBeTruthy();
});
test('unavailable mint has no active mint button', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ enabled: false, message: 'Minting is disabled.' }) }));
  const ui = render(<MemoryRouter><Mint /></MemoryRouter>);
  await waitForElement(() => ui.getByText('Minting is disabled.'));
  expect(ui.queryByText('Connect wallet & mint')).toBeNull();
});
test('pending retry submits the same signed request without requesting a new random NFT', async () => {
  const signed = { wallet: 'test-wallet', requestId: 'same-request', signature: 'same-signature' };
  sessionStorage.setItem('mpc-native-mint-request-v1', JSON.stringify(signed));
  window.solana = { connect: jest.fn(async () => ({ publicKey: { toString: () => 'test-wallet' } })), signMessage: jest.fn() };
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.endsWith('/config') ? config : { tokenId: 1210, assetAddress: 'test-asset', transactionHash: 'test-tx', status: 'minted' } }));
  const ui = render(<MemoryRouter><Mint /></MemoryRouter>);
  fireEvent.click(await waitForElement(() => ui.getByText('Retry pending mint')));
  await waitForElement(() => ui.getByText('Your NFT: #1210'));
  expect(window.solana.signMessage).not.toHaveBeenCalled();
  expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual(signed);
  expect(sessionStorage.getItem('mpc-native-mint-request-v1')).toBeNull();
});
