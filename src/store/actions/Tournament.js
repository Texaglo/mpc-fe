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

