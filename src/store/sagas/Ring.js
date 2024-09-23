import axios from 'axios';
import EventBus from 'eventing-bus';
import { setAllRingGames } from "../actions/Ring";
import { toggleLogin, setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL RING GAMES *****************************/

function* getAllRingGames() {
  const { error, response } = yield call(getCall, '/ring/getRingGames');
  if (error) EventBus.publish("error", error['response']['data']['message']);
  else if (response) yield put(setAllRingGames(response['data']['body']));
  yield put(setLoader(false));
  yield put(toggleLogin(false));
};

/************************** CREATE NEW RING GAME *****************************/

function* addRingGame({ payload }) {
  const { error, response } = yield call(postCall, { path: '/ring/createRing', payload });
  if (error) EventBus.publish("error", error['response']['data']['message']);
  else if (response) {
    yield put({ type: "GET_ALL_RING_GAMES" });
    EventBus.publish("success", response['data']['message']);
  }
}

/************************** UPDATE RING GAME *****************************/

function* UpdateRingGame({ payload }) {
  console.log("🚀 ~ file: Ring.js:22 ~ function*UpdateRingGame ~ payload:", payload)
  const { error, response } = yield call(putCall, { path: '/ring/updateRingGame', payload });
  if (error) EventBus.publish("error", error['response']['data']['message']);
  else if (response) {
    yield put({ type: "GET_ALL_RING_GAMES" });
    EventBus.publish("success", response['data']['message']);
  }
}

/************************** DELETE RING GAME *****************************/

function* deleteRingGame({ payload }) {
  console.log("🚀 ~ file: Ring.js:22 ~ function*UpdateRingGame ~ payload:", payload)
  const { error, response } = yield call(deleteCall, `ring/deleteRingGame/${payload}`);
  if (error) EventBus.publish("error", error['response']['data']['message']);
  else if (response) {
    yield put({ type: "GET_ALL_RING_GAMES" });
    EventBus.publish("success", response['data']['message']);
  }
}


function* actionWatcher() {
  yield takeEvery('GET_ALL_RING_GAMES', getAllRingGames);
  yield takeEvery('ADD_RING_GAME', addRingGame);
  yield takeEvery('UPDATE_RING_GAME', UpdateRingGame);
  yield takeEvery('DELETE_RING_GAME', deleteRingGame);
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
