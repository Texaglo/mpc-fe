import axios from 'axios';
import EventBus from 'eventing-bus';
import { setPendingWithdrawals } from "../actions/PendingWithdrawals";
import { setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET PENDING WITHDRAWALS *****************************/
function* getPendingWithdrawals() {
    const { error, response } = yield call(getCall, '/wallet/withdrawals/pending');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setPendingWithdrawals(response['data']['body']));
    yield put(setLoader(false));
};

/************************** APPROVE WITHDRAWAL *****************************/
function* approveWithdrawal({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, { 
        path: `/wallet/withdrawals/approve`,
        payload: {
            withdrawalId: payload.withdrawalId,
            adminNotes: payload.adminNotes
        }
    });
    if (error) {
        EventBus.publish("error", error['response']['data']['message']);
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || "Withdrawal approved successfully");
        // Refresh the pending withdrawals list
        yield put({ type: "GET_PENDING_WITHDRAWALS" });
    }
};

/************************** REJECT WITHDRAWAL *****************************/
function* rejectWithdrawal({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, { 
        path: `/wallet/withdrawals/reject`,
        payload: {
            withdrawalId: payload.withdrawalId,
            adminNotes: payload.adminNotes
        }
    });
    if (error) {
        EventBus.publish("error", error['response']['data']['message']);
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || "Withdrawal rejected successfully");
        // Refresh the pending withdrawals list
        yield put({ type: "GET_PENDING_WITHDRAWALS" });
    }
};

function* actionWatcher() {
    yield takeEvery('GET_PENDING_WITHDRAWALS', getPendingWithdrawals);
    yield takeEvery('APPROVE_WITHDRAWAL', approveWithdrawal);
    yield takeEvery('REJECT_WITHDRAWAL', rejectWithdrawal);
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