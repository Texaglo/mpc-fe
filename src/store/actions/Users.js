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
