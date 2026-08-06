import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import { getPendingWithdrawals, approveWithdrawal, rejectWithdrawal, getWalletBalance, getApprovedWithdrawals } from "../../store/actions/PendingWithdrawals"
import { setLoader, toggleModal } from "../../store/actions/Auth";
import EventBus from 'eventing-bus';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { ValidatorForm, TextValidator } from '../../components/FormValidator';
import { withStyles } from '@material-ui/core/styles';

import './index.css';

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

class PendingWithdrawals extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pendingWithdrawalsData: [],
            approvedWithdrawalsData: [],
            selectedWithdrawal: null,
            adminNotes: '',
            modalAction: '', // 'approve' or 'reject'
            isBalanceModalOpen: false,
            activeTab: 'pending' // 'pending' or 'approved'
        };
        props.getPendingWithdrawals();
    }

    componentWillReceiveProps({ pendingWithdrawals, approvedWithdrawals }) {
        // Always update the data when props change, even if it's empty
        this.setState({
            pendingWithdrawalsData: pendingWithdrawals || [],
            approvedWithdrawalsData: approvedWithdrawals || []
        })
    }

    openApproveModal = (withdrawal) => {
        this.setState({ 
            selectedWithdrawal: withdrawal, 
            adminNotes: '',
            modalAction: 'approve' 
        });
        this.props.toggleModal(true);
    }

    openRejectModal = (withdrawal) => {
        this.setState({ 
            selectedWithdrawal: withdrawal, 
            adminNotes: '',
            modalAction: 'reject' 
        });
        this.props.toggleModal(true);
    }

    cancelModal = () => {
        this.setState({ 
            selectedWithdrawal: null, 
            adminNotes: '',
            modalAction: '' 
        });
        this.props.toggleModal(false);
    }

    handleNotesChange = (e) => {
        this.setState({ adminNotes: e.target.value });
    }

    submitAction = async () => {
        const { selectedWithdrawal, adminNotes, modalAction } = this.state;

        if (!adminNotes.trim()) {
            EventBus.publish("error", `Please provide ${modalAction === 'approve' ? 'approval' : 'rejection'} notes`);
            return;
        }

        // Close modal and clear state
        this.props.toggleModal(false);
        this.setState({ selectedWithdrawal: null, adminNotes: '', modalAction: '' });

        // Dispatch the action - saga will handle loader and refresh
        if (modalAction === 'approve') {
            this.props.approveWithdrawal({
                withdrawalId: selectedWithdrawal.withdrawalId,
                adminNotes: adminNotes
            });
        } else {
            this.props.rejectWithdrawal({
                withdrawalId: selectedWithdrawal.withdrawalId,
                adminNotes: adminNotes
            });
        }
    }

    openBalanceModal = () => {
        this.setState({ isBalanceModalOpen: true });
        this.props.getWalletBalance();
        // Prevent background scroll
        document.body.style.overflow = 'hidden';
    }

    closeBalanceModal = () => {
        this.setState({ isBalanceModalOpen: false });
        // Restore background scroll
        document.body.style.overflow = 'unset';
    }

    componentWillUnmount() {
        // Cleanup: restore scroll when component unmounts
        document.body.style.overflow = 'unset';
    }

    switchTab = (tabName) => {
        this.setState({ activeTab: tabName });
        if (tabName === 'approved') {
            this.props.getApprovedWithdrawals();
        }
    }

    render() {
        let { pendingWithdrawalsData, approvedWithdrawalsData, selectedWithdrawal, adminNotes, modalAction, isBalanceModalOpen, activeTab } = this.state;
        const { isModal, walletBalance } = this.props;

        // Pending withdrawals columns with Actions
        const pendingColumns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 100,
                filterable: false
            },
            {
                accessor: 'username',
                Header: 'Username',
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                },
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'paidAmount',
                Header: 'Paid Amount',
                Cell: ({ original }) => {
                    if (original.paidAmount && original.paidCoinType) {
                        return `${original.paidAmount} ${original.paidCoinType.toUpperCase()}`;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'receivedAmount',
                Header: 'Received Amount',
                Cell: ({ original }) => {
                    if (original.receivedAmount && original.receivedCoinType) {
                        return `${original.receivedAmount} ${original.receivedCoinType.toUpperCase()}`;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'withdrawalMethod',
                Header: 'Method',
                Cell: ({ value }) => value || 'N/A',
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                }
            },
            {
                accessor: 'userWalletAddress',
                Header: 'Wallet Address',
                Cell: ({ value }) => {
                    if (value) {
                        // Show first 6 and last 6 characters for long addresses
                        if (value.length > 20) {
                            return `${value.substring(0, 6)}...${value.substring(value.length - 6)}`;
                        }
                        return value;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'KYCStatus',
                Header: 'KYC Status',
                Cell: ({ value }) => value ? (
                    <span className={`kyc-status ${value === 'verified' ? 'verified' : 'pending'}`}>
                        {value}
                    </span>
                ) : 'N/A',
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                }
            },
            {
                accessor: 'requestedAt',
                Header: 'Request Date',
                Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A',
                filterable: false
            },
            {
                Cell: item => (
                    <div className="action-buttons">
                        <button onClick={() => this.openApproveModal(item['original'])} className="approve-btn">Approve</button>
                        <button onClick={() => this.openRejectModal(item['original'])} className="reject-btn">Reject</button>
                    </div>
                ),
                Header: 'Actions',
                filterable: false
            },
        ];

        // Approved withdrawals columns (no Actions, add Processed By and Processed At)
        const approvedColumns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 100,
                filterable: false
            },
            {
                accessor: 'username',
                Header: 'Username',
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                },
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'paidAmount',
                Header: 'Paid Amount',
                Cell: ({ original }) => {
                    if (original.paidAmount && original.paidCoinType) {
                        return `${original.paidAmount} ${original.paidCoinType.toUpperCase()}`;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'receivedAmount',
                Header: 'Received Amount',
                Cell: ({ original }) => {
                    if (original.receivedAmount && original.receivedCoinType) {
                        return `${original.receivedAmount} ${original.receivedCoinType.toUpperCase()}`;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'withdrawalMethod',
                Header: 'Method',
                Cell: ({ value }) => value || 'N/A',
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                }
            },
            {
                accessor: 'userWalletAddress',
                Header: 'Wallet Address',
                Cell: ({ value }) => {
                    if (value) {
                        // Show first 6 and last 6 characters for long addresses
                        if (value.length > 20) {
                            return `${value.substring(0, 6)}...${value.substring(value.length - 6)}`;
                        }
                        return value;
                    }
                    return 'N/A';
                },
                filterable: false
            },
            {
                accessor: 'KYCStatus',
                Header: 'KYC Status',
                Cell: ({ value }) => value ? (
                    <span className={`kyc-status ${value === 'verified' ? 'verified' : 'pending'}`}>
                        {value}
                    </span>
                ) : 'N/A',
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                }
            },
            {
                accessor: 'requestedAt',
                Header: 'Request Date',
                Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A',
                filterable: false
            },
            {
                accessor: 'processedBy',
                Header: 'Processed By',
                Cell: ({ value }) => value || 'N/A',
                filterable: false
            },
            {
                accessor: 'processedAt',
                Header: 'Processed At',
                Cell: ({ value }) => value ? new Date(value).toLocaleString() : 'N/A',
                filterable: false
            },
            {
                accessor: 'treasuryFundingHash',
                Header: 'Treasury to Hot',
                Cell: ({ original, value }) => value ? (
                    <a
                        href={`https://solscan.io/tx/${value}${original.network === 'devnet' ? '?cluster=devnet' : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transaction-link"
                        title={value}
                    >
                        {`${value.substring(0, 6)}...${value.substring(value.length - 6)}`}
                    </a>
                ) : 'N/A',
                filterable: false
            },
            {
                accessor: 'hotWalletPayoutHash',
                Header: 'Hot to User',
                Cell: ({ original, value }) => value ? (
                    <a
                        href={`https://solscan.io/tx/${value}${original.network === 'devnet' ? '?cluster=devnet' : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transaction-link"
                        title={value}
                    >
                        {`${value.substring(0, 6)}...${value.substring(value.length - 6)}`}
                    </a>
                ) : 'N/A',
                filterable: false
            },
        ];

        return (
            <div className='content'>
                <div className="main-container pending-withdrawals">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">
                            {activeTab === 'pending' ? 'PENDING WITHDRAWALS' : 'APPROVED WITHDRAWALS'}
                        </p>
                        <button className="balance-btn" onClick={this.openBalanceModal}>
                            Balance
                        </button>
                    </div>

                    {/* Stats Summary */}
                    {activeTab === 'pending' && pendingWithdrawalsData.length > 0 && (
                        <div className="withdrawals-stats">
                            <div className="stat-item">
                                <span className="stat-label">Total Pending:</span>
                                <span className="stat-value">
                                    {pendingWithdrawalsData.reduce((sum, w) => sum + (parseFloat(w.receivedAmount) || 0), 0).toFixed(6)} SOL
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Count:</span>
                                <span className="stat-value">{pendingWithdrawalsData.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="tabs-container">
                        <button
                            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => this.switchTab('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
                            onClick={() => this.switchTab('approved')}
                        >
                            Approved
                        </button>
                    </div>

                    <Fragment>
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                columns={activeTab === 'pending' ? pendingColumns : approvedColumns}
                                filterable={true}
                                data={activeTab === 'pending' ? pendingWithdrawalsData : approvedWithdrawalsData}
                                resolveData={data => data.map(item => item)}
                            />
                        </div>
                    </Fragment>
                </div>

                {/* ---------------APPROVAL/REJECTION MODAL--------------- */}
                <Modal isOpen={isModal} toggle={this.cancelModal} className="main-modal reward-modal">
                    <ModalHeader toggle={this.cancelModal}>
                        <div className="reward-modal-title">
                            <p className=''>{modalAction === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}</p>
                        </div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body modal-height reward-modal-body">
                        {selectedWithdrawal && (
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="withdrawal-details">
                                        <h5 style={{ color: '#fa6634' }}>Withdrawal Details:</h5>
                                        <p style={{ color: '#fff' }}>User: {selectedWithdrawal.username || 'N/A'}</p>
                                        <p style={{ color: '#fff' }}>KYC Status: {selectedWithdrawal.KYCStatus || 'N/A'}</p>
                                        <p style={{ color: '#fff' }}>Paid Amount: {selectedWithdrawal.paidAmount} {selectedWithdrawal.paidCoinType ? selectedWithdrawal.paidCoinType.toUpperCase() : ''}</p>
                                        <p style={{ color: '#fff' }}>Received Amount: {selectedWithdrawal.receivedAmount} {selectedWithdrawal.receivedCoinType ? selectedWithdrawal.receivedCoinType.toUpperCase() : ''}</p>
                                        <p style={{ color: '#fff' }}>Method: {selectedWithdrawal.withdrawalMethod || 'N/A'}</p>
                                        <p style={{ color: '#fff' }}>Wallet Address: {selectedWithdrawal.userWalletAddress || 'N/A'}</p>
                                        <p style={{ color: '#fff' }}>Requested At: {selectedWithdrawal.requestedAt ? new Date(selectedWithdrawal.requestedAt).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    {modalAction === 'approve' && (
                                        <div className="approval-warning mt-3">
                                            <p style={{ color: '#ff9800', fontSize: '13px' }}>
                                                Approval signs and submits this withdrawal. This action cannot be undone.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="col-12">
                                    <ValidatorForm onSubmit={this.submitAction}>
                                        <label style={{ color: '#fa6634', marginBottom: '10px' }}>
                                            {modalAction === 'approve' ? 'Approval Notes *' : 'Rejection Notes *'}
                                        </label>
                                        <CustomTextField
                                            fullWidth
                                            className="text-field"
                                            autoComplete='off'
                                            placeholder={modalAction === 'approve' ? 
                                                "Enter approval notes (e.g., verification complete, processing initiated)" : 
                                                "Enter reason for rejection"}
                                            multiline
                                            rows={4}
                                            value={adminNotes}
                                            variant="standard"
                                            onChange={this.handleNotesChange}
                                            validators={['required']}
                                            errorMessages={[`Please enter ${modalAction} notes`]}
                                        />
                                    </ValidatorForm>
                                </div>

                                <div className="col-12 mt-4 d-flex justify-content-around">
                                    <button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>Cancel</button>
                                    <button 
                                        className={modalAction === 'approve' ? "approve-modal-btn col-4" : "reject-modal-btn col-4"} 
                                        type='button' 
                                        onClick={this.submitAction}
                                    >
                                        {modalAction === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>

                {/* ---------------BALANCE MODAL--------------- */}
                <Modal isOpen={isBalanceModalOpen} toggle={this.closeBalanceModal} className="main-modal balance-modal" size="lg">
                    <ModalHeader toggle={this.closeBalanceModal}>
                        <div className="reward-modal-title">
                            <p className=''>Wallet Balances</p>
                        </div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body modal-height reward-modal-body">
                        {walletBalance ? (
                            <div className="row">
                                <div className="col-md-6 col-12 mb-4">
                                    <div className="wallet-card">
                                        <h5 style={{ color: '#fa6634', marginBottom: '15px' }}>Treasury Wallet</h5>
                                        <div className="wallet-info">
                                            <p><span className="wallet-label">Address:</span> {walletBalance.treasuryWallet?.address || 'N/A'}</p>
                                            <p><span className="wallet-label">Native SOL:</span> {walletBalance.treasuryWallet?.balanceSOL || 'N/A'}</p>
                                            <p><span className="wallet-label">Wrapped SOL:</span> {walletBalance.treasuryWallet?.balanceWSOL || 'N/A'}</p>
                                            <p><span className="wallet-label">USDC:</span> {walletBalance.treasuryWallet?.balanceUSDC || 'N/A'}</p>
                                            <p><span className="wallet-label">Purpose:</span> {walletBalance.treasuryWallet?.purpose || 'Deposit custody'}</p>
                                            <p><span className="wallet-label">Direct user payouts:</span> No</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6 col-12 mb-4">
                                    <div className="wallet-card">
                                        <h5 style={{ color: '#fa6634', marginBottom: '15px' }}>Distribution Hot Wallet</h5>
                                        <div className="wallet-info">
                                            <p><span className="wallet-label">Address:</span> {walletBalance.hotWallet?.address || 'N/A'}</p>
                                            <p><span className="wallet-label">Native SOL:</span> {walletBalance.hotWallet?.balanceSOL || 'N/A'}</p>
                                            <p><span className="wallet-label">Wrapped SOL:</span> {walletBalance.hotWallet?.balanceWSOL || 'N/A'}</p>
                                            <p><span className="wallet-label">USDC:</span> {walletBalance.hotWallet?.balanceUSDC || 'N/A'}</p>
                                            <p><span className="wallet-label">Purpose:</span> {walletBalance.hotWallet?.purpose || 'Approved withdrawals'}</p>
                                            <p><span className="wallet-label">Min Balance:</span> {walletBalance.hotWallet?.minBalance || 0} SOL</p>
                                            <p><span className="wallet-label">Alert Threshold:</span> {walletBalance.hotWallet?.alertThreshold || 0} SOL</p>
                                            <p>
                                                <span className="wallet-label">Status:</span>
                                                <span className={`wallet-status ${walletBalance.hotWallet?.status?.toLowerCase()}`}>
                                                    {walletBalance.hotWallet?.status || 'N/A'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="text-center" style={{ color: '#fff', padding: '20px' }}>
                                <p>Loading wallet balance information...</p>
                            </div>
                        )}
                    </ModalBody>
                </Modal>
            </div >
        );
    }
}

const mapDispatchToProps = {
    getPendingWithdrawals, approveWithdrawal, rejectWithdrawal, getWalletBalance, getApprovedWithdrawals, setLoader, toggleModal
};

const mapStateToProps = ({ PendingWithdrawals, Auth }) => {
    let { pendingWithdrawals, approvedWithdrawals, walletBalance } = PendingWithdrawals;
    let { isModal } = Auth;
    return { pendingWithdrawals, approvedWithdrawals, walletBalance, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(PendingWithdrawals);
