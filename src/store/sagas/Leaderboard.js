import axios from 'axios';
import EventBus from 'eventing-bus';
import { setPlayersLeaderboard, setFactionalLeaderboard } from "../actions/Leaderboard";
import { toggleLogin, setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET PLAYERS LEADERBOARD *****************************/

function* getPlayersLeaderboard() {
    const { error, response } = yield call(getCall, '/users/leaderboard');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setPlayersLeaderboard(response['data']['body']));
    yield put(setLoader(false));
    yield put(toggleLogin(false));
};

/************************** GET FACTIONAL LEADERBOARD *****************************/

function* getFactionalLeaderboard() {
    const { error, response } = yield call(getCall, '/users/factionalLeaderboard');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setFactionalLeaderboard(response['data']['body']));
    yield put(setLoader(false));
    yield put(toggleLogin(false));
};




function* actionWatcher() {
    yield takeEvery('GET_PLAYERS_LEADERBOARD', getPlayersLeaderboard);
    yield takeEvery('GET_FACTIONAL_LEADERBOARD', getFactionalLeaderboard);

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
