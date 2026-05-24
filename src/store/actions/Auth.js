export const login = (data) => ({
  type: 'LOGIN',
  payload: data,
});

export const logout = (data) => ({
  type: 'LOGOUT',
  payload: data,
});

export const toggleLoader = (data) => ({
  type: 'TOGGLE_LOADER',
  payload: data,
});

export const innerForm = (data) => ({
  type: 'INNER_FORM',
  payload: data,
});

export const connectWalletSuccess = (data) => ({
  type: 'CONNECT_WALLET_SUCCESS',
  payload: data,
});

export const connectWalletFailure = (data) => ({
  type: 'CONNECT_WALLET_FAILURE',
  payload: data,
});

export const disconnectWallet = () => ({
  type: 'DISCONNECT_WALLET',
});

export const createBurnNftRecord = (data) => ({
  type: 'CREATE_BURN_NFT_RECORD',
  payload: data,
});

export const setBurnNftRecord = (data) => ({
  type: 'SET_BURN_NFT_RECORD',
  payload: data,
});

export const mintNewNft = (data) => ({
  type: 'MINT_NEW_NFT',
  payload: data,
});

export const setMintedNft = (data) => ({
  type: 'SET_MINTED_NFT',
  payload: data,
});


export const getBurnNftHistory = (payload) => ({
  type: 'GET_BURN_NFT_HISTORY',
  payload
});

export const burnNftHistory = (payload) => ({
  type: 'BURN_NFT_HISTORY',
  payload
});

export const getWalletNft = (payload) => ({
  type: 'GET_WALLET_NFT',
  payload
});

export const setWalletNft = (payload) => ({
  type: 'SET_WALLET_NFT',
  payload
});