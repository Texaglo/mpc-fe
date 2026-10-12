import React, { useState, useEffect, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactTable from 'react-table-6';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from '../../components/FormValidator';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { createGameStore, updateGameStore, getGameStores, toggleStoreItem } from "../../store/actions/GameStore";
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

const GameStore = () => {
    const dispatch = useDispatch();
    const {
        isModal,
        allGameItems
    } = useSelector(({ Auth, GameStore }) => ({
        allGameItems: GameStore.allGameItems,
        isModal: Auth.isModal,
    }));

    useEffect(() => {
        dispatch(setLoader(false));
        dispatch(getGameStores());
    }, [dispatch]);

    const [formData, setFormData] = useState({ _id: "", name: "", amount: 0 });
    const [selectedAsset, setSelectedAsset] = useState(null);
    const products = Array.isArray(allGameItems) ? allGameItems : [];
    const activeProducts = products.filter(item => item.isActive !== false).length;

    const handleFormChange = ({ target }) => {
        setFormData(prev => ({ ...prev, [target.name]: target.value }));
    };

    const submitAsset = () => {
        if (selectedAsset) {
            dispatch(updateGameStore(formData));
        } else {
            dispatch(createGameStore(formData));
        }

        setSelectedAsset(null);
        setFormData({ _id: "", name: "", amount: 0 });
        dispatch(toggleModal(false));
    };

    const editAsset = (asset) => {
        setSelectedAsset(asset);
        setFormData({ _id: asset._id, name: asset.name, amount: asset.price });
        dispatch(toggleModal(true));
    };

    const cancelModal = () => {
        setSelectedAsset(null);
        setFormData({
            name: '',
            amount: 0
        });
        dispatch(toggleModal(false));
    };

    const handleToggleStatus = (item) => {
        dispatch(toggleStoreItem({
            itemId: item._id,
            isActive: item.isActive === false ? true : false
        }));
    };

    const columns = [
        {
            Header: '#',
            Cell: ({ index }) => index + 1,
            width: 100,
            filterable: false
        },
        {
            accessor: 'name',
            Header: 'Name',
            filterMethod: (filter, row) => {
                return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
            },
        },
        {
            accessor: 'price',
            Header: 'Amount',
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
            width: 150
        },
        {
            Cell: row => (
                <div>
                    <button onClick={() => editAsset(row.original)} className="add-btn">Edit</button>
                </div>
            ),
            Header: 'Actions',
            filterable: false
        },
    ];

    return (
        <div className='content'>
        <div className="main-container player-scores commerce-products-page">
            <div className='console-page-header'>
                <div><h1>Commerce / Products</h1><p>Manage products and availability in the player store.</p></div>
                <button onClick={() => {
                    dispatch(toggleModal(true));
                }} className="add-btn">Create Product</button>
            </div>
            <div className="console-metric-grid commerce-metric-grid" aria-label="Product summary">
                <div className="console-metric"><span className="console-metric-icon gold"><i className="tim-icons icon-bag-16" /></span><div><small>Total Products</small><strong>{products.length}</strong></div></div>
                <div className="console-metric"><span className="console-metric-icon green"><i className="tim-icons icon-check-2" /></span><div><small>Active Products</small><strong>{activeProducts}</strong></div></div>
                <div className="console-metric"><span className="console-metric-icon red"><i className="tim-icons icon-simple-remove" /></span><div><small>Disabled Products</small><strong>{products.length - activeProducts}</strong></div></div>
            </div>
            <div className="console-panel-title"><h2>Product catalog</h2><span>Current store items and availability</span></div>
            <Fragment>
                <div className='main-container-head mb-3'>
                    <ReactTable
                        minRows={Math.min(Math.max(products.length, 1), 10)}
                        className="table"
                        data={products}
                        resolveData={data => data.map(row => row)}
                        columns={columns}
                        filterable={true}
                    />
                </div>
            </Fragment>
        </div>

        {/* ---------------ADD SNG MODAL--------------- */}
        <Modal isOpen={isModal} toggle={cancelModal} className="main-modal reward-modal">
            <ModalHeader toggle={cancelModal}>
                <div className="reward-modal-title"><p className=''> {selectedAsset ? 'Edit Product' : 'Create Product'}</p></div>
                <div className="reward-modal-line"><hr /></div>
            </ModalHeader>
            <ModalBody className="modal-body modal-height reward-modal-body">
                <div className="row">
                    <div className="col-12">
                        <ValidatorForm className="row" >
                            <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                <Grid className="input-fields" item xs={12}>
                                    <label>Product Name</label>
                                    <CustomTextField
                                        disabled={selectedAsset}
                                        fullWidth
                                        className="text-field"
                                        autoComplete='on'
                                        placeholder="Product Name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        variant="outlined"
                                        margin="dense"
                                        onChange={handleFormChange}
                                        validators={['required']}
                                        errorMessages={['Please add a product name']}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                <Grid className="input-fields" item xs={12}>
                                    <label>Product Amount</label>
                                    <CustomTextField
                                        fullWidth
                                        className="text-field"
                                        autoComplete='on'
                                        placeholder="Product Amount"
                                        name="amount"
                                        type="Number"
                                        value={formData.amount}
                                        variant="outlined"
                                        margin="dense"
                                        onChange={handleFormChange}
                                        validators={['required']}
                                        errorMessages={['Please enter a product amount']}
                                    />
                                </Grid>
                            </Grid>
                        </ValidatorForm>
                    </div>

                    <div className="col-12 mt-2 d-flex justify-content-around">
                        <button className="delete-btn add-btn col-4" type='button' onClick={cancelModal}>Cancel</button>
                        <button className="add-btn col-4" type='button' onClick={submitAsset}>{selectedAsset ? 'Update' : 'Create'}</button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    </div>
    );
};

export default GameStore;
