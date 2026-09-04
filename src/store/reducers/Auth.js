import { PURGE } from "redux-persist";
import { setToken } from '../axios';

var initialState = {
  isLogin: false,
  userNonce: '',
  auth: localStorage.getItem('token'),
  publicAddress: localStorage.getItem('publicAddress'),
  role: localStorage.getItem('adminRole') || '',
  permissions: (() => { try { return JSON.parse(localStorage.getItem('adminPermissions') || '[]'); } catch (_) { return []; } })(),
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
      localStorage.setItem('adminRole', payload['role'] || '');
      localStorage.setItem('adminPermissions', JSON.stringify(payload['permissions'] || []));
      return {
        ...state,
        auth: payload['token'],
        publicAddress: payload['publicAddress'],
        role: payload['role'] || '',
        permissions: payload['permissions'] || [],
      };

    case 'SET_ADMIN_ACCESS':
      localStorage.setItem('adminRole', payload['role'] || '');
      localStorage.setItem('adminPermissions', JSON.stringify(payload['permissions'] || []));
      return { ...state, role: payload['role'] || '', permissions: payload['permissions'] || [] };

    case 'TOGGLE_LOGIN':
      return {
        ...state,
        isLogin: payload,
      };

    case 'LOGOUT':
      setToken();
      localStorage.removeItem('token');
      localStorage.removeItem('publicAddress');
      localStorage.removeItem('adminRole');
      localStorage.removeItem('adminPermissions');
      return {
        ...state,
        auth: '',
        publicAddress: '',
        role: '',
        permissions: [],
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
