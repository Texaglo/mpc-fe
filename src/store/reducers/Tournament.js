import { PURGE } from "redux-persist";

var initialState =
{
    allTournaments: [],
    allTemplates: [],
    winners: [],
};

const Tournament = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_ALL_TOURNAMENTS':
            return {
                ...state,
                allTournaments: payload,
            }
        case 'SET_ALL_TEMPLATES':
            return {
                ...state,
                allTemplates: payload,
            }
        case 'SET_WINNERS':
            return {
                ...state,
                winners: payload,
            }
        default:
            return state;
    }
};

export default Tournament;