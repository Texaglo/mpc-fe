import axios from 'axios';
import EventBus from 'eventing-bus';
import { setAllTournaments } from "../actions/Tournament";
import { setLoader, toggleLogin } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL TOURNAMENTS *****************************/

function* getAllTournaments() {
    const { error, response } = yield call(getCall, '/tournaments/getTournaments');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setAllTournaments(response['data']['body']));
    yield put(setLoader(false));
};

/************************** CREATE NEW TOURNAMENTS *****************************/

function* addTournament({ payload }) {
    const { error, response } = yield call(postCall, { path: '/tournaments/createTournament', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_TOURNAMENTS" });
        EventBus.publish("success", response['data']['message']);
    }
}

/************************** UPDATE TOURNAMENT *****************************/

function* updateTournament({ payload }) {
    const { error, response } = yield call(putCall, { path: '/tournaments/updateTournament', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_TOURNAMENTS" });
        EventBus.publish("success", response['data']['message']);
    }
}

/************************** DELETE TOURNAMENT *****************************/

function* deleteTournament({ payload }) {
    const { error, response } = yield call(deleteCall, `/tournaments/deleteTournament/${payload}`);
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_TOURNAMENTS" });
        yield put({ type: "GET_ALL_TEMPLATES" });
        EventBus.publish("success", response['data']['message']);
    }
}


function* actionWatcher() {
    yield takeEvery('GET_ALL_TOURNAMENTS', getAllTournaments);
    yield takeEvery('ADD_TOURNAMENT', addTournament);
    yield takeEvery('UPDATE_TOURNAMENT', updateTournament);
    yield takeEvery('DELETE_TOURNAMENT', deleteTournament);
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
