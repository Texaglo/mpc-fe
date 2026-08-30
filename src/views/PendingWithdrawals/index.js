import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import {
    getPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    getWalletBalance,
    getApprovedWithdrawals,
    getHotWalletRefills,
    requestHotWalletRefill,
    approveHotWalletRefill,
    rejectHotWalletRefill,
} from "../../store/actions/PendingWithdrawals"
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
            payoutReferenceId: '',
            modalAction: '', // 'approve' or 'reject'
            isBalanceModalOpen: false,
            activeTab: 'pending', // 'pending' or 'approved'
            refillAmount: '',
            refillReason: '',
            selectedRefill: null,
            refillAction: '',
            refillActionNotes: '',
            isRefillActionModalOpen: false,
        };
        props.getPendingWithdrawals();
        props.getWalletBalance();
        props.getHotWalletRefills();
    }

    componentWillReceiveProps(nextProps) {
        const { pendingWithdrawals, approvedWithdrawals, refillRequirement } = nextProps;
        // Always update the data when props change, even if it's empty
        this.setState({
            pendingWithdrawalsData: pendingWithdrawals || [],
            approvedWithdrawalsData: approvedWithdrawals || []
        });

        if (refillRequirement && refillRequirement !== this.props.refillRequirement) {
            this.setState({
                isBalanceModalOpen: true,
            });
            document.body.style.overflow = 'hidden';
        }
    }

    openApproveModal = (withdrawal) => {
        this.props.getWalletBalance();
        this.setState({ 
            selectedWithdrawal: withdrawal, 
            adminNotes: '',
            payoutReferenceId: '',
            modalAction: 'approve' 
        });
        this.props.toggleModal(true);
    }

    openRejectModal = (withdrawal) => {
        this.setState({ 
            selectedWithdrawal: withdrawal, 
            adminNotes: '',
            payoutReferenceId: '',
            modalAction: 'reject' 
        });
        this.props.toggleModal(true);
    }

    cancelModal = () => {
        this.setState({ 
            selectedWithdrawal: null, 
            adminNotes: '',
            payoutReferenceId: '',
            modalAction: '' 
        });
        this.props.toggleModal(false);
    }

    handleNotesChange = (e) => {
        this.setState({ adminNotes: e.target.value });
    }

    submitAction = async () => {
        const { selectedWithdrawal, adminNotes, modalAction, payoutReferenceId } = this.state;

        if (!adminNotes.trim()) {
            EventBus.publish("error", `Please provide ${modalAction === 'approve' ? 'approval' : 'rejection'} notes`);
            return;
        }
        if (modalAction === 'approve' && selectedWithdrawal.withdrawalMethod === 'bank' && payoutReferenceId.trim().length < 3) {
            EventBus.publish('error', 'Enter the external bank payout reference');
            return;
        }

        // Close modal and clear state
        this.props.toggleModal(false);
        this.setState({ selectedWithdrawal: null, adminNotes: '', payoutReferenceId: '', modalAction: '' });

        // Dispatch the action - saga will handle loader and refresh
        if (modalAction === 'approve') {
            this.props.approveWithdrawal({
                withdrawalId: selectedWithdrawal.withdrawalId,
                adminNotes: adminNotes,
                payoutReferenceId: payoutReferenceId.trim()
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
        this.props.getHotWalletRefills();
        // Prevent background scroll
        document.body.style.overflow = 'hidden';
    }

    closeBalanceModal = () => {
        this.setState({ isBalanceModalOpen: false });
        // Restore background scroll
        document.body.style.overflow = 'unset';
    }

    handleRefillRequest = () => {
        const amountSol = Number(this.state.refillAmount);
        const reason = this.state.refillReason.trim();
        if (!Number.isFinite(amountSol) || amountSol <= 0) {
            EventBus.publish('error', 'Enter a valid SOL refill amount');
            return;
        }
        if (reason.length < 5) {
            EventBus.publish('error', 'Enter a reason for the refill request');
            return;
        }
        this.props.requestHotWalletRefill({ amountSol, reason });
        this.setState({ refillAmount: '', refillReason: '' });
    }

    openRefillActionModal = (refill, action) => {
        this.setState({
            selectedRefill: refill,
            refillAction: action,
            refillActionNotes: '',
            isRefillActionModalOpen: true,
            isBalanceModalOpen: false,
        });
    }

    closeRefillActionModal = () => {
        this.setState({
            selectedRefill: null,
            refillAction: '',
            refillActionNotes: '',
            isRefillActionModalOpen: false,
        });
        document.body.style.overflow = 'unset';
    }

    submitRefillAction = () => {
        const { selectedRefill, refillAction, refillActionNotes } = this.state;
        if (!selectedRefill || refillActionNotes.trim().length < 3) {
            EventBus.publish('error', `${refillAction === 'approve' ? 'Approval notes' : 'A rejection reason'} are required`);
            return;
        }
        const payload = { refillId: selectedRefill.refillId, notes: refillActionNotes.trim() };
        if (refillAction === 'approve') this.props.approveHotWalletRefill(payload);
        else this.props.rejectHotWalletRefill(payload);
        this.closeRefillActionModal();
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
        let {
            pendingWithdrawalsData,
            approvedWithdrawalsData,
            selectedWithdrawal,
            adminNotes,
            payoutReferenceId,
            modalAction,
            isBalanceModalOpen,
            activeTab,
            refillAmount,
            refillReason,
            selectedRefill,
            refillAction,
            refillActionNotes,
            isRefillActionModalOpen,
        } = this.state;
        const { isModal, walletBalance, hotWalletRefills, refillRequirement } = this.props;
        const pendingRefills = (hotWalletRefills || []).filter(refill => refill.status === 'pending');
        const hotWalletSol = Number(walletBalance?.hotWallet?.balance || 0);
        const selectedPayoutSol = Number(selectedWithdrawal?.receivedAmount || 0);
        const estimatedRequiredSol = selectedPayoutSol + 0.00001;
        const hasEstimatedCoverage = hotWalletSol >= estimatedRequiredSol;

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
                Header: 'Payout Source',
                Cell: ({ value }) => value ? 'Legacy two-hop' : 'Prefunded hot wallet',
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
                            Wallet Operations {pendingRefills.length > 0 ? `(${pendingRefills.length})` : ''}
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
                                    {modalAction === 'approve' && selectedWithdrawal.withdrawalMethod !== 'bank' && (
                                        <React.Fragment>
                                            <div className={`approval-wallet-summary mt-3 ${hasEstimatedCoverage ? 'covered' : 'shortfall'}`}>
                                                <div>
                                                    <span>Distribution wallet</span>
                                                    <strong>{hotWalletSol.toFixed(9)} SOL</strong>
                                                </div>
                                                <div>
                                                    <span>Payout</span>
                                                    <strong>{selectedPayoutSol.toFixed(9)} SOL</strong>
                                                </div>
                                                <div>
                                                    <span>Coverage</span>
                                                    <strong>{hasEstimatedCoverage ? 'Available' : 'Refill required'}</strong>
                                                </div>
                                            </div>
                                            <div className="approval-warning mt-3">
                                                <p style={{ color: '#ff9800', fontSize: '13px' }}>
                                                    Approval pays the user directly from the prefunded distribution wallet. It does not move funds from treasury. The backend rechecks the exact network fee before signing.
                                                </p>
                                            </div>
                                        </React.Fragment>
                                    )}
                                </div>
                                
                                <div className="col-12">
                                    {modalAction === 'approve' && selectedWithdrawal.withdrawalMethod === 'bank' && <label className="bank-reference-field">External payout reference *<input value={payoutReferenceId} onChange={event => this.setState({ payoutReferenceId: event.target.value })} placeholder="Provider transfer or confirmation ID" /><small>Enter this after the external bank payout has completed.</small></label>}
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
                                        {modalAction === 'approve' ? (selectedWithdrawal.withdrawalMethod === 'bank' ? 'Mark bank payout complete' : 'Send from Hot Wallet') : 'Reject Withdrawal'}
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
                            <p className=''>Distribution Wallet Operations</p>
                        </div>
                        <div className="reward-modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body modal-height reward-modal-body">
                        {walletBalance ? (
                            <div className="row wallet-operations-grid">
                                {refillRequirement && (
                                    <div className="col-12 mb-4">
                                        <div className="refill-required-banner">
                                            <div>
                                                <span className="refill-eyebrow">Withdrawal paused</span>
                                                <h5>Distribution wallet refill required</h5>
                                                <p>The withdrawal remains pending and an audited refill request is now in the approval queue. No treasury funds moved and no user payout was signed.</p>
                                            </div>
                                            <div className="refill-required-metrics">
                                                <span>Available <strong>{Number(refillRequirement.availableSol || 0).toFixed(9)} SOL</strong></span>
                                                <span>Required + fee <strong>{Number(refillRequirement.requiredSol || 0).toFixed(9)} SOL</strong></span>
                                                <span>Suggested refill <strong>{Number(refillRequirement.suggestedRefillSol || 0).toFixed(9)} SOL</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                            <p><span className="wallet-label">Operating Target:</span> {walletBalance.hotWallet?.targetBalance || 0} SOL</p>
                                            <p>
                                                <span className="wallet-label">Status:</span>
                                                <span className={`wallet-status ${walletBalance.hotWallet?.status?.toLowerCase()}`}>
                                                    {walletBalance.hotWallet?.status || 'N/A'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 mb-4">
                                    <div className="refill-request-panel">
                                        <div className="refill-panel-copy">
                                            <span className="refill-eyebrow">Treasury → distribution wallet</span>
                                            <h5>Request a refill</h5>
                                            <p>Creating a request does not move funds. A refill must be reviewed and approved separately.</p>
                                        </div>
                                        <div className="refill-form-grid">
                                            <label>
                                                Amount (SOL)
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.000000001"
                                                    value={refillAmount}
                                                    onChange={event => this.setState({ refillAmount: event.target.value })}
                                                    placeholder="50"
                                                />
                                            </label>
                                            <label>
                                                Reason
                                                <input
                                                    type="text"
                                                    value={refillReason}
                                                    onChange={event => this.setState({ refillReason: event.target.value })}
                                                    placeholder="Weekly distribution wallet funding"
                                                />
                                            </label>
                                            <button type="button" className="request-refill-btn" onClick={this.handleRefillRequest}>
                                                Request Refill
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="refill-queue-panel">
                                        <div className="refill-queue-head">
                                            <div>
                                                <span className="refill-eyebrow">Approval queue</span>
                                                <h5>Hot wallet refill requests</h5>
                                            </div>
                                            <span className="refill-count">{pendingRefills.length} pending</span>
                                        </div>
                                        {pendingRefills.length ? pendingRefills.map(refill => (
                                            <div className="refill-row" key={refill.refillId}>
                                                <div className="refill-amount">
                                                    <strong>{Number(refill.amountSol || 0).toFixed(9)} SOL</strong>
                                                    <span>{refill.source === 'withdrawal_shortfall' ? 'Withdrawal shortfall' : 'Manual request'}</span>
                                                </div>
                                                <div className="refill-reason">
                                                    <strong>{refill.reason}</strong>
                                                    <span>{refill.requestedBy || 'Admin'} · {refill.requestedAt ? new Date(refill.requestedAt).toLocaleString() : 'Now'}</span>
                                                </div>
                                                <div className="refill-row-actions">
                                                    <button type="button" className="approve-btn" onClick={() => this.openRefillActionModal(refill, 'approve')}>Review & Approve</button>
                                                    <button type="button" className="reject-btn" onClick={() => this.openRefillActionModal(refill, 'reject')}>Reject</button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="empty-refill-queue">No refill requests are awaiting approval.</div>
                                        )}
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

                {/* ---------------REFILL APPROVAL / REJECTION--------------- */}
                <Modal isOpen={isRefillActionModalOpen} toggle={this.closeRefillActionModal} className="main-modal reward-modal refill-action-modal">
                    <ModalHeader toggle={this.closeRefillActionModal}>
                        <div className="reward-modal-title">
                            <p>{refillAction === 'approve' ? 'Approve Hot Wallet Refill' : 'Reject Hot Wallet Refill'}</p>
                        </div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        {selectedRefill && (
                            <div>
                                <div className="refill-approval-summary">
                                    <span>Requested transfer</span>
                                    <strong>{Number(selectedRefill.amountSol || 0).toFixed(9)} SOL</strong>
                                    <p>Treasury → distribution hot wallet</p>
                                    <small>{selectedRefill.reason}</small>
                                </div>
                                {refillAction === 'approve' && (
                                    <div className="approval-warning mt-3">
                                        <p>Approval signs and submits the treasury transfer. This is separate from withdrawal approval and cannot be undone after submission.</p>
                                    </div>
                                )}
                                <label className="refill-notes-label">
                                    {refillAction === 'approve' ? 'Approval notes *' : 'Rejection reason *'}
                                    <textarea
                                        rows="4"
                                        value={refillActionNotes}
                                        onChange={event => this.setState({ refillActionNotes: event.target.value })}
                                        placeholder={refillAction === 'approve' ? 'Verified amount and treasury balance' : 'Explain why this refill should not proceed'}
                                    />
                                </label>
                                <div className="refill-modal-actions">
                                    <button type="button" className="delete-btn add-btn" onClick={this.closeRefillActionModal}>Cancel</button>
                                    <button
                                        type="button"
                                        className={refillAction === 'approve' ? 'approve-modal-btn' : 'reject-modal-btn'}
                                        onClick={this.submitRefillAction}
                                    >
                                        {refillAction === 'approve' ? 'Approve Treasury Refill' : 'Reject Refill'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>
            </div >
        );
    }
}

const mapDispatchToProps = {
    getPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    getWalletBalance,
    getApprovedWithdrawals,
    getHotWalletRefills,
    requestHotWalletRefill,
    approveHotWalletRefill,
    rejectHotWalletRefill,
    setLoader,
    toggleModal
};

const mapStateToProps = ({ PendingWithdrawals, Auth }) => {
    let { pendingWithdrawals, approvedWithdrawals, walletBalance, hotWalletRefills, refillRequirement } = PendingWithdrawals;
    let { isModal } = Auth;
    return { pendingWithdrawals, approvedWithdrawals, walletBalance, hotWalletRefills, refillRequirement, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(PendingWithdrawals);
