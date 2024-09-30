import React, { useState, useEffect, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactTable from 'react-table-6';
import Grid from '@material-ui/core/Grid';
import Loader from "../../components/Loader/index";
import { withStyles } from '@material-ui/core/styles';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { createGameStore, updateGameStore, getGameStores } from "../../store/actions/GameStore";

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
        isLoader,
        isModal,
        allGameItems
    } = useSelector(({ Auth, GameStore }) => ({
        allGameItems: GameStore.allGameItems,
        isLoader: Auth.isLoader,
        isModal: Auth.isModal,
    }));

    useEffect(() => {
        dispatch(setLoader(false));
        dispatch(getGameStores());
    }, [dispatch]);

    const [formData, setFormData] = useState({ _id: "", name: "", amount: 0 });
    const [selectedAsset, setSelectedAsset] = useState(null);

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

    const columns = [
        {
            accessor: 'index',
            Header: '#',
            Cell: ({ index }) => index + 1,
            width: 150
        },
        {
            accessor: 'name',
            Header: 'Name'
        },
        {
            accessor: 'price',
            Header: 'Amount',
        },
        {
            Cell: row => (
                <div>
                    <button onClick={() => editAsset(row.original)} className="add-btn">Edit</button>
                </div>
            ),
            Header: 'Actions',
        },
    ];

    return (
        <div className='content'>
        <div className="main-container player-scores">
            <div className='main-container-head mb-3'>
                <p className="main-container-heading">Game Store</p>
                <button onClick={() => {
                    dispatch(toggleModal(true));
                }} className="add-btn">Create Game Asset</button>
            </div>
            <Fragment>
                {isLoader ? <Loader /> : null}
                <div className='main-container-head mb-3'>
                    <ReactTable
                        minRows={20}
                        className="table"
                        data={allGameItems}
                        resolveData={data => data.map(row => row)}
                        columns={columns}
                        filtera ble={true}
                    />
                </div>
            </Fragment>
        </div>

        {/* ---------------ADD SNG MODAL--------------- */}
        <Modal isOpen={isModal} toggle={cancelModal} className="main-modal reward-modal">
            <ModalHeader toggle={cancelModal}>
                <div className="reward-modal-title"><p className=''> {selectedAsset ? 'Edit Asset' : 'Create Asset'}</p></div>
                <div className="reward-modal-line"><hr /></div>
            </ModalHeader>
            <ModalBody className="modal-body modal-height reward-modal-body">
                <div className="row">
                    <div className="col-12">
                        <ValidatorForm className="row" >
                            <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                <Grid className="input-fields" item xs={12}>
                                    <label> Asset Name</label>
                                    <CustomTextField
                                        disabled={selectedAsset}
                                        fullWidth
                                        className="text-field"
                                        autoComplete='on'
                                        placeholder="Asset Name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        variant="outlined"
                                        margin="dense"
                                        onChange={handleFormChange}
                                        validators={['required']}
                                        errorMessages={['Please Add Asset Name']}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                <Grid className="input-fields" item xs={12}>
                                    <label>Asset Amount</label>
                                    <CustomTextField
                                        fullWidth
                                        className="text-field"
                                        autoComplete='on'
                                        placeholder="Asset Amount"
                                        name="amount"
                                        type="Number"
                                        value={formData.amount}
                                        variant="outlined"
                                        margin="dense"
                                        onChange={handleFormChange}
                                        validators={['required']}
                                        errorMessages={['Please Enter Asset Amount']}
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
