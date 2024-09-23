import './index.css';
import moment from 'moment';
import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, DateTimePicker, } from '@material-ui/pickers';
// import DateTimePicker from 'react-datetime-picker';
import Loader from "../../components/Loader/index";
import { Add, Remove } from '@mui/icons-material';
import { withStyles } from '@material-ui/core/styles';
import Countdown from 'react-countdown';
import { MomentCountdown } from 'react-moment-countdown';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { addTournament } from "../../store/actions/Tournament"
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { getAllTournaments, updateTournament, deleteTournament } from "../../store/actions/Tournament";
import { getAllTemplates } from "../../store/actions/Template";

import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

class Tournament extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                fee: '',
                time: '',
                name: '',
                buyIn: '',
                buyInType: '',
                prizePool: '',
                minPlayers: '',
                formatLimit: '',
                maxPlayers: '',
                startingStack: '',
                region: 'Select Region',
                gameVariant: 'Select Game Type',
                blinds: [{ smallBlind: '', bigBlind: '' }],
                tournamentStartingDate: new Date(Date.now()),
            },
            template: '',
            selectedGame: null,
            blind: { smallBlind: '', bigBlind: '' },
        };
        props.getAllTournaments();
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
            formData.tournamentStartingDate = selectedTime.format(); // ISO format
            this.setState({ formData });
        }
    };

    handleFormChange = ({ target }) => {
        let { formData } = this.state;
        formData[target.name] = target.value;
        this.setState({ formData });
    };

    handleTemplateChange = ({ target }) => {
        this.setState({ template: target.value });
        let template = this.props.allTemplates.filter(template => template['_id'] === target.value);
        this.setState({ formData: { ...template[0] } })
    };

    submitRing = () => {
        const { formData, selectedGame, } = this.state;
        if (formData['gameVariant'] === "Omaha") formData['formatLimit'] = "Pot Limit"
        if (formData['gameVariant'] === "Texas Hold'em") formData['formatLimit'] = "No Limit"
        this.props.toggleModal(false);
        if (selectedGame) this.props.updateTournament(formData)
        else this.props.addTournament(formData);
    };

    editRing = (ring) => this.setState({ selectedGame: ring, formData: { ...ring } }, () => this.props.toggleModal(true));

    cancelModal = () => this.setState({
        selectedGame: null,
        template: '',
        formData: {
            name: '', startingStack: '', buyIn: '', buyInType: '', gameVariant: 'Select Game Type', region: 'Select Region',
            tournamentStartingDate: new Date(Date.now()), time: '', minPlayers: '', maxPlayers: '', fee: '', prizePool: '', blinds: [{ smallBlind: '', bigBlind: '' }]
        },
    }, () => this.props.toggleModal(false));

    deleteRing = (ringId) => this.props.deleteTournament(ringId);

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
    render() {
        const { selectedGame, template } = this.state;
        let { isModal, isLoader, allTournaments, allTemplates } = this.props;
        const allTournamentsArray = Object.values(allTournaments);
        let { name, startingStack, buyIn, buyInType, tournamentStartingDate, region, gameVariant, minPlayers, maxPlayers, blinds, fee, prizePool } = this.state.formData;

        const columns = [
            {
                accessor: 'name',
                Header: 'Name',
            },
            {
                accessor: 'tournamentStartingDate',
                Header: 'Schedule',
                Cell: row => {
                    const scheduleDate = moment(row.value);

                    return <Countdown date={scheduleDate + 10000} />
                },
            },
            {
                accessor: 'participants',
                Header: 'Registered Players',
                Cell: row => `${row.original.totalRegisteredPlayers}`,
            },
            {
                accessor: 'participants',
                Header: 'Participants',
                Cell: row => `${row.original.playersJoined}/${row.original.maxPlayers}`,
            },
            {
                accessor: 'status',
                Header: 'Status',
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
                        <p className="main-container-heading">Tourney</p>
                        <button onClick={() => {
                            this.props.toggleModal(true);
                            this.setState({ selectedGame: null, template: '' })
                        }} className="add-btn">Create New Tourney</button>
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
                {/* ---------------ADD MTT MODAL--------------- */}

                <Modal isOpen={isModal} toggle={() => this.cancelModal()} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.cancelModal()}>
                        <div className="reward-modal-title"><p > {selectedGame ? 'Edit Tournament' : 'Create New Tournament'}</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body modal-height reward-modal-body">
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
                                                    if (template['gameType'] == "MTT")
                                                        return <option key={template['_id']} value={template['_id']}>{template['name']}</option>
                                                })}
                                            </select>
                                        </Grid>
                                    </Grid>

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
                                            <label>Buy In</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Buy In"
                                                name="buyIn"
                                                type="Number"
                                                value={buyIn}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter Buy In']}
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
    getAllTemplates, getAllTournaments, addTournament, toggleModal, setLoader, updateTournament, deleteTournament
};
const mapStateToProps = ({ Auth, Tournament, Template }) => {
    let { allTournaments } = Tournament;
    let { allTemplates } = Template;
    let { publicAddress, isLoader, RingsData, isModal } = Auth;

    return { allTournaments, allTemplates, isLoader, publicAddress, RingsData, isModal };
};
export default connect(mapStateToProps, mapDispatchToProps)(Tournament);
