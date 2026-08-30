const INITIAL_STATE = {
    users: [],
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 20
    },
    userTransactions: [],
    userInventory: [],
    inventoryPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 25
    },
    inventoryCatalog: [],
    loading: false,
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'GET_USERS':
            return {
                ...state,
                loading: action.payload?.silent ? state.loading : true
            };

        case 'SET_USERS':
            return {
                ...state,
                users: action.payload?.users || [],
                pagination: action.payload?.pagination || state.pagination,
                loading: false,
                error: null
            };

        case 'UPDATE_USER_FREEZE_STATUS':
            return {
                ...state,
                users: state.users.map(user =>
                    user._id === action.payload.userId
                        ? { ...user, isFrozen: action.payload.isFrozen }
                        : user
                )
            };

        case 'SET_USER_TRANSACTIONS':
            return {
                ...state,
                userTransactions: action.payload || [],
                loading: false
            };

        case 'SET_USER_INVENTORY':
            return {
                ...state,
                userInventory: action.payload?.inventory || [],
                inventoryPagination: action.payload?.pagination || state.inventoryPagination,
                loading: false
            };

        case 'SET_INVENTORY_CATALOG':
            return {
                ...state,
                inventoryCatalog: action.payload?.items || []
            };

        case 'UPDATE_USER_BALANCE':
            return {
                ...state,
                users: state.users.map(user =>
                    user._id === action.payload.userId
                        ? { ...user, mpceCredit: action.payload.newBalance }
                        : user
                )
            };

        default:
            return state;
    }
};
