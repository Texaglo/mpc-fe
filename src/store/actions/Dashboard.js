export const getDashboardStats = () => ({
    type: 'GET_DASHBOARD_STATS',
});

export const setDashboardStats = (data) => ({
    type: 'SET_DASHBOARD_STATS',
    payload: data
});

export const getDashboardCharts = () => ({
    type: 'GET_DASHBOARD_CHARTS',
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
