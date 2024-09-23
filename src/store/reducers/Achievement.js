import { PURGE } from "redux-persist";

var initialState =
{
    allAchievemets: [],
};

const Achievement = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_ACHIEVEMENTS':
            return {
                ...state,
                allAchievemets: payload
            }
        default:
            return state;
    }
};

export default Achievement;