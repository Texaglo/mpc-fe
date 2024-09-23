import axios from 'axios';
import EventBus from 'eventing-bus';
import { setAllTournaments, setAllTemplates } from "../actions/Template";
import { setLoader, toggleLogin } from "../actions/Auth"
import { all, takeEvery, call, put } from 'redux-saga/effects';


/************************** GET ALL TEMPLATES *****************************/

function* getAllTemplates() {
    const { error, response } = yield call(getCall, '/template/getTemplates');
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) yield put(setAllTemplates(response['data']['body']));
    yield put(setLoader(false));
};

/************************** CREATE NEW TEMPLATE *****************************/

function* createTemplate({ payload }) {
    const { error, response } = yield call(postCall, { path: '/template/createTemplate', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_TEMPLATES" });
        EventBus.publish("success", response['data']['message']);
    }
}


/************************** UPDATE TEMPLATE *****************************/

function* updateTemplate({ payload }) {
    const { error, response } = yield call(putCall, { path: '/template/updateTemplate', payload });
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_TEMPLATES" });
        EventBus.publish("success", response['data']['message']);
    }
}


/************************** DELETE TEMPLATE *****************************/

function* deleteTemplate({ payload }) {
    const { error, response } = yield call(deleteCall, `/template/deleteTemplate/${payload}`);
    if (error) EventBus.publish("error", error['response']['data']['message']);
    else if (response) {
        yield put({ type: "GET_ALL_TEMPLATES" });
        EventBus.publish("success", response['data']['message']);
    }
}



function* actionWatcher() {
    yield takeEvery('CREATE_TEMPLATE', createTemplate);
    yield takeEvery('UPDATE_TEMPLATE', updateTemplate);
    yield takeEvery('GET_ALL_TEMPLATES', getAllTemplates);
    yield takeEvery('DELETE_TEMPLATE', deleteTemplate);
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
