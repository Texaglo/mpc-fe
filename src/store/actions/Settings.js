export const getSettings = () => ({
    type: 'GET_SETTINGS'
});

export const setSettings = (data) => ({
    type: 'SET_SETTINGS',
    payload: data
});

export const updateSetting = (data) => ({
    type: 'UPDATE_SETTING',
    payload: data
});

export const setSettingUpdated = (data) => ({
    type: 'SET_SETTING_UPDATED',
    payload: data
});
