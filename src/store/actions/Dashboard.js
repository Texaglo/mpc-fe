export const getDashboardStats = (params) => ({
    type: 'GET_DASHBOARD_STATS',
    payload: params
});

export const setDashboardStats = (data) => ({
    type: 'SET_DASHBOARD_STATS',
    payload: data
});

export const getDashboardCharts = (params) => ({
    type: 'GET_DASHBOARD_CHARTS',
    payload: params
});

export const setDashboardCharts = (data) => ({
    type: 'SET_DASHBOARD_CHARTS',
    payload: data
});

export const getAuditLogs = (params) => ({
    type: 'GET_AUDIT_LOGS',
    payload: params
});

export const setAuditLogs = (data) => ({
    type: 'SET_AUDIT_LOGS',
    payload: data
});

export const getHouseMpceLedger = (params) => ({
    type: 'GET_HOUSE_MPCE_LEDGER',
    payload: params
});

export const setHouseMpceLedger = (data) => ({
    type: 'SET_HOUSE_MPCE_LEDGER',
    payload: data
});
