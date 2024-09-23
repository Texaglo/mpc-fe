import axios from 'axios';
import EventBus from 'eventing-bus';
import { setAchievements } from "../actions/Achievement";
import { setLoader } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL ACHIEVEMENTS *****************************/

function* getAchievements() {
    const { error, response } = yield call(getCall, '/achievements/adminAchievements');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setAchievements(response['data']['body']));
    yield put(setLoader(false));
};

/************************** UPDATE ACHIEVMENT *****************************/

function* updateAchievement({ payload }) {
    const { error, response } = yield call(putCall, { path: '/achievements/updateAchievement', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ACHIEVEMENTS" });
        EventBus.publish("success", response['data']['message']);
    }
}



function* actionWatcher() {
    yield takeEvery('GET_ACHIEVEMENTS', getAchievements);
    yield takeEvery('UPDATE_ACHIEVEMENT', updateAchievement);

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
