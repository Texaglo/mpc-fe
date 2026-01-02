export const getDashboardStats = () => ({
    type: 'GET_DASHBOARD_STATS',
});

export const setDashboardStats = (data) => ({
    type: 'SET_DASHBOARD_STATS',
    payload: data
});
