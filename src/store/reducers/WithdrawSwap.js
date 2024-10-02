import { PURGE } from "redux-persist";

var initialState =
{
    allSwaps: [],
};

const WithdrawSwap = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE: return initialState;
        case 'SET_WITHDRAWAL_SWAP':
            return {
                ...state,
                allSwaps: payload
            }
        default:
            return state;
    }
};
export default WithdrawSwap;