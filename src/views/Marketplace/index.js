import React, { useState, useEffect, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactTable from 'react-table-6';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { getMarketplaceItems, createMarketplaceItem, updateMarketplaceItem, toggleMarketplaceItem } from "../../store/actions/Marketplace";
import './index.css';

const CustomTextField = withStyles({
    root: {
        '& .MuiInputBase-input': {
            color: '#fff',
        },
        '& .MuiInput-underline:before': {
            borderBottomColor: '#fff',
        },
        '& .MuiInput-underline:hover:before': {
            borderBottomColor: '#fff',
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: '#fa6634',
        },
    },
    input: {
        '&:-webkit-autofill': {
            transitionDelay: '9999s',
            transitionProperty: 'background-color, color',
        }
    }
})(TextValidator);

const Marketplace = () => {
    const dispatch = useDispatch();
    const {
        isModal,
        items,
        pagination,
        filters
    } = useSelector(({ Auth, Marketplace }) => ({
        items: Marketplace.items,
        pagination: Marketplace.pagination,
        filters: Marketplace.filters,
        isModal: Auth.isModal,
    }));

    const [selectedItemType, setSelectedItemType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(setLoader(false));
        dispatch(getMarketplaceItems({ page: currentPage, itemType: selectedItemType, isActive: selectedStatus }));
    }, [dispatch, currentPage, selectedItemType, selectedStatus]);

    const handleItemTypeChange = (e) => {
        setSelectedItemType(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const initialFormData = {
        _id: "",
        name: "",
        description: "",
        price: 0,
        itemType: "",
        itemSubType: "",
        rarity: "common",
        expirationDays: "",
        stock: ""
    };

    const [formData, setFormData] = useState(initialFormData);
    const [selectedItem, setSelectedItem] = useState(null);

    const rarityOptions = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    const handleFormChange = ({ target }) => {
        const { name, value } = target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const submitItem = () => {
        const payload = {
            ...formData,
            price: Number(formData.price),
            expirationDays: formData.expirationDays ? Number(formData.expirationDays) : null,
            stock: formData.stock ? Number(formData.stock) : null
        };

        if (selectedItem) {
            dispatch(updateMarketplaceItem(payload));
        } else {
            dispatch(createMarketplaceItem(payload));
        }

        setSelectedItem(null);
        setFormData(initialFormData);
        dispatch(toggleModal(false));
    };

    const editItem = (item) => {
        setSelectedItem(item);
        setFormData({
            _id: item._id,
            name: item.name || "",
            description: item.description || "",
            price: item.price || 0,
            itemType: item.itemType || "",
            itemSubType: item.itemSubType || "",
            rarity: item.rarity || "common",
            expirationDays: item.expirationDays || "",
            stock: item.stock || ""
        });
        dispatch(toggleModal(true));
    };

    const cancelModal = () => {
        setSelectedItem(null);
        setFormData(initialFormData);
        dispatch(toggleModal(false));
    };

    const handleToggleStatus = (item) => {
        dispatch(toggleMarketplaceItem({
            itemId: item._id,
            isActive: !item.isActive
        }));
    };

    const columns = [
        {
            Header: '#',
            Cell: ({ index }) => index + 1,
            width: 50,
            filterable: false
        },
        {
            accessor: 'itemType',
            Header: 'Item Type',
            Cell: ({ value }) => value || '-',
            width: 120
        },
        {
            accessor: 'name',
            Header: 'Name',
            filterMethod: (filter, row) => {
                return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
            },
        },
        {
            accessor: 'description',
            Header: 'Description',
            Cell: ({ value }) => (
                <span title={value || ''}>
                    {value ? (value.length > 40 ? value.substring(0, 40) + '...' : value) : '-'}
                </span>
            ),
            filterable: false
        },
        {
            accessor: 'price',
            Header: 'Price',
            width: 80
        },
        {
            accessor: 'rarity',
            Header: 'Rarity',
            Cell: ({ value }) => (
                <span className={`rarity-badge rarity-${value?.toLowerCase() || 'common'}`}>
                    {value || '-'}
                </span>
            ),
            filterable: false,
            width: 100
        },
        {
            accessor: 'isActive',
            Header: 'Status',
            Cell: ({ original }) => (
                <div className="toggle-container">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={original.isActive !== false}
                            onChange={() => handleToggleStatus(original)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span className={`status-text ${original.isActive !== false ? 'active' : 'inactive'}`}>
                        {original.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                </div>
            ),
            filterable: false,
            width: 140
        },
        {
            Cell: row => (
                <div>
                    <button onClick={() => editItem(row.original)} className="add-btn">Edit</button>
                </div>
            ),
            Header: 'Actions',
            filterable: false,
            width: 80
        },
    ];

    return (
        <div className='content'>
            <div className="main-container player-scores">
                <div className='main-container-head mb-3'>
                    <p className="main-container-heading">Marketplace</p>
                    <button onClick={() => {
                        dispatch(toggleModal(true));
                    }} className="add-btn">Create Item</button>
                </div>
                <div className='filters-container mb-3'>
                    <div className='filter-group'>
                        <label>Item Type:</label>
                        <select
                            value={selectedItemType}
                            onChange={handleItemTypeChange}
                            className="filter-select"
                        >
                            <option value="">All Types</option>
                            {filters.itemTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='filter-group'>
                        <label>Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
                <Fragment>
                    <div className='main-container-head mb-3'>
                        <ReactTable
                            minRows={20}
                            className="table"
                            data={items}
                            resolveData={data => data.map(row => row)}
                            columns={columns}
                            filterable={true}
                            showPagination={false}
                        />
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className='pagination-container'>
                            <button
                                className="add-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>
                                Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalItems})
                            </span>
                            <button
                                className="add-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </Fragment>
            </div>

            {/* ---------------ADD/EDIT ITEM MODAL--------------- */}
            <Modal isOpen={isModal} toggle={cancelModal} className="main-modal reward-modal marketplace-modal">
                <ModalHeader toggle={cancelModal}>
                    <div className="reward-modal-title"><p>{selectedItem ? 'Edit Item' : 'Create Item'}</p></div>
                    <div className="reward-modal-line"><hr /></div>
                </ModalHeader>
                <ModalBody className="modal-body reward-modal-body">
                    <div className="row">
                        <div className="col-12">
                            <ValidatorForm className="row">
                                <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                    <Grid className="input-fields" item xs={6}>
                                        <label>Name *</label>
                                        <CustomTextField
                                            fullWidth
                                            className="text-field"
                                            placeholder="Item Name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            variant="outlined"
                                            margin="dense"
                                            onChange={handleFormChange}
                                            validators={['required']}
                                            errorMessages={['Please add item name']}
                                        />
                                    </Grid>
                                    <Grid className="input-fields" item xs={6}>
                                        <label>Price *</label>
                                        <CustomTextField
                                            fullWidth
                                            className="text-field"
                                            placeholder="Price"
                                            name="price"
                                            type="number"
                                            value={formData.price}
                                            variant="outlined"
                                            margin="dense"
                                            onChange={handleFormChange}
                                            validators={['required']}
                                            errorMessages={['Please enter price']}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                    <Grid className="input-fields" item xs={6}>
                                        <label>Item Type *</label>
                                        <select
                                            className="filter-select form-select"
                                            name="itemType"
                                            value={formData.itemType}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Select Item Type</option>
                                            {filters.itemTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </Grid>
                                    <Grid className="input-fields" item xs={6}>
                                        <label>Item Sub Type</label>
                                        <CustomTextField
                                            fullWidth
                                            className="text-field"
                                            placeholder="Item Sub Type"
                                            name="itemSubType"
                                            type="text"
                                            value={formData.itemSubType}
                                            variant="outlined"
                                            margin="dense"
                                            onChange={handleFormChange}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                    <Grid className="input-fields" item xs={12}>
                                        <label>Description</label>
                                        <CustomTextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            className="text-field"
                                            placeholder="Item Description"
                                            name="description"
                                            type="text"
                                            value={formData.description}
                                            variant="outlined"
                                            margin="dense"
                                            onChange={handleFormChange}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                    <Grid className="input-fields" item xs={4}>
                                        <label>Rarity</label>
                                        <select
                                            className="filter-select form-select"
                                            name="rarity"
                                            value={formData.rarity}
                                            onChange={handleFormChange}
                                        >
                                            {rarityOptions.map((rarity) => (
                                                <option key={rarity} value={rarity}>{rarity}</option>
                                            ))}
                                        </select>
                                    </Grid>
                                    <Grid className="input-fields" item xs={4}>
                                        <label>Stock</label>
                                        <CustomTextField
                                            fullWidth
                                            className="text-field"
                                            placeholder="Stock (empty = unlimited)"
                                            name="stock"
                                            type="number"
                                            value={formData.stock}
                                            variant="outlined"
                                            margin="dense"
                                            onChange={handleFormChange}
                                        />
                                    </Grid>
                                    <Grid className="input-fields" item xs={4}>
                                        <label>Expiration Days</label>
                                        <CustomTextField
                                            fullWidth
                                            className="text-field"
                                            placeholder="Days (empty = never)"
                                            name="expirationDays"
                                            type="number"
                                            value={formData.expirationDays}
                                            variant="outlined"
                                            margin="dense"
                                            onChange={handleFormChange}
                                        />
                                    </Grid>
                                </Grid>
                            </ValidatorForm>
                        </div>

                        <div className="col-12 mt-3 d-flex justify-content-around">
                            <button className="delete-btn add-btn col-4" type='button' onClick={cancelModal}>Cancel</button>
                            <button className="add-btn col-4" type='button' onClick={submitItem}>{selectedItem ? 'Update' : 'Create'}</button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default Marketplace;
