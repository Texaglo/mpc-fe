/*========== LOGIN ACTIONS ============= */

export const getNonce = ({ data }) => ({
  type: 'GET_NONCE',
  payload: data,
});

export const setNonce = (data) => ({
  type: 'SET_NONCE',
  payload: data,
});

export const login = ({ data, history }) => ({
  type: 'LOGIN',
  payload: data,
  history,
});

export const setLoginData = (data) => ({
  type: 'SET_LOGIN_DATA',
  payload: data
});

export const toggleLogin = (data) => ({
  type: 'TOGGLE_LOGIN',
  payload: data
});

export const logout = () => ({
  type: 'LOGOUT'
});

/*========== PAGE LOADER ACTIONS ============= */

export const setLoader = (data) => ({
  type: 'SET_LOADER',
  payload: data,
});

/*========== MODAL ACTIONS ============= */

export const toggleModal = (data) => ({
  type: 'TOGGLE_REFRESH_MODAL',
  payload: data,
});




