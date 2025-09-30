export const getPendingWithdrawals = () => ({
    type: 'GET_PENDING_WITHDRAWALS',
});

export const setPendingWithdrawals = (data) => ({
    type: 'SET_PENDING_WITHDRAWALS',
    payload: data
});

export const approveWithdrawal = (data) => ({
    type: 'APPROVE_WITHDRAWAL',
    payload: data
});

export const rejectWithdrawal = (data) => ({
    type: 'REJECT_WITHDRAWAL',
    payload: data
});

export const updateWithdrawalStatus = (data) => ({
    type: 'UPDATE_WITHDRAWAL_STATUS',
    payload: data
});

export const getWalletBalance = () => ({
    type: 'GET_WALLET_BALANCE',
});

export const setWalletBalance = (data) => ({
    type: 'SET_WALLET_BALANCE',
    payload: data
});