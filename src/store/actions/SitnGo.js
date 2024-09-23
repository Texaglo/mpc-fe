export const addSitnGoGame = (data) => ({
    type: 'ADD_SITNGO_GAME',
    payload: data,
});

export const getAllSitnGoGames = () => ({
    type: 'GET_ALL_SITNGO_GAMES',
});
export const setAllSitnGoGames = (data) => ({
    type: 'SET_ALL_SITNGO_GAMES',
    payload: data,
});
export const updateSitnGoGame = (data) => ({
    type: 'UPDATE_SITNGO_GAME',
    payload: data,
});
export const deleteSitnGoGame = (data) => ({
    type: 'DELETE_SITNGO_GAME',
    payload: data,
});

