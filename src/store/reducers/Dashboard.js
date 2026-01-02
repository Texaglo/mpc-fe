const INITIAL_STATE = {
    stats: null,
    charts: null,
    auditLogs: [],
    auditLogsPagination: {
        currentPage: 1,
        totalPages: 1,
        totalLogs: 0
    },
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

        case 'SET_DASHBOARD_CHARTS':
            return {
                ...state,
                charts: action.payload
            };

        case 'SET_AUDIT_LOGS':
            return {
                ...state,
                auditLogs: action.payload?.logs || [],
                auditLogsPagination: action.payload?.pagination || state.auditLogsPagination
            };

        default:
            return state;
    }
};
