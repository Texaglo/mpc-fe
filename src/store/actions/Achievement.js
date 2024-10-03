export const getAchievements = () => ({
    type: 'GET_ACHIEVEMENTS',
});

export const setAchievements = (data) => ({
    type: 'SET_ACHIEVEMENTS',
    payload: data
});