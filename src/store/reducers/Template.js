import { PURGE } from "redux-persist";

var initialState =
{
    allTemplates: [],
};

const Tournament = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_ALL_TEMPLATES':
            return {
                ...state,
                allTemplates: payload,
            }
        default:
            return state;
    }
};

export default Tournament;