const INITIAL_STATE = {
    pendingWithdrawals: [],
    approvedWithdrawals: [],
    walletBalance: null,
    hotWalletRefills: [],
    refillRequirement: null,
    loading: false,
    error: null
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'GET_PENDING_WITHDRAWALS':
            return {
                ...state,
                loading: true
            };

        case 'SET_PENDING_WITHDRAWALS':
            return {
                ...state,
                pendingWithdrawals: action.payload || [],
                loading: false,
                error: null
            };

        case 'APPROVE_WITHDRAWAL':
            return {
                ...state
            };

        case 'REJECT_WITHDRAWAL':
            return {
                ...state
            };

        case 'UPDATE_WITHDRAWAL_STATUS':
            return {
                ...state,
                pendingWithdrawals: state.pendingWithdrawals.map(withdrawal =>
                    withdrawal.withdrawalId === action.payload.withdrawalId
                        ? { ...withdrawal, status: action.payload.status }
                        : withdrawal
                )
            };

        case 'GET_WALLET_BALANCE':
            return {
                ...state,
                loading: true
            };

        case 'SET_WALLET_BALANCE':
            return {
                ...state,
                walletBalance: action.payload,
                loading: false,
                error: null
            };

        case 'GET_APPROVED_WITHDRAWALS':
            return {
                ...state,
                loading: true
            };

        case 'SET_APPROVED_WITHDRAWALS':
            return {
                ...state,
                approvedWithdrawals: action.payload || [],
                loading: false,
                error: null
            };

        case 'SET_HOT_WALLET_REFILLS':
            return {
                ...state,
                hotWalletRefills: action.payload || [],
                loading: false,
                error: null
            };

        case 'SET_REFILL_REQUIREMENT':
            return {
                ...state,
                refillRequirement: action.payload || null
            };

        default:
            return state;
    }
};
