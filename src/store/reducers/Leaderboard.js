import { PURGE } from "redux-persist";

var initialState =
{
    playersLeaderboard: [],
    factionalLeaderboard: [],
};

const Leaderboard = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_PLAYERS_LEADERBOARD':
            return {
                ...state,
                playersLeaderboard: payload
            }
        case 'SET_FACTIONAL_LEADERBOARD':
            return {
                ...state,
                factionalLeaderboard: payload
            }
        default:
            return state;
    }
};

export default Leaderboard;