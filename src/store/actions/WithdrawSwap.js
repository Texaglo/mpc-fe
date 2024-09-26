export const getWithdrawSwaps = () => ({
    type: 'GET_WITHDRAWAL_SWAPS',
});

export const setWithdrawSwaps = (data) => ({
    type: 'SET_WITHDRAWAL_SWAPS',
    payload: data
});