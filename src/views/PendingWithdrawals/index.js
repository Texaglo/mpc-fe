import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import { getPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from "../../store/actions/PendingWithdrawals"
import { setLoader, toggleModal } from "../../store/actions/Auth";
import EventBus from 'eventing-bus';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
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
            selectedWithdrawal: null,
            adminNotes: '',
            modalAction: '' // 'approve' or 'reject'
        };
        props.getPendingWithdrawals();
    }

    componentWillReceiveProps({ pendingWithdrawals }) {
        // Always update the data when props change, even if it's empty
        this.setState({ pendingWithdrawalsData: pendingWithdrawals || [] })
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

    render() {
        let { pendingWithdrawalsData, selectedWithdrawal, adminNotes, modalAction } = this.state;
        const { isModal } = this.props;

        const columns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 50,
                filterable: false
            },
            {
                accessor: 'username',
                Header: 'Username',
                width: 150,
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                },
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'email',
                Header: 'Email',
                width: 200,
                filterMethod: (filter, row) => {
                    return row[filter.id] ? row[filter.id].toLowerCase().includes(filter.value.toLowerCase()) : false;
                },
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'requestedAmount',
                Header: 'Amount',
                width: 100,
                Cell: ({ value }) => value ? `$${value.toFixed(2)}` : 'N/A'
            },
            {
                accessor: 'withdrawalMethod',
                Header: 'Method',
                width: 120,
                Cell: ({ value }) => value || 'N/A'
            },
            {
                accessor: 'bankDetails',
                Header: 'Bank Details',
                width: 200,
                Cell: ({ value }) => {
                    if (value && value.accountNumber) {
                        return (
                            <div className="bank-details">
                                <div>Bank: {value.bankName || 'N/A'}</div>
                                <div>Account: {value.accountNumber.length > 4 ? `****${value.accountNumber.slice(-4)}` : value.accountNumber}</div>
                                <div>Routing: {value.routingNumber || 'N/A'}</div>
                            </div>
                        );
                    }
                    return 'N/A';
                }
            },
            {
                accessor: 'KYCStatus',
                Header: 'KYC Status',
                width: 100,
                Cell: ({ value }) => value ? (
                    <span className={`kyc-status ${value === 'verified' ? 'verified' : 'pending'}`}>
                        {value}
                    </span>
                ) : 'N/A'
            },
            {
                Header: 'Balances',
                width: 150,
                Cell: ({ original }) => {
                    if (original && original.currentBalances) {
                        return (
                            <div className="balances">
                                <div>SC: {original.currentBalances.sweepCoins || 0}</div>
                                <div>GC: {original.currentBalances.goldCoins || 0}</div>
                                <div>TC: {original.currentBalances.timeCoins || 0}</div>
                                <div>MPC: {original.currentBalances.mpcToken || 0}</div>
                            </div>
                        );
                    }
                    return 'N/A';
                }
            },
            {
                accessor: 'requestedAt',
                Header: 'Request Date',
                width: 150,
                Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A'
            },
            {
                Cell: item => (
                    <div className="action-buttons">
                        <button onClick={() => this.openApproveModal(item['original'])} className="approve-btn">Approve</button>
                        <button onClick={() => this.openRejectModal(item['original'])} className="reject-btn">Reject</button>
                    </div>
                ),
                Header: 'Actions',
                width: 180,
                filterable: false
            },
        ];

        return (
            <div className='content'>
                <div className="main-container pending-withdrawals">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">PENDING WITHDRAWALS</p>
                    </div>
                    <Fragment>
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table withdrawals-table"
                                columns={columns}
                                filterable={true}
                                data={pendingWithdrawalsData}
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
                                        <p style={{ color: '#fff' }}>Email: {selectedWithdrawal.email || 'N/A'}</p>
                                        <p style={{ color: '#fff' }}>Amount: ${selectedWithdrawal.requestedAmount || 0}</p>
                                        <p style={{ color: '#fff' }}>Method: {selectedWithdrawal.withdrawalMethod || 'N/A'}</p>
                                        <p style={{ color: '#fff' }}>KYC Status: {selectedWithdrawal.KYCStatus || 'N/A'}</p>
                                        {selectedWithdrawal.bankDetails && (
                                            <>
                                                <p style={{ color: '#fff' }}>Bank: {selectedWithdrawal.bankDetails.bankName || 'N/A'}</p>
                                                <p style={{ color: '#fff' }}>Account: ****{selectedWithdrawal.bankDetails.accountNumber ? selectedWithdrawal.bankDetails.accountNumber.slice(-4) : 'N/A'}</p>
                                            </>
                                        )}
                                    </div>
                                    {modalAction === 'approve' && (
                                        <div className="approval-warning mt-3">
                                            <p style={{ color: '#ff9800', fontSize: '13px' }}>
                                                ⚠️ Note: Approval will initiate ACH transfer to platform bank account. 
                                                Manual transfer to user's bank will be required.
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
            </div >
        );
    }
}

const mapDispatchToProps = {
    getPendingWithdrawals, approveWithdrawal, rejectWithdrawal, setLoader, toggleModal
};

const mapStateToProps = ({ PendingWithdrawals, Auth }) => {
    let { pendingWithdrawals } = PendingWithdrawals;
    let { isModal } = Auth;
    return { pendingWithdrawals, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(PendingWithdrawals);