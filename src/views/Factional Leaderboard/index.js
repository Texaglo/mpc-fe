import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';
import React, { Fragment } from 'react';
import Button from '@material-ui/core/Button';
import Loader from "../../components/Loader/index";
import { setLoader } from '../../store/actions/Auth';
import { withStyles } from '@material-ui/core/styles';
import { toggleModal } from '../../store/actions/Auth';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { TextValidator } from 'react-material-ui-form-validator';
import { getFactionalLeaderboard } from "../../store/actions/Leaderboard";

import './index.css';

class Leaderboard extends React.Component {
    state = {
        selectedFaction: null,
        expanded: null,
    };

    constructor(props) {
        super(props);
        props.getFactionalLeaderboard();
        props.setLoader(true);
    }

    viewMembers = (faction) => {
        this.setState({
            selectedFaction: faction,
        });
        this.props.toggleModal(true);
    };
    cancelModal = () => {
        this.setState({
            selectedGame: null,
        })
        this.props.toggleModal(false)
    };

    handleFactionClick = (faction) => {
        this.setState({ selectedFaction: faction });
    };

    render() {
        const { isLoader, isModal, factionalLeaderboard } = this.props;
        const leaderboardArray = Object.values(factionalLeaderboard);
        const { selectedFaction } = this.state;

        const columns = [
            {
                Header: 'Rank',
                Cell: ({ index }) => index + 1,
                width: 150,
            },
            {
                Header: 'Faction',
                accessor: 'faction',
            },
            {
                Header: 'Score',
                accessor: 'score',
            },
            {
                Header: 'Action',
                Cell: row => (
                    <div>
                        <button onClick={() => this.viewMembers(row.original)} className="add-btn">View Members</button>
                    </div>
                ),
            }
        ];

        const factionMembers = selectedFaction
            ? (selectedFaction.members || [])
            : [];

        const modalColumns = [
            {
                Header: 'Rank',
                Cell: ({ index }) => index + 1,
                width: 100,
            },
            { Header: 'Username', accessor: 'username' },
            { Header: 'Score', accessor: 'score' },
        ];

        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">Factional Leaderboard</p>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={leaderboardArray}
                                resolveData={data => data.map(row => row)}
                                columns={columns}
                                filterable={true}
                            />
                        </div>
                    </Fragment>

                    <Modal isOpen={isModal} toggle={() => this.props.toggleModal(false)} className="main-modal reward-modal">
                        <ModalHeader toggle={() => this.props.toggleModal(false)}>
                            <div className="reward-modal-logo">
                                <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                            </div>
                            <div className="reward-modal-title">
                                <p className=''>{selectedFaction ? 'Factional Players' : ''}</p>
                            </div>
                            <div className="reward-modal-line">
                                <hr />
                            </div>
                        </ModalHeader>
                        <ModalBody className="modal-body reward-modal-body">
                            <div className="row">
                                <div className="col-12">
                                    <ReactTable
                                        minRows={20}
                                        className="table"
                                        data={factionMembers}
                                        resolveData={data => data.map(row => row)}
                                        columns={modalColumns}
                                        filterable={true}
                                    />
                                </div>
                                <div className="col-12 mt-2 d-flex justify-content-around">
                                    <Button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </ModalBody>
                    </Modal>
                </div>
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
        },
    },
})(TextValidator);

const mapDispatchToProps = {
    getFactionalLeaderboard,
    setLoader,
    toggleModal,
};

const mapStateToProps = ({ Auth, Leaderboard }) => {
    const { factionalLeaderboard } = Leaderboard;
    const { isLoader, isModal } = Auth;

    return { factionalLeaderboard, isLoader, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(Leaderboard);
