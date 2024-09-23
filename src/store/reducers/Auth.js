import { PURGE } from "redux-persist";
import { setToken } from '../axios';

var initialState = {
  isLogin: false,
  userNonce: {},
  auth: localStorage.getItem('token'),
  publicAddress: localStorage.getItem('publicAddress'),
  isLoader: { message: 'Please Wait...', status: false },

  ringsData: [],
  isModal: false,
};

const Auth = (state = initialState, { type, payload }) => {
  switch (type) {
    case PURGE: return initialState;

    /*========== LOGIN REDUCERS ============= */

    case 'SET_NONCE':
      return {
        ...state,
        userNonce: payload,
      };

    case 'SET_LOGIN_DATA':
      setToken(payload['token']);
      localStorage.setItem('token', payload['token']);
      localStorage.setItem('publicAddress', payload['publicAddress']);
      return {
        ...state,
        auth: payload['token'],
        publicAddress: payload['publicAddress'],
      };

    case 'TOGGLE_LOGIN':
      return {
        ...state,
        isLogin: payload,
      };

    case 'LOGOUT':
      setToken();
      localStorage.removeItem('token');
      localStorage.removeItem('publicAddress');
      return {
        ...state,
        auth: '',
        publicAddress: '',
      };

    /*========== LOADER REDUCERS ============= */

    case 'SET_LOADER':
      return {
        ...state,
        isLoader: payload
      };


    case 'TOGGLE_REFRESH_MODAL':
      return {
        ...state,
        isModal: payload
      }

    default:
      return state;
  }
};

export default Auth;