import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Loader from "../../components/Loader/index"
import { withStyles } from '@material-ui/core/styles';
import { addRingGame } from "../../store/actions/Ring"
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator, SelectValidator } from 'react-material-ui-form-validator';
import { getAllRingGames, updateRingGame, deleteRingGame } from "../../store/actions/Ring";
import { getAllTemplates } from "../../store/actions/Template";

import './index.css';

class Ring extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                name: '',
                seatLimit: '',
                smallBlinds: '',
                bigBlinds: '',
                formatLimit: '',
                gameVariant: 'Select Game Type',
                region: 'Select Region',
                gameSize: '',
            },
            selectedGame: null,
            template: '',
        };
        props.getAllRingGames();
        props.getAllTemplates();
        props.setLoader(true);
    }

    handleFormChange = ({ target }) => {
        const { formData } = this.state;
        formData[target.name] = target.value;
        this.setState({ formData });
    };

    handleTemplateChange = ({ target }) => {
        this.setState({ template: target.value });
        let template = this.props.allTemplates.filter(template => template['_id'] === target.value);
        this.setState({ formData: { ...template[0] } })
    };

    submitRing = () => {
        const { formData, selectedGame } = this.state;
        if (formData['gameVariant'] === "Omaha") formData['formatLimit'] = "Pot Limit"
        if (formData['gameVariant'] === "Texas Hold'em") formData['formatLimit'] = "No Limit"
        this.props.toggleModal(false)
        if (selectedGame) {
            this.props.updateRingGame(formData)
        } else {
            this.props.addRingGame(formData);
        }
    };

    cancelModal = () => {
        this.setState({
            selectedGame: null,
            formData: '',
            template: ''
        })
        this.props.toggleModal(false)
    };

    editRing = (ring) => {
        this.setState({
            selectedGame: ring,
            formData: { ...ring },
        });
        this.props.toggleModal(true);
    };

    deleteRing = (ringId) => {
        this.props.deleteRingGame(ringId)
    }

    render() {
        const { selectedGame, template } = this.state;
        let { name, seatLimit, smallBlinds, bigBlinds, region, gameVariant, gameSize } = this.state.formData
        let { isModal, isLoader, allTemplates, allRingGames } = this.props;
        const allRingGamesArray = Object.values(allRingGames);

        // Define gameSizeOptions
        const gameSizeOptions = [
            { value: '', label: 'Select Game Size' },
            { value: 'micro', label: 'Micro' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
        ];

        const gameSizeRanges = {
            micro: '50 - 500',
            low: '501 - 1000',
            medium: '1001 - 100000',
            high: '100001 - 1000000000',
        };

        const columns = [
            {
                accessor: 'name',
                Header: 'Ring Name',
            },
            {
                // accessor: 'blinds',
                Header: 'Blinds',
                Cell: row => `${row.original.smallBlinds}/${row.original.bigBlinds}`,
            },
            {
                accessor: 'participants',
                Header: 'Participants',
                Cell: row => `${row.original.playersJoined}/${row.original.seatLimit}`,
            },
            {
                accessor: 'gameVariant',
                Header: 'Game Type',
            },
            // {
            //     // accessor: 'status',
            //     Header: 'Min/Max Coins',
            //     Cell: row => `${row.original.minCoins}/${row.original.maxCoins}`,
            // },
            {
                Header: 'Game Size',
                accessor: 'gameSize',
                Cell: row => row.original.gameSize,
            },
            {
                Cell: row => (
                    <div>
                        <button onClick={() => this.editRing(row.original)} className="add-btn">Edit</button>
                        <button onClick={() => this.deleteRing(row.original._id)} className="delete-btn add-btn">Delete</button>
                    </div>
                ),
                Header: 'Actions',
            },
        ];
        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">RING GAME</p>
                        <button onClick={() => {
                            this.props.toggleModal(true);
                            this.setState({ selectedGame: null, formData: {}, template: '' })
                        }} className="add-btn">Create Ring Game</button>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={allRingGamesArray}
                                resolveData={data => data.map(row => row)}
                                columns={columns}
                                filterable={true}
                            />
                        </div>
                    </Fragment>
                </div>
                {/* ---------------ADD RING MODAL--------------- */}
                <Modal isOpen={isModal} toggle={() => this.props.toggleModal(false)} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.props.toggleModal(false)}>
                        {/* <div className="reward-modal-logo">
                            <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                        </div> */}
                        <div className="reward-modal-title"><p className=''> {selectedGame ? 'Edit Ring' : 'Create Ring'}</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row" >
                                    <Grid container spacing={1} className="group-input select-template" alignItems="flex-start">
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Select Template</label>
                                            <select
                                                fullWidth
                                                className="dropdown-new"
                                                placeholder="Select"
                                                name="template"
                                                value={template}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleTemplateChange}
                                            >
                                                <option value="">Select Template</option>
                                                {allTemplates.map(template => {
                                                    if (template['gameType'] == "RING")
                                                        return <option key={template['_id']} value={template['_id']}>{template['name']}</option>
                                                })}
                                            </select>
                                        </Grid>
                                    </Grid>

                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Name</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Ring Game Name"
                                                name="name"
                                                type="text"
                                                value={name}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Add Name']}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Seat Limit</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Seat Limit"
                                                name="seatLimit"
                                                type="Number"
                                                value={seatLimit}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Seat Limit']}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Small Blind</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Small Blind"
                                                name="smallBlinds"
                                                type="Number"
                                                value={smallBlinds}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Small Blind']}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Big Blind</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Seat Limit"
                                                name="bigBlinds"
                                                type="Number"
                                                value={bigBlinds}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Big Blind']}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={1} className="group-input" alignItems="flex-end">
                                        {/* <Grid className="input-fields" item xs={6}>
                                            <label>Minimum Coins</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Minimum Coins"
                                                name="minCoins"
                                                type="text"
                                                value={minCoins}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Minimum Coins']}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Maximum Coins</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Maximum Coins"
                                                name="maxCoins"
                                                type="Number"
                                                value={maxCoins}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Maximum Coins',]}
                                            />
                                        </Grid> */}
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Game Size</label>
                                            <select
                                                value={gameSize}
                                                onChange={this.handleFormChange}
                                                name="gameSize"
                                                fullWidth
                                                className="dropdown-new"
                                                variant="outlined"
                                                margin="dense"
                                            >
                                                {gameSizeOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {/* Display selected range */}
                                            {gameSize && gameSize !== '' && (
                                                <div className="selected-range">
                                                    Range: {gameSizeRanges[gameSize]}
                                                </div>
                                            )}
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Game Type</label>
                                            <select
                                                fullWidth
                                                className="dropdown-new"
                                                placeholder="Game Type"
                                                name="gameVariant"
                                                value={gameVariant}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Select Game Type']}
                                            >
                                                <option value="">Select Game Type</option>
                                                <option value="Omaha">Omaha (PLO)</option>
                                                <option value="Texas Hold'em">Texas Hold'em (NLH)</option>
                                            </select>
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Region</label>
                                            <select
                                                fullWidth
                                                className="dropdown-new"
                                                placeholder="Region"
                                                name="region"
                                                value={region}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Select Region']}
                                            >
                                                <option value="">Select Region</option>
                                                <option value="asia">Asia</option>
                                                <option value="au">Australia</option>
                                                <option value="cae">Canada, East</option>
                                                <option value="eu">Europe</option>
                                                <option value="in">India</option>
                                                <option value="jp">Japan</option>
                                                <option value="za">South Africa</option>
                                                <option value="sa">South America</option>
                                                <option value="kr">South Korea</option>
                                                <option value="tr">Turkey</option>
                                                <option value="us">USA, East</option>
                                                <option value="ussc">USA, South Central</option>
                                            </select>
                                        </Grid>
                                    </Grid>
                                </ValidatorForm>
                            </div>
                            <div className="col-12 mt-2 d-flex justify-content-around">
                                <Button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>Cancel</Button>
                                <Button className="add-btn col-4" type='button' onClick={this.submitRing}>{selectedGame ? 'Update' : 'Create'}</Button>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>
            </div >
        );
    }
}

const CustomTextField = withStyles({
    root: {
        '& .MuiInputBase-input': {
            color: '#fff', // Text color
        },
        '& .MuiInput-underline:before': {
            borderBottomColor: '#fff', // Semi-transparent underline
        },
        '& .MuiInput-underline:hover:before': {
            borderBottomColor: '#fff', // Solid underline on hover
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: '#fa6634', // Solid underline on focus
        },
    },
    input: {
        '&:-webkit-autofill': {
            transitionDelay: '9999s',
            transitionProperty: 'background-color, color',
        }
    }
})(TextValidator);

const mapDispatchToProps = {
    getAllRingGames, getAllTemplates, addRingGame, toggleModal, setLoader, updateRingGame, deleteRingGame
};

const mapStateToProps = ({ Auth, Ring, Template }) => {
    let { allRingGames } = Ring;
    let { allTemplates } = Template;
    let { publicAddress, RingsData, isLoader, isModal } = Auth;
    return { allRingGames, allTemplates, publicAddress, isLoader, RingsData, isModal };
};
export default connect(mapStateToProps, mapDispatchToProps)(Ring);