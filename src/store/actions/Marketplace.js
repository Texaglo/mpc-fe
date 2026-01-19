export const getMarketplaceItems = (params = {}) => ({
    type: 'GET_MARKETPLACE_ITEMS',
    payload: params
});

export const setMarketplaceItems = (data) => ({
    type: 'SET_MARKETPLACE_ITEMS',
    payload: data
});

export const createMarketplaceItem = (data) => ({
    type: 'CREATE_MARKETPLACE_ITEM',
    payload: data
});

export const updateMarketplaceItem = (data) => ({
    type: 'UPDATE_MARKETPLACE_ITEM',
    payload: data
});

export const toggleMarketplaceItem = (data) => ({
    type: 'TOGGLE_MARKETPLACE_ITEM',
    payload: data
});
