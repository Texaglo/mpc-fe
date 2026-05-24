let initialState = {
  publicAddress: '',
  isBurnNftRecord: false,
  nftMinted: null,
  burnHistory: [],
  nftMetadata: [],
  connected: false,
  address: null,
  network: null,
  provider: null,
  error: null,
  setLoader: { message: 'Please Wait...', status: false },
}

const Auth = (state = initialState, { type, payload }) => {
  switch (type) {

    case 'LOGIN':
      // localStorage.setItem('publicAddress', payload);
      return {
        ...state,
        publicAddress: payload,
      };

    case 'LOGOUT':
      // localStorage.removeItem('publicAddress');
      return {
        ...state,
        publicAddress: '',
      };

    case 'TOGGLE_LOADER':
      return {
        ...state,
        setLoader: payload,
      };

    case 'CONNECT_WALLET_SUCCESS':
      return {
        ...state,
        connected: true,
        address: payload.address,
        network: payload.network,
        provider: payload.provider,
        error: null,
      };

    case 'CONNECT_WALLET_FAILURE':
      return {
        ...state,
        connected: false,
        error: payload.error,
      };

    case 'DISCONNECT_WALLET':
      return initialState;

    case 'SET_BURN_NFT_RECORD':
      return {
        ...state,
        isBurnNftRecord: payload,
      };

    case 'SET_MINTED_NFT':
      return {
        ...state,
        nftMinted: payload,
      };

    case 'BURN_NFT_HISTORY':
      return {
        ...state,
        burnHistory: Array.isArray(payload) ? payload : []
      };

    case 'SET_WALLET_NFT':
      return {
        ...state,
        nftMetadata: Array.isArray(payload) ? payload : []
      };


    default:
      return state;
  }
};

export default Auth;
