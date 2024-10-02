import axios from 'axios';
import EventBus from 'eventing-bus';
import { setGameStore } from "../actions/GameStore";
import { setLoader, toggleModal } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL GAME ITEMS *****************************/
function* getGameStores() {
    const { error, response } = yield call(getCall, '/items/getAllItems');
    if (error) EventBus.publish("error", error['response']['data']);
    else if (response) yield put(setGameStore(response['data']['body']));
    yield put(setLoader(false));
};

/************************** UPDATE GAME STORE ITEM *****************************/
function* updateGameStore({ payload }) {
    yield put(setLoader(true))
    const { error, response } = yield call(putCall, { path: `/items/updateItem/${payload['_id']}`, payload: { amount: payload['amount'] } });
    if (error) {
        EventBus.publish("error", error['response']['data']);
        yield put(setLoader(false))
    }
    else if (response) {
        yield put({ type: "GET_GAME_STORES" });
        EventBus.publish("success", response['data']['message']);
        yield put(setLoader(false))
    }
};

/************************** CREATE GAME STORE ITEM *****************************/
function* createGameStore({ payload }) {
    const { error, response } = yield call(postCall, { path: '/items/createItem', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
      yield put({ type: "GET_GAME_STORES" });
      EventBus.publish("success", response['data']['message']);
    }
  }

function* actionWatcher() {
    yield takeEvery('GET_GAME_STORES', getGameStores);
    yield takeEvery('UPDATE_GAME_STORE', updateGameStore);
    yield takeEvery('CREATE_GAME_STORE', createGameStore);
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
