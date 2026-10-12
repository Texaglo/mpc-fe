import React, { useState, useEffect, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ReactTable from 'react-table-6';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from '../../components/FormValidator';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { createGameStore, updateGameStore, getGameStores, toggleStoreItem } from "../../store/actions/GameStore";
import { getMarketplaceItems } from '../../store/actions/Marketplace';
import fpChips from '../../assets/img/admin-console/fp-chip-stack-blue.png';
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
    const history = useHistory();
    const {
        isModal,
        allGameItems,
        marketItems
    } = useSelector(({ Auth, GameStore, Marketplace }) => ({
        allGameItems: GameStore.allGameItems,
        marketItems: Marketplace.items,
        isModal: Auth.isModal,
    }));

    useEffect(() => {
        dispatch(setLoader(false));
        dispatch(getGameStores());
        dispatch(getMarketplaceItems({ page: 1, limit: 20, itemType: 'currency_bundle' }));
    }, [dispatch]);

    const [formData, setFormData] = useState({ _id: "", name: "", amount: 0 });
    const [selectedAsset, setSelectedAsset] = useState(null);
    const products = Array.isArray(allGameItems) ? allGameItems : [];
    const activeProducts = products.filter(item => item.isActive !== false).length;
    const fpCatalogProducts = (Array.isArray(marketItems) ? marketItems : []).filter(item => item.itemType === 'currency_bundle');
    const fpProducts = fpCatalogProducts.slice(0, 4);
    const activeCatalogProducts = activeProducts + fpCatalogProducts.filter(item => item.isActive !== false).length;

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
            width: 46,
            filterable: false
        },
        {
            accessor: 'name',
            Header: 'Product Name',
            filterMethod: (filter, row) => {
                return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
            },
        },
        { Header: 'Audience', Cell: () => <span className="commerce-audience">Cash Users</span>, filterable: false },
        { Header: 'Type', Cell: () => <span className="commerce-type">Time Bundle</span>, filterable: false },
        { Header: 'Includes', Cell: ({ original }) => original.name, filterable: false },
        {
            accessor: 'price',
            Header: 'Price',
            Cell: ({ value }) => `$${Number(value || 0).toFixed(2)}`,
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
                <div className="console-metric"><span className="console-metric-icon gold"><i className="tim-icons icon-coins" /></span><div><small>Time Bundles</small><strong>{products.length}</strong></div></div>
                <div className="console-metric"><span className="console-metric-icon blue"><i className="tim-icons icon-controller" /></span><div><small>FP Chip Packs</small><strong>{fpCatalogProducts.length}</strong></div></div>
                <div className="console-metric"><span className="console-metric-icon green"><i className="tim-icons icon-check-2" /></span><div><small>Active Products</small><strong>{activeCatalogProducts}</strong></div></div>
                <div className="console-metric"><span className="console-metric-icon red"><i className="tim-icons icon-simple-remove" /></span><div><small>Disabled Products</small><strong>{products.length + fpCatalogProducts.length - activeCatalogProducts}</strong></div></div>
                <div className="console-metric"><span className="console-metric-icon gold"><i className="tim-icons icon-trophy" /></span><div><small>Highest Priced Bundle</small><strong>{products.length ? `$${Math.max(...products.map(item => Number(item.price || 0))).toFixed(2)}` : '—'}</strong></div></div>
            </div>
            <div className="commerce-category-tabs" aria-label="Product categories">
                <button type="button" className="active">▤ &nbsp; Time Bundles</button>
                <button type="button" onClick={() => history.push('/home/marketplace?type=currency_bundle')}>◉ &nbsp; FP Chip Packs</button>
                <button type="button" onClick={() => history.push('/home/marketplace?type=cosmetic')}>♧ &nbsp; Cosmetics</button>
            </div>
            <Fragment>
                <div className='main-container-head mb-3'>
                    <ReactTable
                        minRows={Math.min(Math.max(products.length, 1), 10)}
                        className="table"
                        data={products}
                        resolveData={data => data.map(row => row)}
                        columns={columns}
                        filterable={false}
                        defaultPageSize={10}
                        showPagination={products.length > 10}
                    />
                </div>
            </Fragment>
            <div className="commerce-lower-grid">
                <section className="commerce-featured-panel">
                    <header><div><h2>Featured FP Chip Packs</h2><p>Free Play chips for practice and social play.</p></div><button type="button" onClick={() => history.push('/home/marketplace?type=currency_bundle')}>View all FP chip packs →</button></header>
                    {fpProducts.length ? <div className="commerce-pack-grid">{fpProducts.map((item, index) => <div className="commerce-pack-card" key={item._id}><img className={`commerce-pack-art variant-${index % 4}`} src={fpChips} alt="" /><strong>{item.name}</strong><span>${Number(item.price || 0).toFixed(2)}</span><button type="button" onClick={() => history.push('/home/marketplace?type=currency_bundle')}>View Product</button></div>)}</div> : <div className="commerce-pack-empty">No Free Play chip packs are configured in the catalog yet.</div>}
                </section>
                <aside className="commerce-flow-panel"><h2>Purchase Flow Information</h2><div><i className="tim-icons icon-coins" /><span><strong>Cash Users</strong><small>Purchase play time bundles here or deposit funds directly through the cashier.</small></span></div><div><i className="tim-icons icon-controller" /><span><strong>Free Play Users</strong><small>Purchase FP chip packs in the catalog to play on Free Play tables.</small></span></div><div><i className="tim-icons icon-bag-16" /><span><strong>Cosmetic Items</strong><small>Available for player customization and in-game appearance.</small></span></div></aside>
            </div>
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
