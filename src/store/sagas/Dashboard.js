import axios from 'axios';
import EventBus from 'eventing-bus';
import { setDashboardStats, setDashboardCharts, setAuditLogs } from "../actions/Dashboard";
import { setLoader } from "../actions/Auth";
import { all, takeEvery, call, put } from 'redux-saga/effects';

/************************** GET DASHBOARD STATS *****************************/
function* getDashboardStats() {
    yield put(setLoader(true));
    const { error, response } = yield call(getCall, '/admin/dashboard');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setDashboardStats(response['data']['body']));
    yield put(setLoader(false));
}

/************************** GET DASHBOARD CHARTS *****************************/
function* getDashboardCharts() {
    const { error, response } = yield call(getCall, '/admin/dashboard/charts');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setDashboardCharts(response['data']['body']));
}

/************************** GET AUDIT LOGS *****************************/
function* getAuditLogs({ payload }) {
    const { page = 1, limit = 10 } = payload || {};
    const queryParams = new URLSearchParams({ page, limit }).toString();
    const { error, response } = yield call(getCall, `/admin/logs?${queryParams}`);
    if (error) {
        // Silently fail for audit logs - don't show error toast
        console.log('Audit logs fetch failed:', error?.response?.data?.message || error);
    }
    else if (response) {
        console.log('Audit logs response:', response['data']['body']);
        yield put(setAuditLogs(response['data']['body']));
    }
}

function* actionWatcher() {
    yield takeEvery('GET_DASHBOARD_STATS', getDashboardStats);
    yield takeEvery('GET_DASHBOARD_CHARTS', getDashboardCharts);
    yield takeEvery('GET_AUDIT_LOGS', getAuditLogs);
}

export default function* rootSaga() {
    yield all([actionWatcher()]);
}

function getCall(path) {
    return axios
        .get(path)
        .then(response => ({ response }))
        .catch(error => {
            if (error.response?.status === 401) EventBus.publish("tokenExpired");
            return { error };
        });
}
