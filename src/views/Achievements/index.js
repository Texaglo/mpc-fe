import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import { getAchievements, updateAchievement } from "../../store/actions/Achievement";
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { ValidatorForm, TextValidator } from '../../components/FormValidator';
import { Modal, ModalHeader, ModalBody } from "reactstrap";

class Achievement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: '',
            name: '',
            description: '',
            goldCoin: 0
        };
        props.setLoader(true);
        props.getAchievements();
    }

    editAchievement = (item) => {
        this.setState({ _id: item?._id, name: item.name, description: item.description, goldCoin: item.goldCoin });
        this.props.toggleModal(true);
    }

    handleFormChange = (e) => {
        const { name, value } = e.target;
        this.setState({ ...this.state, [name]: value });
    };

    submitAchievement = () => {
        this.props.updateAchievement(this.state);
        this.setState({ _id: '', name: '', description: '', goldCoin: 0 });
        this.props.toggleModal(false);
    };

    cancelModal = () => {
        this.setState({ name: '', description: '', goldCoin: 0 });
        this.props.toggleModal(false);
    };

    render() {
        let { allAchievemets, isModal } = this.props;

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
                width: 350,
                filterMethod: (filter, row) => {
                    return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
                },
            },
            {
                accessor: 'description',
                Header: 'description',
                filterMethod: (filter, row) => {
                    return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
                },
            },
            {
                accessor: 'goldCoin',
                Header: 'Gold Coin',
                width: 200,
            },
            {
                Header: 'Action',
                Cell: row => (
                    <div>
                        <button className="add-btn" onClick={() => this.editAchievement(row.original)}>Edit</button>
                    </div>
                ),
                filterable: false
            }
        ]

        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">ACHIEVEMENTS</p>
                    </div>
                    <Fragment>
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={allAchievemets}
                                resolveData={data => data.map(row => row)}
                                columns={columns}
                                filterable={true}
                            />
                        </div>
                    </Fragment>
                </div>

                {/* ---------------ADD SNG MODAL--------------- */}
                <Modal isOpen={isModal} toggle={() => this.cancelModal()} className="main-modal reward-modal">
                    <ModalHeader toggle={() => this.cancelModal()}>
                        <div className="reward-modal-title"><p className=''>Edit Achievement</p></div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body modal-height reward-modal-body">
                        <div className="row">
                            <div className="col-12">
                                <ValidatorForm className="row">
                                    <Grid container spacing={2} className="group-input" alignItems="flex-end">
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Name</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                type="text"
                                                name="name"
                                                value={this.state.name}
                                                variant="outlined"
                                                margin="dense"
                                                disabled={true}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Description</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                type="text"
                                                name="description"
                                                value={this.state.description}
                                                variant="outlined"
                                                margin="dense"
                                                disabled={true}
                                            />
                                        </Grid>
                                        <Grid className="input-fields" item xs={12}>
                                            <label>Gold Coin</label>
                                            <CustomTextField
                                                fullWidth
                                                className="text-field"
                                                autoComplete='on'
                                                placeholder="Gold Coins"
                                                type="number"
                                                name="goldCoin"
                                                value={this.state.goldCoin}
                                                variant="outlined"
                                                margin="dense"
                                                onChange={(e) => this.handleFormChange(e)}
                                                validators={['required']}
                                                errorMessages={['Please Enter Gold Coins']}
                                            />
                                        </Grid>
                                    </Grid>
                                </ValidatorForm>
                            </div>

                            <div className="col-12 mt-2 d-flex justify-content-around">
                                <button className="delete-btn add-btn col-4" type='button' onClick={() => this.cancelModal()}>Cancel</button>
                                <button className="add-btn col-4" type='button' onClick={() => this.submitAchievement()}>Update</button>
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

const mapDispatchToProps = {
    getAchievements, setLoader, updateAchievement, toggleModal
};

const mapStateToProps = ({ Achievement, Auth }) => {
    let { allAchievemets } = Achievement;
    let { isModal } = Auth
    return { allAchievemets, isModal };
};
export default connect(mapStateToProps, mapDispatchToProps)(Achievement);    