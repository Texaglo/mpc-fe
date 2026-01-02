export const getPlayersLeaderboard = (params) => ({
    type: 'GET_PLAYERS_LEADERBOARD',
    payload: params
});

export const setPlayersLeaderboard = (data) => ({
    type: 'SET_PLAYERS_LEADERBOARD',
    payload: data,
});

export const getFactionalLeaderboard = (params) => ({
    type: 'GET_FACTIONAL_LEADERBOARD',
    payload: params
})

export const setFactionalLeaderboard = (data) => ({
    type: 'SET_FACTIONAL_LEADERBOARD',
    payload: data,
})