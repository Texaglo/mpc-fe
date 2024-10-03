export const addTournament = (data) => ({
    type: 'ADD_TOURNAMENT',
    payload: data,
});

export const getAllTournaments = () => ({
    type: 'GET_ALL_TOURNAMENTS',
});

export const setAllTournaments = (data) => ({
    type: 'SET_ALL_TOURNAMENTS',
    payload: data,
});

export const updateTournament = (data) => ({
    type: 'UPDATE_TOURNAMENT',
    payload: data,
});

export const deleteTournament = (data) => ({
    type: 'DELETE_TOURNAMENT',
    payload: data,
});

export const updateWinners = (data) => ({
    type: 'UPDATE_WINNERS',
    payload: data,
});

export const getWinners = () => ({
    type: 'GET_WINNERS',
});

export const setWinners = (data) => ({
    type: 'SET_WINNERS',
    payload: data,
});
