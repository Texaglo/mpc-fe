import { PURGE } from "redux-persist";

var initialState =
{
    allGameItems: [],
};

const GameStore = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_GAME_STORE':
            return {
                ...state,
                allGameItems: payload
            }
        default:
            return state;
    }
};
export default GameStore;