import axios from 'axios';
import EventBus from 'eventing-bus';
import { setDashboardStats } from "../actions/Dashboard";
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

function* actionWatcher() {
    yield takeEvery('GET_DASHBOARD_STATS', getDashboardStats);
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
