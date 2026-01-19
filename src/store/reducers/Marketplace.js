import { PURGE } from "redux-persist";

const initialState = {
    items: [],
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    },
    filters: {
        itemTypes: [],
        statusOptions: []
    }
};

const Marketplace = (state = initialState, { type, payload }) => {
    switch (type) {
        case PURGE:
            return initialState;
        case 'SET_MARKETPLACE_ITEMS':
            return {
                ...state,
                items: payload.items || [],
                pagination: payload.pagination || state.pagination,
                filters: payload.filters || state.filters
            };
        default:
            return state;
    }
};

export default Marketplace;
