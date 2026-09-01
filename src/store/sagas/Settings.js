import axios from 'axios';
import EventBus from 'eventing-bus';
import { setSettings, setSettingUpdated } from "../actions/Settings";
import { setLoader } from "../actions/Auth";
import { all, takeEvery, call, put } from 'redux-saga/effects';

/************************** GET SETTINGS *****************************/
function* getSettings() {
    yield put(setLoader(true));
    const { error, response } = yield call(getCall, '/admin/settings');
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to load settings');
    else if (response) yield put(setSettings(response['data']['body']['settings']));
    yield put(setLoader(false));
}

/************************** UPDATE SETTING *****************************/
function* updateSetting({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(putCall, '/admin/settings', payload);
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to update that setting');
    else if (response) {
        EventBus.publish("success", response['data']['message']);
        yield put(setSettingUpdated(response['data']['body']));
    }
    yield put(setLoader(false));
}

function* actionWatcher() {
    yield takeEvery('GET_SETTINGS', getSettings);
    yield takeEvery('UPDATE_SETTING', updateSetting);
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

function putCall(path, data) {
    return axios
        .put(path, data)
        .then(response => ({ response }))
        .catch(error => {
            if (error.response?.status === 401) EventBus.publish("tokenExpired");
            return { error };
        });
}
