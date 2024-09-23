import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Loader from "../../components/Loader/index"
import { withStyles } from '@material-ui/core/styles';
import { addSitnGoGame } from "../../store/actions/SitnGo";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator, SelectValidator } from 'react-material-ui-form-validator';
import { getAchievements, updateAchievement } from "../../store/actions/Achievement";

class Achievement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                name: '',
                reward: '',
                rewardType: '',
                description: '',
                achievementType: '',
            },
            selectedGame: null,
        };
        props.getAchievements();
        props.setLoader(true);
    }

    handleFormChange = ({ target }) => {
        const { formData } = this.state;
        formData[target.name] = target.value;
        this.setState({ formData });
    };

    submitRing = () => {
        const { formData, selectedGame } = this.state;
        this.props.toggleModal(false)
        if (selectedGame) this.props.updateAchievement(formData)
    };

    editRing = (ring) => this.setState({ selectedGame: ring, formData: { ...ring } }, () => this.props.toggleModal(true));
    cancelModal = () => this.setState({ selectedGame: null, formData: '' }, () => this.props.toggleModal(false));

    render() {
        let { selectedGame } = this.state;
        let { reward, rewardType } = this.state.formData
        let { isModal, isLoader, allAchievemets } = this.props;
        let allAchievementsArray = Object.values(allAchievemets);

        const columns = [
            {
                accessor: 'name',
                Header: 'Name',
                width: 300,
            },
            {
                accessor: 'description',
                Header: 'description',
            },
            {
                accessor: 'rewardType',
                Header: 'Reward Type',
                width: 200,
            },
            {
                accessor: 'reward',
                Header: 'Reward',
                width: 150,
            },
            {
                Cell: row => (
                    <div><button onClick={() => this.editRing(row.original)} className="add-btn">Edit Reward</button></div>
                ),
                Header: 'Actions',
                width: 200,
            },
        ];
        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">ACHIEVEMENTS</p>
                        {/* <button onClick={() => {
                            this.props.toggleModal(true);
                            this.setState({ selectedGame: null, formData: {} })
                        }} className="add-btn">Create Sit'n'Go Game</button> */}
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={allAchievementsArray}
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
                        <div className="reward-modal-logo">
                            <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                        </div>
                        <div className="reward-modal-title"><p className=''> {selectedGame ? 'Edit Game' : 'Create Game'}</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row" >
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Reward Type</label>
                                            <SelectValidator
                                                fullWidth
                                                className="text-field"
                                                placeholder="Format Limit"
                                                name="rewardType"
                                                value={rewardType}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Add Reward Type']}
                                            >
                                                <option value="Chips">Chips</option>
                                                <option value="Silver Ticket">Silver Ticket</option>
                                                <option value="Bronze Ticket">Bronze Ticket</option>
                                                <option value="Gold Ticket">Gold Ticket</option>
                                            </SelectValidator>
                                        </Grid>
                                        <Grid className="input-fields" item xs={6}>
                                            <label>Reward</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="reward"
                                                name="reward"
                                                type="text"
                                                value={reward}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={this.handleFormChange}
                                                validators={['required']}
                                                errorMessages={['Please Enter reward Amount']}
                                            />
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
    getAchievements, addSitnGoGame, toggleModal, setLoader, updateAchievement
};

const mapStateToProps = ({ Auth, Achievement }) => {
    let { allAchievemets } = Achievement;
    let { publicAddress, isLoader, isModal } = Auth;
    return { allAchievemets, publicAddress, isLoader, isModal };
};
export default connect(mapStateToProps, mapDispatchToProps)(Achievement);    