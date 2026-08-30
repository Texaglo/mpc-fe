export const getUsers = (params) => ({
    type: 'GET_USERS',
    payload: params
});

export const setUsers = (data) => ({
    type: 'SET_USERS',
    payload: data
});

export const toggleFreezeUser = (data) => ({
    type: 'TOGGLE_FREEZE_USER',
    payload: data
});

export const updateUserFreezeStatus = (data) => ({
    type: 'UPDATE_USER_FREEZE_STATUS',
    payload: data
});

export const getUserTransactions = (userId) => ({
    type: 'GET_USER_TRANSACTIONS',
    payload: userId
});

export const setUserTransactions = (data) => ({
    type: 'SET_USER_TRANSACTIONS',
    payload: data
});

export const adjustUserBalance = (data) => ({
    type: 'ADJUST_USER_BALANCE',
    payload: data
});

export const forceLogoutUser = (data) => ({
    type: 'FORCE_LOGOUT_USER',
    payload: data
});

export const getUserInventory = (data) => ({
    type: 'GET_USER_INVENTORY',
    payload: data
});

export const setUserInventory = (data) => ({
    type: 'SET_USER_INVENTORY',
    payload: data
});

export const getInventoryCatalog = (data = {}) => ({
    type: 'GET_INVENTORY_CATALOG',
    payload: data
});

export const setInventoryCatalog = (data) => ({
    type: 'SET_INVENTORY_CATALOG',
    payload: data
});

export const grantInventoryItem = (data) => ({
    type: 'GRANT_INVENTORY_ITEM',
    payload: data
});

export const revokeInventoryItem = (data) => ({
    type: 'REVOKE_INVENTORY_ITEM',
    payload: data
});
