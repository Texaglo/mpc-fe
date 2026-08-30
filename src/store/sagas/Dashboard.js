import axios from 'axios';
import EventBus from 'eventing-bus';
import { setDashboardStats, setDashboardCharts, setAuditLogs, setHouseMpceLedger } from "../actions/Dashboard";
import { setLoader } from "../actions/Auth";
import { all, takeEvery, call, put } from 'redux-saga/effects';

/************************** GET DASHBOARD STATS *****************************/
function* getDashboardStats({ payload }) {
    const { period, startDate, endDate, silent = false } = payload || {};
    if (!silent) yield put(setLoader(true));
    let queryParams = '';
    if (period) {
        queryParams = `?period=${period}`;
        if (period === 'custom' && startDate && endDate) {
            queryParams += `&startDate=${startDate}&endDate=${endDate}`;
        }
    }
    const { error, response } = yield call(getCall, `/admin/dashboard${queryParams}`);
    if (error && !silent) EventBus.publish("error", error?.response?.data?.message || 'Unable to refresh dashboard stats');
    else if (response) yield put(setDashboardStats(response['data']['body']));
    if (!silent) yield put(setLoader(false));
}

/************************** GET DASHBOARD CHARTS *****************************/
function* getDashboardCharts({ payload }) {
    const { period, startDate, endDate } = payload || {};
    let queryParams = '';
    if (period) {
        queryParams = `?period=${period}`;
        if (period === 'custom' && startDate && endDate) {
            queryParams += `&startDate=${startDate}&endDate=${endDate}`;
        }
    }
    const { error, response } = yield call(getCall, `/admin/dashboard/charts${queryParams}`);
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setDashboardCharts(response['data']['body']));
}

/************************** GET AUDIT LOGS *****************************/
function* getAuditLogs({ payload }) {
    const { page = 1, limit = 10, period, startDate, endDate, action, search } = payload || {};
    const params = { page, limit };
    if (period) {
        params.period = period;
        if (period === 'custom' && startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }
    }
    if (action) params.action = action;
    if (search) params.search = search;
    const queryParams = new URLSearchParams(params).toString();
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

/************************** GET HOUSE MPCE LEDGER *****************************/
function* getHouseMpceLedger({ payload }) {
    const params = payload || {};
    const queryParams = new URLSearchParams(params).toString();
    const { error, response } = yield call(getCall, `/admin/mpce-ledger${queryParams ? `?${queryParams}` : ''}`);
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to load the house MPCE ledger');
    else if (response) yield put(setHouseMpceLedger(response['data']['body']));
}

function* actionWatcher() {
    yield takeEvery('GET_DASHBOARD_STATS', getDashboardStats);
    yield takeEvery('GET_DASHBOARD_CHARTS', getDashboardCharts);
    yield takeEvery('GET_AUDIT_LOGS', getAuditLogs);
    yield takeEvery('GET_HOUSE_MPCE_LEDGER', getHouseMpceLedger);
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
