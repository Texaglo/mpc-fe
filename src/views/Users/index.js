import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import { getUsers, toggleFreezeUser, getUserTransactions, adjustUserBalance } from "../../store/actions/Users";
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
            freezeAction: false,
            // Transaction History modal
            showHistoryModal: false,
            historyUser: null,
            // Adjust Balance modal
            showAdjustModal: false,
            adjustUser: null,
            adjustAmount: '',
            adjustType: 'credit',
            adjustReason: '',
            // Bulk selection
            selectedUsers: []
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

    // Transaction History Modal handlers
    openHistoryModal = (user) => {
        this.setState({
            showHistoryModal: true,
            historyUser: user
        });
        this.props.getUserTransactions(user._id);
    }

    closeHistoryModal = () => {
        this.setState({
            showHistoryModal: false,
            historyUser: null
        });
    }

    // Adjust Balance Modal handlers
    openAdjustModal = (user) => {
        this.setState({
            showAdjustModal: true,
            adjustUser: user,
            adjustAmount: '',
            adjustType: 'credit',
            adjustReason: ''
        });
    }

    closeAdjustModal = () => {
        this.setState({
            showAdjustModal: false,
            adjustUser: null,
            adjustAmount: '',
            adjustType: 'credit',
            adjustReason: ''
        });
    }

    handleAdjustSubmit = () => {
        const { adjustUser, adjustAmount, adjustType, adjustReason } = this.state;

        if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
            return;
        }

        // Send negative amount for debit, positive for credit
        const amount = adjustType === 'debit'
            ? -Math.abs(parseFloat(adjustAmount))
            : Math.abs(parseFloat(adjustAmount));

        this.props.adjustUserBalance({
            userId: adjustUser._id,
            amount: amount,
            reason: adjustReason
        });

        this.closeAdjustModal();
    }

    // Bulk Selection handlers
    toggleUserSelection = (userId) => {
        const { selectedUsers } = this.state;
        if (selectedUsers.includes(userId)) {
            this.setState({ selectedUsers: selectedUsers.filter(id => id !== userId) });
        } else {
            this.setState({ selectedUsers: [...selectedUsers, userId] });
        }
    }

    toggleSelectAll = () => {
        const { usersData, selectedUsers } = this.state;
        if (selectedUsers.length === usersData.length) {
            this.setState({ selectedUsers: [] });
        } else {
            this.setState({ selectedUsers: usersData.map(user => user._id) });
        }
    }

    exportToCSV = () => {
        const { usersData, selectedUsers } = this.state;
        const usersToExport = usersData.filter(user => selectedUsers.includes(user._id));

        if (usersToExport.length === 0) return;

        const headers = ['Username', 'Email', 'Wallet Address', 'MPCE', 'KYC Status', 'Status', 'Joined'];
        const csvRows = [headers.join(',')];

        usersToExport.forEach(user => {
            const row = [
                user.username || 'N/A',
                user.email || 'N/A',
                user.publicAddress || 'N/A',
                user.mpceCredit || 0,
                user.KYCStatus || 'N/A',
                user.isFrozen ? 'Frozen' : 'Active',
                user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
            ];
            csvRows.push(row.map(val => `"${val}"`).join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    render() {
        let { usersData, searchTerm, selectedUser, freezeAction, showHistoryModal, historyUser, showAdjustModal, adjustUser, adjustAmount, adjustType, adjustReason, selectedUsers } = this.state;
        const { isModal, pagination, userTransactions } = this.props;

        const columns = [
            {
                Header: () => (
                    <input
                        type="checkbox"
                        className="select-checkbox"
                        checked={usersData.length > 0 && selectedUsers.length === usersData.length}
                        onChange={this.toggleSelectAll}
                    />
                ),
                Cell: ({ original }) => (
                    <input
                        type="checkbox"
                        className="select-checkbox"
                        checked={selectedUsers.includes(original._id)}
                        onChange={() => this.toggleUserSelection(original._id)}
                    />
                ),
                width: 50,
                filterable: false,
                sortable: false
            },
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
                accessor: 'mpceCredit',
                Header: 'MPCE',
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
                        <button
                            onClick={() => this.openHistoryModal(item.original)}
                            className="history-btn"
                            title="View Transactions"
                        >
                            History
                        </button>
                        <button
                            onClick={() => this.openAdjustModal(item.original)}
                            className="adjust-btn"
                            title="Adjust Balance"
                        >
                            Adjust
                        </button>
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
                width: 280
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
                        {selectedUsers.length > 0 && (
                            <div className="bulk-actions">
                                <span className="selected-count">{selectedUsers.length} selected</span>
                                <button className="export-btn" onClick={this.exportToCSV}>
                                    Export CSV
                                </button>
                            </div>
                        )}
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
                                    <button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>Cancel</button>
                                    <button
                                        className="add-btn "
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

                {/* ---------------TRANSACTION HISTORY MODAL--------------- */}
                <Modal isOpen={showHistoryModal} toggle={this.closeHistoryModal} className="main-modal history-modal" size="lg">
                    <ModalHeader toggle={this.closeHistoryModal}>
                        <div className="modal-title">
                            <p>Transaction History</p>
                        </div>
                        <div className="modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body history-modal-body">
                        {historyUser && (
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="user-details">
                                        <p><span className="detail-label">Username:</span> {historyUser.username || 'N/A'}</p>
                                        <p><span className="detail-label">Current MPCE:</span> {historyUser.mpceCredit?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="transactions-table-wrapper">
                                        {userTransactions && userTransactions.length > 0 ? (
                                            <table className="transactions-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Type</th>
                                                        <th>Paid</th>
                                                        <th>Received</th>
                                                        <th>Status</th>
                                                        <th>Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userTransactions.map((tx, index) => (
                                                        <tr key={index}>
                                                            <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}</td>
                                                            <td>
                                                                <span className={`tx-type ${tx.type?.toLowerCase()}`}>
                                                                    {tx.type || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {tx.paidAmount ? `${tx.paidAmount?.toLocaleString()} ${tx.paidCoinType || ''}` : '-'}
                                                            </td>
                                                            <td className="amount-positive">
                                                                {tx.receivedAmount ? `${tx.receivedAmount?.toLocaleString()} ${tx.receivedCoinType || ''}` : '-'}
                                                            </td>
                                                            <td>
                                                                <span className={`tx-status ${tx.status?.toLowerCase()}`}>
                                                                    {tx.status || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>{tx.reasonCode || tx.adminNotes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="no-transactions">
                                                <p>No transactions found for this user.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 mt-4 d-flex justify-content-center">
                                    <button className="delete-btn add-btn col-4" type='button' onClick={this.closeHistoryModal}>Close</button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>

                {/* ---------------ADJUST BALANCE MODAL--------------- */}
                <Modal isOpen={showAdjustModal} toggle={this.closeAdjustModal} className="main-modal adjust-modal">
                    <ModalHeader toggle={this.closeAdjustModal}>
                        <div className="modal-title">
                            <p>Adjust MPCE Balance</p>
                        </div>
                        <div className="modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body adjust-modal-body">
                        {adjustUser && (
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="user-details">
                                        <p><span className="detail-label">Username:</span> {adjustUser.username || 'N/A'}</p>
                                        <p><span className="detail-label">Current MPCE:</span> {adjustUser.mpceCredit?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>

                                <div className="col-12 mb-3">
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={adjustType}
                                            onChange={(e) => this.setState({ adjustType: e.target.value })}
                                        >
                                            <option value="credit">Credit (Add)</option>
                                            <option value="debit">Debit (Subtract)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-12 mb-3">
                                    <div className="form-group">
                                        <label className="form-label">Amount</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Enter amount"
                                            value={adjustAmount}
                                            onChange={(e) => this.setState({ adjustAmount: e.target.value })}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="col-12 mb-3">
                                    <div className="form-group">
                                        <label className="form-label">Reason</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Enter reason for adjustment"
                                            value={adjustReason}
                                            onChange={(e) => this.setState({ adjustReason: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="col-12 mt-4 d-flex justify-content-around">
                                    <button className="delete-btn add-btn col-4" type='button' onClick={this.closeAdjustModal}>Cancel</button>
                                    <button
                                        className="add-btn col-4"
                                        type='button'
                                        onClick={this.handleAdjustSubmit}
                                        disabled={!adjustAmount || parseFloat(adjustAmount) <= 0}
                                    >
                                        {adjustType === 'credit' ? 'Add MPCE' : 'Subtract MPCE'}
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
    getUsers, toggleFreezeUser, getUserTransactions, adjustUserBalance, setLoader, toggleModal
};

const mapStateToProps = ({ Users, Auth }) => {
    let { users, pagination, userTransactions } = Users;
    let { isModal } = Auth;
    return { users, pagination, userTransactions, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);