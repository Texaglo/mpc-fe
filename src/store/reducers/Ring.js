import { PURGE } from "redux-persist";

var initialState =
{
    allRingGames: [],
};

const Ring = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_ALL_RING_GAMES':
            return {
                ...state,
                allRingGames: payload
            }
        default:
            return state;
    }
};

export default Ring;