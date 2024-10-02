import axios from 'axios';
import EventBus from 'eventing-bus';
import { setWithdrawSwap } from "../actions/WithdrawSwap";
import { setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL SWAPS *****************************/
function* getWithdrawSwaps() {
    const { error, response } = yield call(getCall, '/swap/');
    if (error) EventBus.publish("error", error['response']['data']);
    else if (response) yield put(setWithdrawSwap(response['data']['body']));
    yield put(setLoader(false));
};

/************************** UPDATE WITHDRAW SWAP *****************************/
function* updateWithdrawSwap({ payload }) {
    const { error, response } = yield call(putCall, { path: '/swap/', payload });
    if (error) EventBus.publish("error", error['response']['data']);
    else if (response) {
        yield put({ type: "GET_WITHDRAWAL_SWAPS" });
        EventBus.publish("success", response['data']['message']);
    }
};

function* actionWatcher() {
    yield takeEvery('GET_WITHDRAWAL_SWAPS', getWithdrawSwaps);
    yield takeEvery('UPDATE_WITHDRAWAL_SWAP', updateWithdrawSwap);
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
