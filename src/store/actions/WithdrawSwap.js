export const getWithdrawSwaps = () => ({
    type: 'GET_WITHDRAWAL_SWAPS',
});

export const setWithdrawSwaps = (data) => ({
    type: 'SET_WITHDRAWAL_SWAPS',
    payload: data
});

export const updateWithdrawSwaps = (data) => ({
    type: 'UPDATE_WITHDRAWAL_SWAPS',
    payload: data
});