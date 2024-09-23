import './index.css';
import moment from 'moment';
import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Radio from '@material-ui/core/Radio';
import DateFnsUtils from '@date-io/date-fns';
import Button from '@material-ui/core/Button';
import { Add, Remove } from '@mui/icons-material';
import { MuiPickersUtilsProvider, DateTimePicker, } from '@material-ui/pickers';
// import DateTimePicker from 'react-datetime-picker';
import Loader from "../../components/Loader/index";
import { withStyles } from '@material-ui/core/styles';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { createTemplate } from "../../store/actions/Template"
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { getAllTemplates, updateTemplate, deleteTemplate } from "../../store/actions/Template";

import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

class Template extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                fee: '',
                name: '',
                time: '',
                buyIn: '',
                region: '',
                regular: '',
                minCoins: '',
                gameType: '',
                maxCoins: '',
                bigBlinds: '',
                seatLimit: '',
                prizePool: '',
                maxPlayers: '',
                minPlayers: '',
                smallBlinds: '',
                formatLimit: '',
                gameVariant: '',
                blinds: [{ smallBlind: '', bigBlind: '', duration: '' }],
                isTemplate: false,
                startingStack: '',
                tournamentStartingDate: new Date(Date.now()),
            },
            selectedGame: null,
            ringModal: false,
            sngModal: false,
            tournamentModal: false,
            selectGameModal: false,
            selectedOption: 'MTT',
            blind: { smallBlind: '', bigBlind: '', duration: '' },
        };
        props.getAllTemplates();
        props.setLoader(true);
    }


    handleDateTimeChange = (tournamentStartingDate) => {
        let now = moment();
        let { formData } = this.state;
        let selectedTime = moment(tournamentStartingDate);

        if (selectedTime.isBefore(now)) {
            EventBus.publish("error", "Selected time is in the past!");
            return;
        }
        else {
            formData.tournamentStartingDate = selectedTime.format(); // Save the selected date and time as a string in ISO format
            this.setState({ formData });
        }
    };

    handleFormChange = ({ target }) => {
        let { formData } = this.state;
        formData[target.name] = target.value;
        this.setState({ formData });
    };

    submitRing = () => {
        const { formData, selectedGame } = this.state;

        formData['gameType'] = this.state.selectedOption
        if (formData['gameVariant'] === "Omaha") formData['formatLimit'] = "Pot Limit"
        if (formData['gameVariant'] === "Texas Hold'em") formData['formatLimit'] = "No Limit"

        if (selectedGame) this.props.updateTemplate(formData)
        else
            this.props.createTemplate(formData);
        this.cancelModal()
    };

    editRing = (game) => {
        this.setState({ selectedGame: game, formData: { ...game } });

        if (game['gameType'] === "MTT") this.setState({ tournamentModal: true });
        if (game['gameType'] === "SNG") this.setState({ sngModal: true });
        if (game['gameType'] === "RING") this.setState({ ringModal: true });
    }

    cancelModal = () => this.setState({
        selectedGame: null, formData: {
            fee: '',
            name: '',
            time: '',
            buyIn: '',
            region: '',
            regular: '',
            minCoins: '',
            gameType: '',
            maxCoins: '',
            bigBlinds: '',
            buyInType: '',
            seatLimit: '',
            prizePool: '',
            maxPlayers: '',
            minPlayers: '',
            smallBlinds: '',
            formatLimit: '',
            gameVariant: '',
            isTemplate: false,
            startingStack: '',
            tournamentStartingDate: new Date(Date.now()),
            blinds: [{ smallBlind: '', bigBlind: '', duration: '' }]
        },
        selectGameModal: false, tournamentModal: false,
        ringModal: false, sngModal: false,
    })

    handleBlindChange = ({ target }) => {
        const { blinds } = this.state.formData;
        let name = target.name.split('_')
        blinds[name[1]][name[0]] = target.value;
        this.setState({ blinds });
    };

    addBlind = () => {
        const { formData, blind } = this.state;
        const updatedBlinds = [...formData.blinds, { ...blind }];
        this.setState({ formData: { ...formData, blinds: updatedBlinds } });
    };
    removeBlind = () => {
        const { formData } = this.state;
        const updatedBlinds = [...formData.blinds];
        updatedBlinds.pop();
        this.setState({ formData: { ...formData, blinds: updatedBlinds } });
    };

    deleteRing = (gameId) => this.props.deleteTemplate(gameId);

    handleRadioChange = (e) => {
        this.setState({ selectedOption: e.target.value });
    };



    handleModal = () => {
        this.setState({ selectGameModal: false })
        let { selectedOption } = this.state;
        if (selectedOption == "MTT") this.setState({ tournamentModal: true });
        if (selectedOption == "SNG") this.setState({ sngModal: true });
        if (selectedOption == "RING") this.setState({ ringModal: true });
    }




    render() {
        const { selectedGame, tournamentModal, selectedOption, selectGameModal, ringModal, sngModal } = this.state;
        let { isLoader, allTemplates } = this.props;
        const allTournamentsArray = Object.values(allTemplates);
        let { name, startingStack, buyIn, buyInType, tournamentStartingDate, smallBlinds, bigBlinds, minCoins, maxCoins, seatLimit, duration,
            region, gameVariant, formatLimit, minPlayers, maxPlayers, blinds, fee, prizePool } = this.state.formData;

        const columns = [
            {
                accessor: 'name',
                Header: 'Name',
            },
            {
                accessor: 'gameType',
                Header: 'Game Mode',
            },
            {
                accessor: 'gameVariant',
                Header: 'Game Variant',
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
                        <p className="main-container-heading">Templates</p>
                        <button onClick={() => {
                            this.setState({ selectGameModal: true })
                            this.setState({ selectedGame: null })
                        }} className="add-btn">Create New Template</button>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={allTournamentsArray}
                                resolveData={data => data.map(row => row)}
                                columns={columns}
                                filterable={true}
                            />
                        </div>
                    </Fragment>
                </div>

                {/* --------------- SELECT GAME MODE MODAL--------------- */}

                <Modal isOpen={selectGameModal} toggle={() => this.setState({ selectGameModal: false })} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.setState({ selectGameModal: false })}>
                        <div className="reward-modal-title"><p className=''> {selectedGame ? 'Edit Template' : 'Create New Template'}</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row">
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Please select Game Mode</label>
                                            <div className="radio-options">
                                                <Radio
                                                    checked={selectedOption === "MTT"}
                                                    onChange={this.handleRadioChange}
                                                    className="text-field"
                                                    name="selectedOption"
                                                    value="MTT"
                                                />
                                                <label>
                                                    Tournament
                                                </label>
                                            </div>
                                            <div className="radio-options">
                                                <Radio
                                                    className="text-field"
                                                    name="selectedOption"
                                                    value="SNG"
                                                    checked={selectedOption === "SNG"}
                                                    onChange={this.handleRadioChange}
                                                />
                                                <label>
                                                    Sit'n'Go
                                                </label>
                                            </div>
                                            <div className="radio-options">
                                                <Radio
                                                    className="text-field"
                                                    name="selectedOption"
                                                    value="RING"
                                                    checked={selectedOption === "RING"}
                                                    onChange={this.handleRadioChange}
                                                />
                                                <label>
                                                    Ring
                                                </label>
                                            </div>
                                        </Grid>
                                    </Grid>
                                </ValidatorForm>
                            </div>
                            <div className="col-12 mt-2 d-flex justify-content-around">
                                <Button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>Cancel</Button>
                                <Button className="add-btn col-4" type='button' onClick={this.handleModal}>Next</Button>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>

                {/* --------------- ADD TOURNAMENT MODAL--------------- */}

                <Modal isOpen={tournamentModal} toggle={() => this.setState({ tournamentModal: false })} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.setState({ tournamentModal: false })}>
                        <div className="reward-modal-title"><p className=''> Create Tournament Template</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row" >
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Name</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Tournament Name"
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

                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields time-piker" item xs={6}>
                                            <label>Schedule</label>
                                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                                <DateTimePicker
                                                    className='col-md-12 text-field'
                                                    name="tournamentStartingDate"
                                                    margin="normal"
                                                    id="date-time-picker-dialog"
                                                    format="MM/dd/yyyy HH:mm" // Format to display date and time
                                                    value={tournamentStartingDate}
                                                    onChange={(tournamentStartingDate) => this.handleDateTimeChange(tournamentStartingDate)}
                                                // KeyboardButtonProps={{ 'aria-label': 'Date and Time' }}
                                                />
                                            </MuiPickersUtilsProvider>
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Starting Stack</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Starting Stack"
                                                name="startingStack"
                                                type="Number"
                                                value={startingStack}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Starting Stack']}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>BuyIn Type</label>
                                            <select
                                                fullWidth
                                                className="dropdown-new"
                                                name="buyInType"
                                                value={buyInType}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Select Game Type']}
                                            >
                                                <option value="">Select BuyIn Type</option>
                                                <option value="inGameCoins">Chips</option>
                                                <option value="silverTickets">Silver Tickets</option>
                                                <option value="bronzeTickets">Bronze Tickets</option>
                                                <option value="goldTickets">Gold Tickets</option>
                                            </select>
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>BuyIn Value</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Starting Stack"
                                                name="buyIn"
                                                type="Number"
                                                value={buyIn}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Starting Stack']}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Minimum Players</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Minimum Players"
                                                name="minPlayers"
                                                type="Number"
                                                value={minPlayers}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Minimum Players']}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Maximum Players</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Maximum Players"
                                                name="maxPlayers"
                                                type="Number"
                                                value={maxPlayers}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Maximum Players',]}
                                            />
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
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Fee</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="fee"
                                                name="fee"
                                                type="Number"
                                                value={fee}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter fee']}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Prize Pool</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Prize Pool"
                                                name="prizePool"
                                                type="Number"
                                                value={prizePool}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Prize Pool']}
                                            />
                                        </Grid>
                                    </Grid>
                                    {blinds && blinds.length > 0 && blinds.map((blind, index) => (
                                        <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                            <Grid className="input-fields" item xs={6}>
                                                <label>Small Blind</label>
                                                <CustomTextField
                                                    fullWidth
                                                    className="text-field"
                                                    autoComplete='on'
                                                    placeholder="Small Blind"
                                                    name={`smallBlind_${index}`}
                                                    type="Number"
                                                    value={blind['smallBlind']}
                                                    variant="outlined"
                                                    margin="dense"
                                                    onChange={this.handleBlindChange}
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
                                                    placeholder="Big Blind"
                                                    name={`bigBlind_${index}`}
                                                    type="Number"
                                                    value={blind['bigBlind']}
                                                    variant="outlined"
                                                    margin="dense"
                                                    onChange={this.handleBlindChange}
                                                    validators={['required']}
                                                    errorMessages={['Please Enter Big Blind',]}
                                                />
                                            </Grid>
                                        </Grid>
                                    ))}
                                    <Grid className='blind-btn-group col-12'>
                                        <Add className='blind-btn' onClick={this.addBlind} />
                                        <Remove className='blind-btn ml-2' onClick={this.removeBlind} />
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

                {/* --------------- ADD SNG MODAL--------------- */}

                <Modal isOpen={sngModal} toggle={() => this.setState({ sngModal: false })} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.setState({ sngModal: false })}>
                        <div className="reward-modal-title"><p className=''>Create Sit'n'Go Template</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row" >

                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Name</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Sit'n'Go Game Name"
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
                                            <label>BuyIn Type</label>
                                            <select
                                                fullWidth
                                                className="dropdown-new"
                                                name="buyInType"
                                                value={buyInType}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Select Game Type']}
                                            >
                                                <option value="">Select BuyIn Type</option>
                                                <option value="inGameCoins">Chips</option>
                                                <option value="silverTickets">Silver Tickets</option>
                                                <option value="bronzeTickets">Bronze Tickets</option>
                                                <option value="goldTickets">Gold Tickets</option>
                                            </select>
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>BuyIn Value</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Starting Stack"
                                                name="buyIn"
                                                type="Number"
                                                value={buyIn}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Starting Stack']}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Starting Stack</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Starting Stack"
                                                name="startingStack"
                                                type="Number"
                                                value={startingStack}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Starting Stack']}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Duration</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Enter No. of Minutes"
                                                name="duration"
                                                type="Number"
                                                value={duration}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                            />
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
                                    {blinds && blinds.length > 0 && blinds.map((blind, index) => (
                                        <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                            <Grid className="input-fields" item xs={4}>
                                                <label>Small Blind</label>
                                                <CustomTextField
                                                    fullWidth
                                                    className="text-field"
                                                    autoComplete='on'
                                                    placeholder="Small Blind"
                                                    name={`smallBlind_${index}`}
                                                    type="Number"
                                                    value={blind['smallBlind']}
                                                    variant="outlined"
                                                    margin="dense"
                                                    onChange={this.handleBlindChange}
                                                    validators={['required']}
                                                    errorMessages={['Please Enter Small Blind']}
                                                />
                                            </Grid>
                                            <Grid className="input-fields" item xs={4}>
                                                <label>Big Blind</label>
                                                <CustomTextField
                                                    fullWidth
                                                    className="text-field"
                                                    autoComplete='on'
                                                    placeholder="Big Blind"
                                                    name={`bigBlind_${index}`}
                                                    type="Number"
                                                    value={blind['bigBlind']}
                                                    variant="outlined"
                                                    margin="dense"
                                                    onChange={this.handleBlindChange}
                                                    validators={['required']}
                                                    errorMessages={['Please Enter Big Blind',]}
                                                />
                                            </Grid>
                                            <Grid className="input-fields" item xs={4}>
                                                <label>Duration</label>
                                                <CustomTextField
                                                    fullWidth
                                                    className="text-field"
                                                    autoComplete='on'
                                                    placeholder="Maximum Coins"
                                                    name={`duration_${index}`}
                                                    type="Number"
                                                    value={blind['duration']}
                                                    variant="outlined"
                                                    margin="dense"
                                                    onChange={this.handleBlindChange}
                                                    validators={['required']}
                                                    errorMessages={['Please Enter Blind Duaration',]}
                                                />
                                            </Grid>
                                        </Grid>
                                    ))}
                                    <Grid className='blind-btn-group col-12'>
                                        <Add className='blind-btn' onClick={this.addBlind} />
                                        <Remove className='blind-btn ml-2' onClick={this.removeBlind} />
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

                {/* ---------------ADD RING MODAL--------------- */}

                <Modal isOpen={ringModal} toggle={() => this.setState({ ringModal: false })} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.setState({ ringModal: false })}>
                        <div className="reward-modal-title"><p className=''> Create RING Template</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row" >
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={12}>
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
                                    </Grid>
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Format Limit</label>
                                            <select
                                                fullWidth
                                                className="dropdown-new"
                                                placeholder="Format Limit"
                                                name="formatLimit"
                                                value={formatLimit}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Add format Limit']}
                                            >
                                                <option value="">Select Format Limit</option>
                                                <option value="No Limit">No Limit</option>
                                                <option value="Pot Limit">Pot Limit</option>
                                                <option value="Fixed Limit">Fixed Limit</option>
                                            </select>
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
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
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




            </div>
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
    getAllTemplates, updateTemplate, deleteTemplate, createTemplate, toggleModal, setLoader
};
const mapStateToProps = ({ Auth, Template, }) => {
    let { allTemplates } = Template;
    let { publicAddress, isLoader, RingsData, isModal } = Auth;

    return { allTemplates, isLoader, publicAddress, RingsData, isModal };
};
export default connect(mapStateToProps, mapDispatchToProps)(Template);
