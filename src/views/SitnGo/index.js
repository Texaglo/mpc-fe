import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { Add, Remove } from '@mui/icons-material';
import Loader from "../../components/Loader/index"
import { withStyles } from '@material-ui/core/styles';
import { addSitnGoGame } from "../../store/actions/SitnGo";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { getAllSitnGoGames, updateSitnGoGame, deleteSitnGoGame } from "../../store/actions/SitnGo";
import { getAllTemplates } from "../../store/actions/Template";

class SitnGo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                name: '',
                buyIn: '',
                seatLimit: '',
                buyInType: '',
                startingStack: '',
                formatLimit: 'Select Format Limit',
                gameVariant: 'Select Game Type',
                region: 'Select Region',
                duration: '',
                type: '',
                blinds: [{ smallBlind: '', bigBlind: '', duration: '' }]
            },
            blind: { smallBlind: '', bigBlind: '', duration: '' },
            selectedGame: null,
            template: '',
        };
        props.getAllSitnGoGames();
        props.getAllTemplates();
        props.setLoader(true);
    }

    handleFormChange = ({ target }) => {
        const { formData } = this.state;
        formData[target.name] = target.value;
        this.setState({ formData });
    };

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
            this.props.updateSitnGoGame(formData)
        } else {
            this.props.addSitnGoGame(formData);
        }
    };

    editRing = (ring) => {
        this.setState({
            selectedGame: ring,
            formData: { ...ring },
        });
        this.props.toggleModal(true);
    };
    cancelModal = () => {
        this.setState({
            selectedGame: null,
            formData: {
                name: '',
                seatLimit: '',
                buyIn: '',
                buyInType: '',
                startingStack: '',
                formatLimit: 'Select Format Limit',
                gameVariant: 'Select Game Type',
                region: 'Select Region',
                duration: '',
                type: '',
                blinds: [{ smallBlind: '', bigBlind: '', duration: '' }]
            },
        })
        this.props.toggleModal(false)
    };
    deleteRing = (ringId) => {
        this.props.deleteSitnGoGame(ringId)
    }
    render() {
        const { selectedGame, template } = this.state;
        let { name, seatLimit, buyInType, buyIn, startingStack, region, gameVariant, formatLimit, duration, blinds } = this.state.formData
        let { isModal, isLoader, allSitnGoGames, allTemplates } = this.props;

        const allSitnGoGamesArray = Object.values(allSitnGoGames);

        const columns = [
            {
                accessor: 'name',
                Header: 'Name',
            },
            {
                accessor: 'buyInType',
                Header: 'BuyIn Type',
                Cell: row => row.original.buyInType === "inGameCoins" ? "Chips" : row.original.buyInType
            },
            {
                accessor: 'buyIn',
                Header: 'BuyIn',
            },
            {
                Header: 'Participants',
                Cell: row => `${row.original.playersJoined}/${row.original.seatLimit}`,
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
                        <p className="main-container-heading">SIT'N'GO</p>
                        <button onClick={() => {
                            this.props.toggleModal(true);
                            // this.setState({ selectedGame: null, formData: {} })
                        }} className="add-btn">Create Sit'n'Go Game</button>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={allSitnGoGamesArray}
                                resolveData={data => data.map(row => row)}
                                columns={columns}
                                filtera ble={true}
                            />
                        </div>
                    </Fragment>
                </div>
                {/* ---------------ADD SNG MODAL--------------- */}

                <Modal isOpen={isModal} toggle={() => this.cancelModal()} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.cancelModal()}>
                        {/* <div className="rew ard-modal-logo">
                            <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                        </div> */}
                        <div className="reward-modal-title"><p className=''> {selectedGame ? 'Edit Game' : 'Create Game'}</p></div>
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
                                                    if (template['gameType'] == "SNG")
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
                                                <option value="Select Format Limit" selected>Select Format Limit</option>
                                                <option value="No Limit">No Limit</option>
                                                <option value="Pot Limit">Pot Limit</option>
                                                <option value="Fixed Limit">Fixed Limit</option>
                                            </select>
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
                                    {blinds.length > 0 && blinds.map((blind, index) => (
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
                                <button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>Cancel</button>
                                <button className="add-btn col-4" type='button' onClick={this.submitRing}>{selectedGame ? 'Update' : 'Create'}</button>
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
    getAllSitnGoGames, getAllTemplates, addSitnGoGame, toggleModal, setLoader, updateSitnGoGame, deleteSitnGoGame
};

const mapStateToProps = ({ Auth, SitnGo, Template }) => {
    let { allSitnGoGames } = SitnGo;
    let { allTemplates } = Template;
    let { publicAddress, isLoader, isModal } = Auth;
    return { allSitnGoGames, allTemplates, publicAddress, isLoader, isModal };
};
export default connect(mapStateToProps, mapDispatchToProps)(SitnGo);    