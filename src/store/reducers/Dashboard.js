const INITIAL_STATE = {
    stats: null,
    charts: null,
    auditLogs: [],
    auditLogsPagination: {
        currentPage: 1,
        totalPages: 1,
        totalLogs: 0
    },
    auditLogActionTypes: [],
    auditLogsLoading: false,
    houseMpceLedger: {
        summary: {},
        entries: [],
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalEntries: 0,
            limit: 25
        }
    },
    houseMpceLedgerLoading: false,
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
                auditLogsPagination: action.payload?.pagination || state.auditLogsPagination,
                auditLogActionTypes: action.payload?.actionTypes || state.auditLogActionTypes,
                auditLogsLoading: false
            };

        case 'GET_AUDIT_LOGS':
            return {
                ...state,
                auditLogsLoading: true
            };

        case 'GET_HOUSE_MPCE_LEDGER':
            return {
                ...state,
                houseMpceLedgerLoading: true
            };

        case 'SET_HOUSE_MPCE_LEDGER':
            return {
                ...state,
                houseMpceLedger: action.payload || INITIAL_STATE.houseMpceLedger,
                houseMpceLedgerLoading: false
            };

        default:
            return state;
    }
};
