const INITIAL_STATE = {
    stats: null,
    loading: false,
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'GET_DASHBOARD_STATS':
            return {
                ...state,
                loading: true
            };

        case 'SET_DASHBOARD_STATS':
            return {
                ...state,
                stats: action.payload,
                loading: false,
                error: null
            };

        default:
            return state;
    }
};
