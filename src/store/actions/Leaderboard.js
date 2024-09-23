export const getPlayersLeaderboard = () => ({
    type: 'GET_PLAYERS_LEADERBOARD',
});

export const setPlayersLeaderboard = (data) => ({
    type: 'SET_PLAYERS_LEADERBOARD',
    payload: data,
});

export const getFactionalLeaderboard = () => ({
    type: 'GET_FACTIONAL_LEADERBOARD',
})

export const setFactionalLeaderboard = (data) => ({
    type: 'SET_FACTIONAL_LEADERBOARD',
    payload: data,
})