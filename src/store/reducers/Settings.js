const INITIAL_STATE = {
    settings: [],
    loading: false,
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'GET_SETTINGS':
            return {
                ...state,
                loading: true
            };

        case 'SET_SETTINGS':
            return {
                ...state,
                settings: action.payload || [],
                loading: false,
                error: null
            };

        case 'SET_SETTING_UPDATED':
            return {
                ...state,
                settings: state.settings.map(setting =>
                    setting.key === action.payload.key
                        ? { ...setting, value: action.payload.value, updatedAt: action.payload.updatedAt }
                        : setting
                ),
                loading: false
            };

        default:
            return state;
    }
};
