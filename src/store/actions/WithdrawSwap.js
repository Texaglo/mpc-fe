export const getWithdrawSwaps = () => ({
    type: 'GET_WITHDRAWAL_SWAPS',
});

export const setWithdrawSwap = (data) => ({
    type: 'SET_WITHDRAWAL_SWAP',
    payload: data
});

export const updateWithdrawSwap = (data) => ({
    type: 'UPDATE_WITHDRAWAL_SWAP',
    payload: data
});