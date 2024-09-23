import { PURGE } from "redux-persist";

var initialState =
{
    allSitnGoGames: [],
};

const SitnGo = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_ALL_SITNGO_GAMES':
            return {
                ...state,
                allSitnGoGames: payload
            }
        default:
            return state;
    }
};

export default SitnGo;