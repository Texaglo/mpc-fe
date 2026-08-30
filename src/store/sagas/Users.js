import axios from 'axios';
import EventBus from 'eventing-bus';
import { setUsers, updateUserFreezeStatus, setUserTransactions, setUserInventory, setInventoryCatalog } from "../actions/Users";
import { setLoader } from "../actions/Auth";
import { all, takeEvery, call, put } from 'redux-saga/effects';

/************************** GET USERS *****************************/
function* getUsers({ payload }) {
    const { search = '', page = 1, limit = 20, silent = false } = payload || {};
    if (!silent) yield put(setLoader(true));
    const queryParams = new URLSearchParams({ search, page, limit }).toString();
    const { error, response } = yield call(getCall, `/admin/users?${queryParams}`);
    if (error && !silent) EventBus.publish("error", error?.response?.data?.message || 'Unable to refresh users');
    else if (response) yield put(setUsers(response['data']['body']));
    if (!silent) yield put(setLoader(false));
}

/************************** TOGGLE FREEZE USER *****************************/
function* toggleFreezeUser({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/admin/users/freeze`,
        payload: {
            userId: payload.userId,
            freeze: payload.freeze,
            reason: payload.reason
        }
    });
    if (error) {
        EventBus.publish("error", error['response']['data']['message']);
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", payload.freeze ? "User banned successfully" : "User unbanned successfully");
        yield put(updateUserFreezeStatus({
            userId: payload.userId,
            isFrozen: payload.freeze
        }));
        yield put(setLoader(false));
    }
}

/************************** GET USER TRANSACTIONS *****************************/
function* getUserTransactions({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(getCall, `/admin/users/${payload}/transactions`);
    if (error) {
        EventBus.publish("error", error['response']['data']['message']);
        yield put(setLoader(false));
    } else if (response) {
        yield put(setUserTransactions(response['data']['body']['transactions'] || []));
        yield put(setLoader(false));
    }
}

/************************** ADJUST USER BALANCE *****************************/
function* adjustUserBalance({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/admin/users/adjust-balance`,
        payload: {
            userId: payload.userId,
            amount: payload.amount,
            reason: payload.reason,
            asset: payload.asset
        }
    });
    if (error) {
        EventBus.publish("error", error['response']['data']['message']);
        yield put(setLoader(false));
    } else if (response) {
        EventBus.publish("success", response['data']['message'] || "Balance adjusted successfully");
        // Refresh the users list to get updated balance
        yield put({ type: 'GET_USERS', payload: { page: 1, limit: 20 } });
    }
}

/************************** FORCE LOGOUT USER *****************************/
function* forceLogoutUser({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/admin/users/force-logout`,
        payload: { userId: payload.userId, reason: payload.reason }
    });
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to revoke sessions');
    else if (response) EventBus.publish("success", response['data']['message'] || 'Active sessions revoked');
    yield put(setLoader(false));
}

function inventoryQuery(payload = {}) {
    const params = new URLSearchParams();
    ['page', 'limit', 'search', 'status'].forEach(key => {
        if (payload[key] !== undefined && payload[key] !== '') params.set(key, payload[key]);
    });
    return params.toString();
}

function* getUserInventory({ payload }) {
    const query = inventoryQuery(payload);
    const { error, response } = yield call(getCall, `/admin/users/${payload.userId}/inventory${query ? `?${query}` : ''}`);
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to load player inventory');
    else if (response) yield put(setUserInventory(response['data']['body']));
}

function* getInventoryCatalog({ payload = {} }) {
    const params = new URLSearchParams({ page: 1, limit: payload.limit || 100 });
    if (payload.search) params.set('search', payload.search);
    if (payload.isActive !== undefined && payload.isActive !== '') params.set('isActive', payload.isActive);
    const { error, response } = yield call(getCall, `/marketplace/admin/items?${params.toString()}`);
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to search catalog');
    else if (response) yield put(setInventoryCatalog(response['data']['body']));
}

function* grantInventoryItem({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/admin/users/${payload.userId}/inventory/grant`,
        payload: {
            itemId: payload.itemId,
            quantity: payload.quantity,
            reason: payload.reason,
            requestId: payload.requestId
        }
    });
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to grant inventory item');
    else if (response) {
        EventBus.publish("success", response['data']['message'] || 'Inventory item granted');
        yield put({ type: 'GET_USER_INVENTORY', payload: { userId: payload.userId, page: 1, limit: 25, status: payload.status || 'all', search: payload.search || '' } });
    }
    yield put(setLoader(false));
}

function* revokeInventoryItem({ payload }) {
    yield put(setLoader(true));
    const { error, response } = yield call(postCall, {
        path: `/admin/users/${payload.userId}/inventory/${payload.inventoryId}/revoke`,
        payload: { reason: payload.reason }
    });
    if (error) EventBus.publish("error", error?.response?.data?.message || 'Unable to revoke inventory item');
    else if (response) {
        EventBus.publish("success", response['data']['message'] || 'Inventory item revoked');
        yield put({ type: 'GET_USER_INVENTORY', payload: { userId: payload.userId, page: payload.page || 1, limit: 25, status: payload.status || 'all', search: payload.search || '' } });
    }
    yield put(setLoader(false));
}

function* actionWatcher() {
    yield takeEvery('GET_USERS', getUsers);
    yield takeEvery('TOGGLE_FREEZE_USER', toggleFreezeUser);
    yield takeEvery('GET_USER_TRANSACTIONS', getUserTransactions);
    yield takeEvery('ADJUST_USER_BALANCE', adjustUserBalance);
    yield takeEvery('FORCE_LOGOUT_USER', forceLogoutUser);
    yield takeEvery('GET_USER_INVENTORY', getUserInventory);
    yield takeEvery('GET_INVENTORY_CATALOG', getInventoryCatalog);
    yield takeEvery('GRANT_INVENTORY_ITEM', grantInventoryItem);
    yield takeEvery('REVOKE_INVENTORY_ITEM', revokeInventoryItem);
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
