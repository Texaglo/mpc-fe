import axios from 'axios';
import EventBus from 'eventing-bus';
import { setUsers, updateUserFreezeStatus } from "../actions/Users";
import { setLoader } from "../actions/Auth";
import { all, takeEvery, call, put } from 'redux-saga/effects';

/************************** GET USERS *****************************/
function* getUsers({ payload }) {
    yield put(setLoader(true));
    const { search = '', page = 1, limit = 20 } = payload || {};
    const queryParams = new URLSearchParams({ search, page, limit }).toString();
    const { error, response } = yield call(getCall, `/admin/users?${queryParams}`);
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setUsers(response['data']['body']));
    yield put(setLoader(false));
}

/************************** TOGGLE FREEZE USER *****************************/
function* toggleFreezeUser({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/admin/users/freeze`,
        payload: {
            userId: payload.userId,
            freeze: payload.freeze
        }
    });
    if (error) {
        EventBus.publish("error", error['response']['data']['message']);
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || "User freeze status updated successfully");
        yield put(updateUserFreezeStatus({
            userId: payload.userId,
            isFrozen: payload.freeze
        }));
        yield put(setLoader(false));
    }
}

function* actionWatcher() {
    yield takeEvery('GET_USERS', getUsers);
    yield takeEvery('TOGGLE_FREEZE_USER', toggleFreezeUser);
}

export default function* rootSaga() {
    yield all([actionWatcher()]);
}

function postCall({ path, payload }) {
    return axios
        .post(path, payload)
        .then(response => ({ response }))
        .catch(error => {
            if (error.response?.status === 401) EventBus.publish("tokenExpired");
            return { error };
        });
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
