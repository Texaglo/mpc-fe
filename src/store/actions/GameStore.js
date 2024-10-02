export const getGameStores = () => ({
    type: 'GET_GAME_STORES',
});

export const setGameStore = (data) => ({
    type: 'SET_GAME_STORE',
    payload: data
});

export const updateGameStore = (data) => ({
    type: 'UPDATE_GAME_STORE',
    payload: data
});

export const createGameStore = (data) => ({
    type: 'CREATE_GAME_STORE',
    payload: data
});