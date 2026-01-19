import axios from 'axios';
import EventBus from 'eventing-bus';
import { setMarketplaceItems } from "../actions/Marketplace";
import { setLoader } from "../actions/Auth";
import { all, takeEvery, call, put } from 'redux-saga/effects';

/************************** GET ALL MARKETPLACE ITEMS *****************************/
function* getMarketplaceItems({ payload = {} }) {
    const { page = 1, limit = 20, itemType, isActive } = payload;
    let queryParams = `?page=${page}&limit=${limit}`;
    if (itemType) queryParams += `&itemType=${itemType}`;
    if (isActive !== undefined && isActive !== '') queryParams += `&isActive=${isActive}`;

    const { error, response } = yield call(getCall, `/marketplace/admin/items${queryParams}`);
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Failed to fetch items');
    else if (response) yield put(setMarketplaceItems(response['data']['body']));
    yield put(setLoader(false));
}

/************************** CREATE MARKETPLACE ITEM *****************************/
function* createMarketplaceItem({ payload }) {
    yield put(setLoader(true));
    const { _id, ...data } = payload;
    const { error, response } = yield call(postCall, { path: '/marketplace/createItem', payload: data });
    if (error) {
        EventBus.publish("error", error?.response?.data?.message || 'Create failed');
        yield put(setLoader(false));
    } else if (response) {
        yield put({ type: "GET_MARKETPLACE_ITEMS" });
        EventBus.publish("success", response['data']['message']);
        yield put(setLoader(false));
    }
}

/************************** UPDATE MARKETPLACE ITEM *****************************/
function* updateMarketplaceItem({ payload }) {
    yield put(setLoader(true));
    const { _id, ...updates } = payload;
    const { error, response } = yield call(putCall, {
        path: `/marketplace/updateItem/${_id}`,
        payload: updates
    });
    if (error) {
        EventBus.publish("error", error?.response?.data?.message || 'Update failed');
        yield put(setLoader(false));
    } else if (response) {
        yield put({ type: "GET_MARKETPLACE_ITEMS" });
        EventBus.publish("success", response['data']['message']);
        yield put(setLoader(false));
    }
}

/************************** TOGGLE MARKETPLACE ITEM STATUS *****************************/
function* toggleMarketplaceItem({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(putCall, {
        path: `/marketplace/toggleItem/${payload.itemId}`,
        payload: { isActive: payload.isActive }
    });
    if (error) {
        EventBus.publish("error", error?.response?.data?.message || 'Toggle failed');
        yield put(setLoader(false));
    } else if (response) {
        yield put({ type: "GET_MARKETPLACE_ITEMS" });
        EventBus.publish("success", response['data']['message'] || "Item status updated");
    }
}

function* actionWatcher() {
    yield takeEvery('GET_MARKETPLACE_ITEMS', getMarketplaceItems);
    yield takeEvery('CREATE_MARKETPLACE_ITEM', createMarketplaceItem);
    yield takeEvery('UPDATE_MARKETPLACE_ITEM', updateMarketplaceItem);
    yield takeEvery('TOGGLE_MARKETPLACE_ITEM', toggleMarketplaceItem);
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

function putCall({ path, payload }) {
    return axios
        .put(path, payload)
        .then(response => ({ response }))
        .catch(error => {
            if (error.response?.status === 401) EventBus.publish("tokenExpired");
            return { error };
        });
}
