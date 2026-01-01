import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import { getUsers, toggleFreezeUser } from "../../store/actions/Users";
import { setLoader, toggleModal } from "../../store/actions/Auth";
import { Modal, ModalHeader, ModalBody } from "reactstrap";

import './index.css';

class Users extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            usersData: [],
            searchTerm: '',
            currentPage: 1,
            selectedUser: null,
            freezeAction: false
        };
        props.getUsers({ page: 1, limit: 20 });
    }

    componentWillReceiveProps({ users, pagination }) {
        this.setState({
            usersData: users || [],
            currentPage: pagination?.currentPage || 1
        });
    }

    handleSearch = (e) => {
        const searchTerm = e.target.value;
        this.setState({ searchTerm });

        // Debounce search
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.props.getUsers({ search: searchTerm, page: 1, limit: 20 });
        }, 500);
    }

    handlePageChange = (page) => {
        const { searchTerm } = this.state;
        this.props.getUsers({ search: searchTerm, page: page + 1, limit: 20 });
    }

    openFreezeModal = (user, freeze) => {
        this.setState({
            selectedUser: user,
            freezeAction: freeze
        });
        this.props.toggleModal(true);
    }

    cancelModal = () => {
        this.setState({
            selectedUser: null,
            freezeAction: false
        });
        this.props.toggleModal(false);
    }

    submitFreezeAction = () => {
        const { selectedUser, freezeAction } = this.state;

        this.props.toggleModal(false);
        this.setState({ selectedUser: null, freezeAction: false });

        this.props.toggleFreezeUser({
            userId: selectedUser._id,
            freeze: freezeAction
        });
    }

    render() {
        let { usersData, searchTerm, selectedUser, freezeAction } = this.state;
        const { isModal, pagination } = this.props;

        const columns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 60,
                filterable: false
            },
            {
                accessor: 'username',
                Header: 'Username',
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'email',
                Header: 'Email',
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'publicAddress',
                Header: 'Wallet Address',
                Cell: ({ value }) => {
                    if (value) {
                        if (value.length > 16) {
                            return `${value.substring(0, 6)}...${value.substring(value.length - 6)}`;
                        }
                        return value;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'mpcToken',
                Header: 'MPC',
                Cell: ({ value }) => value?.toLocaleString() || '0',
                filterable: false,
                width: 100
            },
            {
                accessor: 'KYCStatus',
                Header: 'KYC',
                Cell: ({ value }) => value ? (
                    <span className={`kyc-badge ${value === 'verified' ? 'verified' : value === 'pending' ? 'pending' : 'unverified'}`}>
                        {value}
                    </span>
                ) : 'N/A',
                filterable: false,
                width: 100
            },
            {
                accessor: 'isFrozen',
                Header: 'Status',
                Cell: ({ value }) => (
                    <span className={`status-badge ${value ? 'frozen' : 'active'}`}>
                        {value ? 'Frozen' : 'Active'}
                    </span>
                ),
                filterable: false,
                width: 100
            },
            {
                accessor: 'createdAt',
                Header: 'Joined',
                Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A',
                filterable: false,
                width: 110
            },
            {
                Cell: item => (
                    <div className="action-buttons">
                        {item.original.isFrozen ? (
                            <button
                                onClick={() => this.openFreezeModal(item.original, false)}
                                className="unfreeze-btn"
                            >
                                Unfreeze
                            </button>
                        ) : (
                            <button
                                onClick={() => this.openFreezeModal(item.original, true)}
                                className="freeze-btn"
                            >
                                Freeze
                            </button>
                        )}
                    </div>
                ),
                Header: 'Actions',
                filterable: false,
                width: 120
            },
        ];

        return (
            <div className='content'>
                <div className="main-container users-container">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">USERS</p>
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by username, email, or wallet..."
                                value={searchTerm}
                                onChange={this.handleSearch}
                            />
                        </div>
                    </div>

                    <div className="users-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Users:</span>
                            <span className="stat-value">{pagination?.totalUsers || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Page:</span>
                            <span className="stat-value">{pagination?.currentPage || 1} / {pagination?.totalPages || 1}</span>
                        </div>
                    </div>

                    <Fragment>
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={10}
                                className="table"
                                columns={columns}
                                filterable={false}
                                data={usersData}
                                pages={pagination?.totalPages || 1}
                                page={pagination?.currentPage - 1 || 0}
                                manual
                                onPageChange={this.handlePageChange}
                                resolveData={data => data.map(item => item)}
                            />
                        </div>
                    </Fragment>
                </div>

                {/* ---------------FREEZE/UNFREEZE MODAL--------------- */}
                <Modal isOpen={isModal} toggle={this.cancelModal} className="main-modal freeze-modal">
                    <ModalHeader toggle={this.cancelModal}>
                        <div className="modal-title">
                            <p>{freezeAction ? 'Freeze User Account' : 'Unfreeze User Account'}</p>
                        </div>
                        <div className="modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body freeze-modal-body">
                        {selectedUser && (
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="user-details">
                                        <h5>User Details:</h5>
                                        <p><span className="detail-label">Username:</span> {selectedUser.username || 'N/A'}</p>
                                        <p><span className="detail-label">Email:</span> {selectedUser.email || 'N/A'}</p>
                                        <p><span className="detail-label">Wallet:</span> {selectedUser.publicAddress || 'N/A'}</p>
                                        <p><span className="detail-label">Current Status:</span>
                                            <span className={`status-badge ${selectedUser.isFrozen ? 'frozen' : 'active'}`}>
                                                {selectedUser.isFrozen ? 'Frozen' : 'Active'}
                                            </span>
                                        </p>
                                    </div>

                                    <div className={`action-warning mt-3 ${freezeAction ? 'freeze-warning' : 'unfreeze-warning'}`}>
                                        <p>
                                            {freezeAction
                                                ? '⚠️ Warning: Freezing this account will prevent the user from logging in and performing any transactions.'
                                                : '✓ Unfreezing this account will restore the user\'s ability to login and perform transactions.'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="col-12 mt-4 d-flex justify-content-around">
                                    <button className="cancel-btn col-4" type='button' onClick={this.cancelModal}>Cancel</button>
                                    <button
                                        className={`confirm-btn col-4 ${freezeAction ? 'freeze' : 'unfreeze'}`}
                                        type='button'
                                        onClick={this.submitFreezeAction}
                                    >
                                        {freezeAction ? 'Freeze Account' : 'Unfreeze Account'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}

const mapDispatchToProps = {
    getUsers, toggleFreezeUser, setLoader, toggleModal
};

const mapStateToProps = ({ Users, Auth }) => {
    let { users, pagination } = Users;
    let { isModal } = Auth;
    return { users, pagination, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);