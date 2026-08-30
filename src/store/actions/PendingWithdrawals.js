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

export const getWalletBalance = (params) => ({
    type: 'GET_WALLET_BALANCE',
    payload: params,
});

export const setWalletBalance = (data) => ({
    type: 'SET_WALLET_BALANCE',
    payload: data
});

export const getApprovedWithdrawals = () => ({
    type: 'GET_APPROVED_WITHDRAWALS',
});

export const setApprovedWithdrawals = (data) => ({
    type: 'SET_APPROVED_WITHDRAWALS',
    payload: data
});

export const getHotWalletRefills = () => ({
    type: 'GET_HOT_WALLET_REFILLS',
});

export const setHotWalletRefills = (data) => ({
    type: 'SET_HOT_WALLET_REFILLS',
    payload: data
});

export const requestHotWalletRefill = (data) => ({
    type: 'REQUEST_HOT_WALLET_REFILL',
    payload: data
});

export const approveHotWalletRefill = (data) => ({
    type: 'APPROVE_HOT_WALLET_REFILL',
    payload: data
});

export const rejectHotWalletRefill = (data) => ({
    type: 'REJECT_HOT_WALLET_REFILL',
    payload: data
});

export const setRefillRequirement = (data) => ({
    type: 'SET_REFILL_REQUIREMENT',
    payload: data
});
