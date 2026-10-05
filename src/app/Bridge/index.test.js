import { Bridge } from './index';
import { getInjectedEthereumProvider, switchToConfiguredEvmNetwork } from '../../store/walletNetworks';
jest.mock('../../components/navbar', () => () => null);
jest.mock('../../components/footer', () => () => null);
jest.mock('../../store/walletNetworks', () => ({ getInjectedEthereumProvider: jest.fn(), switchToConfiguredEvmNetwork: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
test.each([
    [false, { eligible: false, migrationEnabled: true, message: 'Past frozen cutoff' }],
    [true, { eligible: true, migrationEnabled: false }],
    [true, {}],
])('refuses wallet authorization when eligibility or destination is unavailable', async (ok, body) => {
    global.fetch = jest.fn(async () => ({ ok, json: async () => body }));
    const page = new Bridge({});
    await expect(page.signBridgeAuthorization({ ethWallet: '0xowner', solanaWallet: 'destination', contractAddress: '0xcollection', tokenId: 1207 })).rejects.toThrow();
    expect(getInjectedEthereumProvider).not.toHaveBeenCalled();
    expect(switchToConfiguredEvmNetwork).not.toHaveBeenCalled();
});
test('network failure cannot proceed to Ethereum burn', async () => {
    global.fetch = jest.fn(async () => { throw new Error('offline'); });
    const page = new Bridge({});
    page.setState = jest.fn();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await expect(page.handleContractBurn('0xowner', '0xcollection', 1206)).resolves.toBeUndefined();
    log.mockRestore();
    expect(page.setState).toHaveBeenLastCalledWith({ isLoading: false });
    expect(getInjectedEthereumProvider).not.toHaveBeenCalled();
});
