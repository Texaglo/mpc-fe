export const getAchievements = () => ({
    type: 'GET_ACHIEVEMENTS',
});

export const setAchievements = (data) => ({
    type: 'SET_ACHIEVEMENTS',
    payload: data
});

export const updateAchievement = (data) => ({
    type: 'UPDATE_ACHIEVEMENT',
    payload: data
});
