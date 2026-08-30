import axios from 'axios';
import EventBus from 'eventing-bus';
import { setPlayersLeaderboard, setFactionalLeaderboard } from "../actions/Leaderboard";
import { toggleLogin, setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET PLAYERS LEADERBOARD *****************************/

function* getPlayersLeaderboard({ payload }) {
    const period = payload?.period || 'all';
    const params = new URLSearchParams({ period, limit: '100' });
    if (payload?.economy) params.set('economy', payload.economy === 'all' ? 'ALL' : payload.economy);
    if (payload?.metric) params.set('metric', payload.metric);
    let { error, response } = yield call(getCall, `/admin/leaderboards?${params.toString()}`);
    // The richer operator endpoint is additive. Older deployed backends can
    // continue serving the existing leaderboard until they are upgraded.
    if (error?.response?.status === 404) {
        ({ error, response } = yield call(getCall, `/users/leaderboard?period=${encodeURIComponent(period)}`));
    }
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to load leaderboard');
    else if (response) yield put(setPlayersLeaderboard(response['data']['body']));
    yield put(setLoader(false));
    yield put(toggleLogin(false));
};

/************************** GET FACTIONAL LEADERBOARD *****************************/

function* getFactionalLeaderboard({ payload }) {
    const period = payload?.period || 'all';
    const { error, response } = yield call(getCall, `/users/factionalLeaderboard?period=${period}`);
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
