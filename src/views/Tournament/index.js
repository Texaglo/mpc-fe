import React, { useState, useEffect, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactTable from 'react-table-6';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { updateWinners, getWinners } from '../../store/actions/Tournament';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import EventBus from 'eventing-bus';

import "./index.css";

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

const Tournament = () => {
    const [formData, setFormData] = useState([]);
    const [prevData, setPrevData] = useState([]);
    const [totalPercent, setTotalPercent] = useState(100);

    const dispatch = useDispatch();
    const {
        winners,
        isModal
    } = useSelector(({ Auth, Tournament }) => ({
        isModal: Auth.isModal,
        winners: Tournament.winners
    }));

    useEffect(() => {
        dispatch(setLoader(false));
        dispatch(getWinners());
    }, [dispatch]);

    const handleFormChange = (e, index) => {
        const { value } = e.target;
        const list = [...formData];
        list[index]['percentage'] = parseInt(value);

        let count = 0;
        for (let i = 0; i < list.length; i++) {
            count += list[i]['percentage'];
        }

        setFormData(list);
        setTotalPercent(count);
    };

    const submitAsset = () => {
        if(totalPercent === 100) {
            dispatch(updateWinners(formData));
            dispatch(toggleModal(false));
        } else {
            dispatch(getWinners());
            setFormData(winners);
            EventBus.publish("error", "Total percentage should be 100");
        }
    };

    const editAsset = () => {
        setFormData(winners);
        dispatch(toggleModal(true));
    };

    const cancelModal = () => {
        setFormData(winners);

        let count = 0;
        for (let i = 0; i < winners.length; i++) {
            count += winners[i]['percentage'];
        }

        setTotalPercent(count);
        dispatch(toggleModal(false));
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
            Header: 'Winner',
            Cell: ({ value }) => value === "firstWinner" ? "First Winner" : value === "secondWinner" ? "Second Winner" : value === "thirdWinner" ? "Third Winner" : value,
            filterMethod: (filter, row) => {
                return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
            },
        },
        {
            accessor: 'percentage',
            Header: 'Percentage',
            Cell: ({ value }) => `${value}%`,
        },
    ];

    return (
        <div className='content'>
            <div className="main-container player-scores">
                <div className='main-container-head mb-3'>
                    <p className="main-container-heading">Tournament</p>
                    <button onClick={() => editAsset()} className="add-btn">Edit Tournament</button>
                </div>
                <Fragment>
                    <div className='main-container-head mb-3'>
                        <ReactTable
                            minRows={20}
                            className="table"
                            data={winners}
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
                    <div className="reward-modal-title"><p className=''>Edit Tournament</p></div>
                    <div className="reward-modal-line"><hr /></div>
                </ModalHeader>
                <ModalBody className="modal-body modal-height reward-modal-body">
                    <div className="row">
                        <div className="col-12">
                            <ValidatorForm className="row">
                                {
                                    formData.length > 0 && formData.map((data, index) => (
                                        <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                            <Grid className="input-fields" item xs={12}>
                                                <label>{data.name === "firstWinner" ? "First Winner" : data.name === "secondWinner" ? "Second Winner" : data.name === "thirdWinner" ? "Third Winner" : data.name}</label>
                                                <CustomTextField
                                                    fullWidth
                                                    className="text-field"
                                                    autoComplete='on'
                                                    placeholder="Winner Percent"
                                                    type="number"
                                                    value={data.percentage}
                                                    variant="outlined"
                                                    margin="dense"
                                                    onChange={(e) => handleFormChange(e, index)}
                                                    validators={['required']}
                                                    errorMessages={['Please Enter Winner Percent']}
                                                />
                                            </Grid>
                                        </Grid>
                                    ))
                                }

                                <h4 style={{ width: '100%', display: 'flex', justifyContent: 'space-around', color: '#4d4dff' }}>Percentage: <span>{totalPercent}%</span></h4>
                            </ValidatorForm>
                        </div>

                        <div className="col-12 mt-2 d-flex justify-content-around">
                            <button className="delete-btn add-btn col-4" type='button' onClick={cancelModal}>Cancel</button>
                            <button className="add-btn col-4" type='button' onClick={submitAsset}>Update</button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default Tournament;
