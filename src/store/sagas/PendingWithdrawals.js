import axios from 'axios';
import EventBus from 'eventing-bus';
import {
    setPendingWithdrawals,
    setWalletBalance,
    setApprovedWithdrawals,
    setHotWalletRefills,
    setRefillRequirement,
} from "../actions/PendingWithdrawals";
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
            adminNotes: payload.adminNotes,
            payoutReferenceId: payload.payoutReferenceId
        }
    });
    if (error) {
        const errorData = error?.response?.data || {};
        if (errorData?.body?.code === 'HOT_WALLET_REFILL_REQUIRED') {
            yield put(setRefillRequirement(errorData.body));
            yield put({ type: 'GET_HOT_WALLET_REFILLS' });
            yield put({ type: 'GET_WALLET_BALANCE' });
        }
        EventBus.publish("error", errorData.message || 'Unable to approve withdrawal');
        yield put(setLoader(false));
    } else if (response) {
        yield put(setRefillRequirement(null));
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

/************************** GET APPROVED WITHDRAWALS *****************************/
function* getApprovedWithdrawals() {
    const { error, response } = yield call(getCall, '/wallet/withdrawals/approved');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setApprovedWithdrawals(response['data']['body']));
    yield put(setLoader(false));
};

/************************** GET WALLET BALANCE *****************************/
function* getWalletBalance({ payload }) {
    const silent = Boolean(payload?.silent);
    if (!silent) yield put(setLoader(true));
    const { error, response } = yield call(getCall, '/wallet/admin/wallets/balance');
    if (error) {
        if (!silent) EventBus.publish("error", error?.response?.data?.message || 'Unable to refresh wallet balances');
        if (!silent) yield put(setLoader(false));
    } else if (response) {
        yield put(setWalletBalance(response['data']['body']));
        if (!silent) yield put(setLoader(false));
    }
};

/************************** GET HOT WALLET REFILLS *****************************/
function* getHotWalletRefills() {
    const { error, response } = yield call(getCall, '/wallet/admin/hot-wallet/refills');
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to load refill requests');
    else if (response) yield put(setHotWalletRefills(response['data']['body']));
    yield put(setLoader(false));
};

/************************** REQUEST HOT WALLET REFILL *****************************/
function* requestHotWalletRefill({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: '/wallet/admin/hot-wallet/refills/request',
        payload: { amountSol: payload.amountSol, reason: payload.reason }
    });
    if (error) {
        EventBus.publish("error", error?.response?.data?.message || 'Unable to request refill');
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || 'Refill requested');
        yield put({ type: 'GET_HOT_WALLET_REFILLS' });
        yield put({ type: 'GET_WALLET_BALANCE' });
    }
};

/************************** APPROVE HOT WALLET REFILL *****************************/
function* approveHotWalletRefill({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/wallet/admin/hot-wallet/refills/${payload.refillId}/approve`,
        payload: { approvalNotes: payload.notes }
    });
    if (error) {
        EventBus.publish("error", error?.response?.data?.message || 'Unable to approve refill');
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || 'Distribution wallet refilled');
        yield put(setRefillRequirement(null));
        yield put({ type: 'GET_HOT_WALLET_REFILLS' });
        yield put({ type: 'GET_WALLET_BALANCE' });
    }
};

/************************** REJECT HOT WALLET REFILL *****************************/
function* rejectHotWalletRefill({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/wallet/admin/hot-wallet/refills/${payload.refillId}/reject`,
        payload: { rejectionReason: payload.notes }
    });
    if (error) {
        EventBus.publish("error", error?.response?.data?.message || 'Unable to reject refill');
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || 'Refill rejected');
        yield put({ type: 'GET_HOT_WALLET_REFILLS' });
        yield put({ type: 'GET_WALLET_BALANCE' });
    }
};

function* actionWatcher() {
    yield takeEvery('GET_PENDING_WITHDRAWALS', getPendingWithdrawals);
    yield takeEvery('GET_APPROVED_WITHDRAWALS', getApprovedWithdrawals);
    yield takeEvery('APPROVE_WITHDRAWAL', approveWithdrawal);
    yield takeEvery('REJECT_WITHDRAWAL', rejectWithdrawal);
    yield takeEvery('GET_WALLET_BALANCE', getWalletBalance);
    yield takeEvery('GET_HOT_WALLET_REFILLS', getHotWalletRefills);
    yield takeEvery('REQUEST_HOT_WALLET_REFILL', requestHotWalletRefill);
    yield takeEvery('APPROVE_HOT_WALLET_REFILL', approveHotWalletRefill);
    yield takeEvery('REJECT_HOT_WALLET_REFILL', rejectHotWalletRefill);
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
