
export const getAllTemplates = () => ({
    type: 'GET_ALL_TEMPLATES',
});

export const setAllTemplates = (data) => ({
    type: 'SET_ALL_TEMPLATES',
    payload: data,
});

export const createTemplate = (data) => ({
    type: 'CREATE_TEMPLATE',
    payload: data,
});

export const updateTemplate = (data) => ({
    type: 'UPDATE_TEMPLATE',
    payload: data,
})

export const deleteTemplate = (data) => ({
    type: 'DELETE_TEMPLATE',
    payload: data,
})