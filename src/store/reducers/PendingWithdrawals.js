const INITIAL_STATE = {
    pendingWithdrawals: [],
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
                ...state,
                pendingWithdrawals: state.pendingWithdrawals.filter(
                    withdrawal => withdrawal.withdrawalId !== action.payload.withdrawalId
                )
            };

        case 'REJECT_WITHDRAWAL':
            return {
                ...state,
                pendingWithdrawals: state.pendingWithdrawals.filter(
                    withdrawal => withdrawal.withdrawalId !== action.payload.withdrawalId
                )
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

        default:
            return state;
    }
};