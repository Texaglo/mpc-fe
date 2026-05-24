import { env, localEvmChain, message, networkId } from './config';

export const getInjectedEthereumProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) return null;

  const { ethereum } = window;
  if (Array.isArray(ethereum.providers)) {
    return ethereum.providers.find((provider) => provider.isMetaMask) || ethereum.providers[0];
  }

  return ethereum;
};

export const getConfiguredChainIdHex = () => `0x${Number(networkId).toString(16)}`;

export const getCurrentEvmNetworkId = async (provider = getInjectedEthereumProvider()) => {
  if (!provider?.request) return null;
  const chainId = await provider.request({ method: 'eth_chainId' });
  return parseInt(chainId, 16);
};

export const requestEthereumAccounts = async (provider = getInjectedEthereumProvider()) => {
  if (!provider?.request) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }

  if (provider.isMetaMask) {
    await provider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
  }

  return provider.request({ method: 'eth_accounts' });
};

export const switchToConfiguredEvmNetwork = async (provider = getInjectedEthereumProvider()) => {
  if (!provider?.request) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }

  const chainId = getConfiguredChainIdHex();

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (error) {
    const nestedCode = error?.data?.originalError?.code;
    if (env === 'localhost' && (error.code === 4902 || nestedCode === 4902)) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [localEvmChain],
      });
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } else {
      throw error;
    }
  }

  return getCurrentEvmNetworkId(provider);
};

export const configuredNetworkMessage = message;
