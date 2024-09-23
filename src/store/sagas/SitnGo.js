import axios from 'axios';
import EventBus from 'eventing-bus';
import { setAllSitnGoGames } from "../actions/SitnGo";
import { toggleLogin, setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL SITNGO GAMES *****************************/

function* getAllSitnGoGames() {
    const { error, response } = yield call(getCall, '/sitNgo/getAllSitnGo');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setAllSitnGoGames(response['data']['body']));
    yield put(setLoader(false));
    yield put(toggleLogin(false));
};

/************************** CREATE NEW SITNGO GAME *****************************/

function* addSitnGoGame({ payload }) {
    const { error, response } = yield call(postCall, { path: '/sitNgo/createSitnGo', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_SITNGO_GAMES" });
        EventBus.publish("success", response['data']['message']);
    }
}

/************************** UPDATE SITNGO GAME *****************************/

function* updateSitnGoGame({ payload }) {
    console.log("🚀 ~ file: Ring.js:22 ~ function*updateSitnGoGame ~ payload:", payload)
    const { error, response } = yield call(putCall, { path: '/sitNgo/updateSitnGoGame', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_SITNGO_GAMES" });
        EventBus.publish("success", response['data']['message']);
    }
}

/************************** DELETE SITNGO GAME *****************************/

function* deleteSitnGoGame({ payload }) {
    const { error, response } = yield call(deleteCall, `/sitNgo/deleteSitnGo/${payload}`);
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_SITNGO_GAMES" });
        EventBus.publish("success", response['data']['message']);
    }
}


function* actionWatcher() {
    yield takeEvery('GET_ALL_SITNGO_GAMES', getAllSitnGoGames);
    yield takeEvery('ADD_SITNGO_GAME', addSitnGoGame);
    yield takeEvery('UPDATE_SITNGO_GAME', updateSitnGoGame);
    yield takeEvery('DELETE_SITNGO_GAME', deleteSitnGoGame);
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
