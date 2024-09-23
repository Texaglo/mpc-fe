export const getAllRingGames = () => ({
  type: 'GET_ALL_RING_GAMES',
});

export const setAllRingGames = (data) => ({
  type: 'SET_ALL_RING_GAMES',
  payload: data,
});

export const addRingGame = (data) => ({
  type: 'ADD_RING_GAME',
  payload: data,
});

export const updateRingGame = (data) => ({
  type: 'UPDATE_RING_GAME',
  payload: data,
});

export const deleteRingGame = (data) => ({
  type: 'DELETE_RING_GAME',
  payload: data,
})
