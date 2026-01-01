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
