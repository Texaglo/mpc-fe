import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import EventBus from 'eventing-bus';
import { all, takeEvery, call, put } from 'redux-saga/effects';
import { setLoginData, setNonce, toggleLogin } from '../actions/Auth';

/*========== LOGIN FUNCTIONS =============*/

function* getNonce({ payload }) {
  const { error, response } = yield call(getCall, `/users/getNonce/${payload}`);
  if (error) EventBus.publish("error", error['response']['data']['message']);
  else if (response) yield put(setNonce(response['data']['body']));
  yield put(toggleLogin(false));
};

function* login({ payload, history }) {
  const { error, response } = yield call(postCall, { path: '/users/adminLoginWithMetaMask', payload });

  if (error) EventBus.publish("error", error['response']['data']['message']);
  else if (response) {

    const decoded = jwtDecode(response["data"]["body"]["token"]);
    if (decoded["role"] !== "admin") {
      EventBus.publish("error", "Can't login through User account ");
      return;
    }
    let data = {
      token: response['data']['body']['token'],
      publicAddress: payload['publicAddress']
    }
    yield put(setLoginData(data));
    EventBus.publish("success", response['data']['body']['message'])
    setTimeout(() => history.push('/home'), 1000);
  }
  yield put(toggleLogin(false));
};



function* actionWatcher() {
  yield takeEvery('LOGIN', login);
  yield takeEvery('GET_NONCE', getNonce);
};

export default function* rootSaga() {
  yield all([actionWatcher()]);
};

function postCall({ path, payload }) {
  return axios
    .post(path, payload)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function getCall(path) {
  return axios
    .get(path)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function deleteCall(path) {
  return axios
    .delete(path)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};

function putCall({ path, payload }) {
  return axios
    .put(path, payload)
    .then(response => ({ response }))
    .catch(error => {
      if (error.response.status === 401) EventBus.publish("tokenExpired");
      return { error };
    });
};
