import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import { getUsers, toggleFreezeUser, getUserTransactions, adjustUserBalance, forceLogoutUser, getUserInventory, getInventoryCatalog, grantInventoryItem, revokeInventoryItem } from "../../store/actions/Users";
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
            freezeReason: '',
            // Transaction History modal
            showHistoryModal: false,
            historyUser: null,
            historyTransactions: [],
            historyPagination: { currentPage: 1, totalPages: 1, totalTransactions: 0 },
            historyFilters: { type: '', status: '', asset: '' },
            showProfileModal: false,
            profileUser: null,
            profileData: null,
            profileLoading: false,
            // Adjust Balance modal
            showAdjustModal: false,
            adjustUser: null,
            adjustAmount: '',
            adjustType: 'credit',
            adjustAsset: 'CASH',
            adjustReason: '',
            showLogoutModal: false,
            logoutUser: null,
            logoutReason: '',
            showInventoryModal: false,
            inventoryUser: null,
            inventorySearch: '',
            inventoryStatus: 'all',
            inventoryPage: 1,
            catalogSearch: '',
            grantItemId: '',
            grantQuantity: 1,
            grantReason: '',
            revokeEntry: null,
            revokeReason: '',
            // Bulk selection
            selectedUsers: []
        };
        props.getUsers({ page: 1, limit: 20 });
    }

    componentDidMount() {
        this.usersRefreshTimer = window.setInterval(() => {
            const { searchTerm, currentPage } = this.state;
            this.props.getUsers({ search: searchTerm, page: currentPage, limit: 20, silent: true });
        }, 30000);
    }

    componentWillUnmount() {
        if (this.usersRefreshTimer) window.clearInterval(this.usersRefreshTimer);
        if (this.searchTimeout) window.clearTimeout(this.searchTimeout);
        if (this.inventorySearchTimeout) window.clearTimeout(this.inventorySearchTimeout);
        if (this.catalogSearchTimeout) window.clearTimeout(this.catalogSearchTimeout);
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
            freezeAction: freeze,
            freezeReason: ''
        });
        this.props.toggleModal(true);
    }

    cancelModal = () => {
        this.setState({
            selectedUser: null,
            freezeAction: false,
            freezeReason: ''
        });
        this.props.toggleModal(false);
    }

    submitFreezeAction = () => {
        const { selectedUser, freezeAction, freezeReason } = this.state;
        if (!freezeReason.trim()) return;

        this.props.toggleModal(false);
        this.setState({ selectedUser: null, freezeAction: false, freezeReason: '' });

        this.props.toggleFreezeUser({
            userId: selectedUser._id,
            freeze: freezeAction,
            reason: freezeReason.trim()
        });
    }

    // Transaction History Modal handlers
    openHistoryModal = (user) => {
        this.setState({
            showHistoryModal: true,
            historyUser: user,
            historyTransactions: [],
            historyPagination: { currentPage: 1, totalPages: 1, totalTransactions: 0 },
            historyFilters: { type: '', status: '', asset: '' }
        }, () => this.loadTransactionHistory(1));
    }

    loadTransactionHistory = async (page = 1) => {
        const { historyUser, historyFilters } = this.state;
        if (!historyUser) return;
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        Object.entries(historyFilters).forEach(([key, value]) => value && params.set(key, value));
        try {
            const response = await axios.get(`/admin/users/${historyUser._id}/transactions?${params.toString()}`);
            const body = response?.data?.body || {};
            this.setState({ historyTransactions: body.transactions || [], historyPagination: body.pagination || {} });
        } catch (error) {
            EventBus.publish('error', error?.response?.data?.message || 'Unable to load transaction history');
        }
    }

    updateHistoryFilter = (key, value) => this.setState(current => ({ historyFilters: { ...current.historyFilters, [key]: value } }), () => this.loadTransactionHistory(1));

    closeHistoryModal = () => {
        this.setState({
            showHistoryModal: false,
            historyUser: null
        });
    }

    openProfileModal = async (user) => {
        this.setState({ showProfileModal: true, profileUser: user, profileData: null, profileLoading: true });
        try {
            const response = await axios.get(`/admin/users/${user._id}/profile`);
            this.setState({ profileData: response?.data?.body || null });
        } catch (error) {
            EventBus.publish('error', error?.response?.data?.message || 'Unable to load player profile');
        } finally {
            this.setState({ profileLoading: false });
        }
    }

    closeProfileModal = () => this.setState({ showProfileModal: false, profileUser: null, profileData: null, profileLoading: false });

    // Adjust Balance Modal handlers
    openAdjustModal = (user) => {
        this.setState({
            showAdjustModal: true,
            adjustUser: user,
            adjustAmount: '',
            adjustType: 'credit',
            adjustAsset: 'CASH',
            adjustReason: ''
        });
    }

    closeAdjustModal = () => {
        this.setState({
            showAdjustModal: false,
            adjustUser: null,
            adjustAmount: '',
            adjustType: 'credit',
            adjustAsset: 'CASH',
            adjustReason: ''
        });
    }

    handleAdjustSubmit = () => {
        const { adjustUser, adjustAmount, adjustType, adjustAsset, adjustReason } = this.state;

        if (!adjustAmount || parseFloat(adjustAmount) <= 0 || !adjustReason.trim()) {
            return;
        }

        // Send negative amount for debit, positive for credit
        const amount = adjustType === 'debit'
            ? -Math.abs(parseFloat(adjustAmount))
            : Math.abs(parseFloat(adjustAmount));

        this.props.adjustUserBalance({
            userId: adjustUser._id,
            amount: amount,
            reason: adjustReason.trim(),
            asset: adjustAsset
        });

        this.closeAdjustModal();
    }

    openLogoutModal = (user) => this.setState({ showLogoutModal: true, logoutUser: user, logoutReason: '' });

    closeLogoutModal = () => this.setState({ showLogoutModal: false, logoutUser: null, logoutReason: '' });

    submitForceLogout = () => {
        const { logoutUser, logoutReason } = this.state;
        if (!logoutUser || !logoutReason.trim()) return;
        this.props.forceLogoutUser({ userId: logoutUser._id, reason: logoutReason.trim() });
        this.closeLogoutModal();
    }

    openInventoryModal = (user) => {
        this.setState({
            showInventoryModal: true,
            inventoryUser: user,
            inventorySearch: '',
            inventoryStatus: 'all',
            inventoryPage: 1,
            catalogSearch: '',
            grantItemId: '',
            grantQuantity: 1,
            grantReason: '',
            revokeEntry: null,
            revokeReason: ''
        });
        this.props.getUserInventory({ userId: user._id, page: 1, limit: 25, status: 'all' });
        this.props.getInventoryCatalog({ limit: 100, isActive: true });
    }

    closeInventoryModal = () => {
        if (this.inventorySearchTimeout) clearTimeout(this.inventorySearchTimeout);
        if (this.catalogSearchTimeout) clearTimeout(this.catalogSearchTimeout);
        this.setState({ showInventoryModal: false, inventoryUser: null, revokeEntry: null });
    }

    refreshInventory = (overrides = {}) => {
        const { inventoryUser, inventorySearch, inventoryStatus, inventoryPage } = this.state;
        if (!inventoryUser) return;
        this.props.getUserInventory({
            userId: inventoryUser._id,
            page: overrides.page || inventoryPage,
            limit: 25,
            search: overrides.search !== undefined ? overrides.search : inventorySearch,
            status: overrides.status || inventoryStatus
        });
    }

    handleInventorySearch = (event) => {
        const inventorySearch = event.target.value;
        this.setState({ inventorySearch, inventoryPage: 1 });
        if (this.inventorySearchTimeout) clearTimeout(this.inventorySearchTimeout);
        this.inventorySearchTimeout = setTimeout(() => this.refreshInventory({ page: 1, search: inventorySearch }), 350);
    }

    handleInventoryStatus = (event) => {
        const inventoryStatus = event.target.value;
        this.setState({ inventoryStatus, inventoryPage: 1 }, () => this.refreshInventory({ page: 1, status: inventoryStatus }));
    }

    handleCatalogSearch = (event) => {
        const catalogSearch = event.target.value;
        this.setState({ catalogSearch, grantItemId: '' });
        if (this.catalogSearchTimeout) clearTimeout(this.catalogSearchTimeout);
        this.catalogSearchTimeout = setTimeout(() => this.props.getInventoryCatalog({ limit: 100, isActive: true, search: catalogSearch }), 300);
    }

    submitInventoryGrant = () => {
        const { inventoryUser, grantItemId, grantQuantity, grantReason, inventorySearch, inventoryStatus } = this.state;
        if (!inventoryUser || !grantItemId || !grantReason.trim()) return;
        this.props.grantInventoryItem({
            userId: inventoryUser._id,
            itemId: grantItemId,
            quantity: Number(grantQuantity),
            reason: grantReason.trim(),
            requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            search: inventorySearch,
            status: inventoryStatus
        });
        this.setState({ grantItemId: '', grantQuantity: 1, grantReason: '' });
    }

    submitInventoryRevoke = () => {
        const { inventoryUser, revokeEntry, revokeReason, inventoryPage, inventorySearch, inventoryStatus } = this.state;
        if (!inventoryUser || !revokeEntry || !revokeReason.trim()) return;
        this.props.revokeInventoryItem({
            userId: inventoryUser._id,
            inventoryId: revokeEntry.id,
            reason: revokeReason.trim(),
            page: inventoryPage,
            search: inventorySearch,
            status: inventoryStatus
        });
        this.setState({ revokeEntry: null, revokeReason: '' });
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
                user.isFrozen ? 'Banned' : 'Active',
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
        let { usersData, searchTerm, selectedUser, freezeAction, freezeReason, showHistoryModal, historyUser, historyTransactions, historyPagination, historyFilters, showProfileModal, profileUser, profileData, profileLoading, showAdjustModal, adjustUser, adjustAmount, adjustType, adjustAsset, adjustReason, showLogoutModal, logoutUser, logoutReason, showInventoryModal, inventoryUser, inventorySearch, inventoryStatus, inventoryPage, catalogSearch, grantItemId, grantQuantity, grantReason, revokeEntry, revokeReason, selectedUsers } = this.state;
        const { isModal, pagination, userInventory, inventoryPagination, inventoryCatalog } = this.props;

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
                width: 42,
                filterable: false,
                sortable: false
            },
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 44,
                filterable: false
            },
            {
                accessor: 'username',
                Header: 'Player',
                Cell: ({ original }) => <div className="user-identity-cell"><strong>{original.username || 'N/A'}</strong><span>{original.email || 'No email'}</span></div>,
                width: 170
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
                filterable: false,
                width: 115
            },
            {
                id: 'balances',
                Header: 'Balances',
                Cell: ({ original }) => <div className="user-balance-stack"><span>Cash <strong>${Number(original.cashBalance || 0).toLocaleString()}</strong></span><span>MPCE <strong>{Number(original.mpceCredit || 0).toLocaleString()}</strong></span><span>FP <strong>{Number(original.fpBalance || 0).toLocaleString()}</strong></span></div>,
                filterable: false,
                width: 145
            },
            {
                id: 'currentSession',
                Header: 'Seated / Session',
                Cell: ({ original }) => {
                    const session = original.currentSessions?.[0];
                    if (!original.isSeated || !session) return <span className="user-session-empty">Not seated</span>;
                    return (
                        <div className="user-session-cell" title={`${session.gameType} · ${session.gameId}`}>
                            <strong>{session.name || session.gameId}</strong>
                            <span>Seated · {session.gameType}</span>
                            <small className="user-session-table-status">{session.status || 'Active'}</small>
                            {session.connectionStatus && <small>{session.connectionStatus}</small>}
                        </div>
                    );
                },
                filterable: false,
                width: 155
            },
            {
                accessor: 'isFrozen',
                Header: 'Status',
                Cell: ({ value, original }) => (
                    <div className="user-status-stack">
                        <span className={`status-badge ${value ? 'frozen' : 'active'}`}>{value ? 'Banned' : 'Active'}</span>
                        <small className={`kyc-inline ${original.KYCStatus || 'unverified'}`}>{original.KYCStatus || 'Unverified'}</small>
                    </div>
                ),
                filterable: false,
                width: 110
            },
            {
                accessor: 'createdAt',
                Header: 'Joined',
                Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A',
                filterable: false,
                width: 88
            },
            {
                Cell: item => (
                    <div className="action-buttons">
                        <button onClick={() => this.openProfileModal(item.original)} className="profile-btn" title="Open complete player profile">Profile</button>
                        <button
                            onClick={() => this.openHistoryModal(item.original)}
                            className="history-btn"
                            title="View Transactions"
                        >
                            History
                        </button>
                        <button onClick={() => this.openInventoryModal(item.original)} className="inventory-btn" title="View and manage inventory">Inventory</button>
                        <button
                            onClick={() => this.openAdjustModal(item.original)}
                            className="adjust-btn"
                            title="Adjust Balance"
                        >
                            Adjust
                        </button>
                        <button onClick={() => this.openLogoutModal(item.original)} className="logout-btn" title="Revoke all active sessions">Logout</button>
                        {item.original.isFrozen ? (
                            <button
                                onClick={() => this.openFreezeModal(item.original, false)}
                                className="unfreeze-btn"
                            >
                                Unban
                            </button>
                        ) : (
                            <button
                                onClick={() => this.openFreezeModal(item.original, true)}
                                className="freeze-btn"
                            >
                                Ban
                            </button>
                        )}
                    </div>
                ),
                Header: 'Actions',
                filterable: false,
                width: 430
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
                                placeholder="Search username, email, user ID, or wallet..."
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

                {/* ---------------BAN/UNBAN MODAL--------------- */}
                <Modal isOpen={isModal} toggle={this.cancelModal} className="main-modal freeze-modal">
                    <ModalHeader toggle={this.cancelModal}>
                        <div className="modal-title">
                            <p>{freezeAction ? 'Ban User Account' : 'Unban User Account'}</p>
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
                                                {selectedUser.isFrozen ? 'Banned' : 'Active'}
                                            </span>
                                        </p>
                                    </div>

                                    <div className={`action-warning mt-3 ${freezeAction ? 'freeze-warning' : 'unfreeze-warning'}`}>
                                        <p>
                                            {freezeAction
                                                ? '⚠️ Warning: Banning this account will prevent the user from logging in and performing any transactions.'
                                                : '✓ Unbanning this account will restore the user\'s ability to log in and perform transactions.'
                                            }
                                        </p>
                                    </div>
                                    <div className="form-group mt-3">
                                        <label className="form-label">Required audit reason</label>
                                        <textarea className="form-textarea" rows="3" value={freezeReason} onChange={(e) => this.setState({ freezeReason: e.target.value })} placeholder="Why is this account status changing?" />
                                    </div>
                                </div>

                                <div className="col-12 mt-4 d-flex justify-content-around">
                                    <button className="delete-btn add-btn col-4" type='button' onClick={this.cancelModal}>Cancel</button>
                                    <button
                                        className="add-btn "
                                        type='button'
                                        onClick={this.submitFreezeAction}
                                        disabled={!freezeReason.trim()}
                                    >
                                        {freezeAction ? 'Ban Account' : 'Unban Account'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>

                <Modal isOpen={showProfileModal} toggle={this.closeProfileModal} className="main-modal player-profile-modal" size="xl">
                    <ModalHeader toggle={this.closeProfileModal}><div className="modal-title"><p>Player Profile</p></div></ModalHeader>
                    <ModalBody className="modal-body player-profile-body">
                        {profileLoading && <div className="profile-loading">Loading player operations…</div>}
                        {!profileLoading && profileData && (() => {
                            const player = profileData.user || profileUser || {};
                            const stats = profileData.handStats || [];
                            return <Fragment>
                                <section className="profile-hero">
                                    <div><small>Player</small><h4>{player.username || 'Unnamed player'}</h4><span>{player.email || 'No email'} · {player._id}</span></div>
                                    <div className="profile-state"><span className={`status-badge ${player.isFrozen ? 'frozen' : 'active'}`}>{player.isFrozen ? 'Banned' : 'Active'}</span><small>Last login {player.lastLoginAt ? new Date(player.lastLoginAt).toLocaleString() : 'Never recorded'}</small></div>
                                </section>
                                <section className="profile-balance-grid">
                                    <article><span>Cash liability</span><strong>${Number(player.cashBalance || 0).toLocaleString()}</strong></article>
                                    <article><span>MPCE / Time</span><strong>{Number(player.mpceCredit || 0).toLocaleString()}</strong><small>{Number(player.timeBalanceMinutes || 0).toLocaleString()} minutes</small></article>
                                    <article><span>Free Play</span><strong>{Number(player.fpBalance || 0).toLocaleString()} FP</strong><small>Non-withdrawable</small></article>
                                    <article><span>Account</span><strong>{player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '—'}</strong><small>Created · {player.authProvider || 'wallet'} auth</small></article>
                                </section>
                                <div className="profile-columns">
                                    <section className="profile-panel"><h5>Connected wallets & payout methods</h5>{(profileData.connectedWallets || []).map((wallet, index) => <div className="profile-record" key={`${wallet.address}-${index}`}><strong>{wallet.source === 'primary' ? 'Primary wallet' : 'Saved payout wallet'}</strong><span title={wallet.address}>{wallet.address}</span><small>{wallet.status || 'saved'}{wallet.linkedAt || wallet.addedAt ? ` · ${new Date(wallet.linkedAt || wallet.addedAt).toLocaleDateString()}` : ''}</small></div>)}{!(profileData.connectedWallets || []).length && <p className="profile-empty">No wallet connected.</p>}</section>
                                    <section className="profile-panel"><h5>Current table / session</h5>{(profileData.currentSessions || []).map(session => <div className="profile-record" key={session.gameId}><strong>{session.name || session.gameId}</strong><span>{session.gameType} · {session.economy}</span><small>{session.status || 'Active'}{session.connectionStatus ? ` · ${session.connectionStatus}` : ''}</small></div>)}{!(profileData.currentSessions || []).length && <p className="profile-empty">Not currently seated.</p>}</section>
                                    <section className="profile-panel"><h5>Hand performance</h5>{stats.map(row => <div className="profile-stat-row" key={row.economy}><strong>{row.economy}</strong><span>{row.handsWon}/{row.handsPlayed} wins</span><span>{Number(row.netWon || 0).toLocaleString()} net</span></div>)}{!stats.length && <p className="profile-empty">No completed authoritative hands.</p>}</section>
                                    <section className="profile-panel"><h5>Inventory lifecycle</h5>{(profileData.inventorySummary || []).map(row => <div className="profile-stat-row" key={row._id}><strong>{row._id || 'unknown'}</strong><span>{row.count} records</span><span>{row.quantity} items</span></div>)}{!(profileData.inventorySummary || []).length && <p className="profile-empty">No inventory records.</p>}</section>
                                </div>
                                <section className="profile-panel profile-transactions"><h5>Recent transactions</h5><div className="profile-transaction-list">{(profileData.recentTransactions || []).map(tx => <div className="profile-transaction" key={tx._id}><div><strong>{String(tx.type || 'transaction').replaceAll('_', ' ')}</strong><small>{new Date(tx.createdAt).toLocaleString()}</small></div><span>{Number(tx.paidAmount || tx.cashAmountUsd || 0).toLocaleString()} {tx.paidCoinType || tx.asset || ''}</span><span className={`tx-status ${String(tx.status || '').toLowerCase()}`}>{tx.status || '—'}</span><code title={tx.solanaDepositHash || tx.cryptoWithdrawalHash || tx.hotWalletPayoutHash || ''}>{tx.solanaDepositHash || tx.cryptoWithdrawalHash || tx.hotWalletPayoutHash || tx.reasonCode || '—'}</code></div>)}</div>{!(profileData.recentTransactions || []).length && <p className="profile-empty">No transactions recorded.</p>}</section>
                            </Fragment>;
                        })()}
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
                                    <div className="history-filter-row">
                                        <label>Type<select value={historyFilters.type} onChange={event => this.updateHistoryFilter('type', event.target.value)}><option value="">All</option><option value="deposit">Deposits</option><option value="withdraw">Withdrawals</option><option value="timePurchase">Time purchases</option><option value="freePlayPurchase">Free Play purchases</option><option value="cashIn">Table buy-ins</option><option value="cashOut">Table cash-outs</option></select></label>
                                        <label>Status<select value={historyFilters.status} onChange={event => this.updateHistoryFilter('status', event.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></label>
                                        <label>Asset<select value={historyFilters.asset} onChange={event => this.updateHistoryFilter('asset', event.target.value)}><option value="">All</option><option value="USD">Cash / USD</option><option value="MPCE">MPCE / Time</option><option value="FP">Free Play</option><option value="SOL">SOL</option><option value="USDC">USDC</option></select></label>
                                    </div>
                                    <div className="transactions-table-wrapper">
                                        {historyTransactions.length > 0 ? (
                                            <table className="transactions-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Type</th>
                                                        <th>Paid</th>
                                                        <th>Received</th>
                                                        <th>Status</th>
                                                        <th>Reference</th>
                                                        <th>Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyTransactions.map((tx, index) => (
                                                        <tr key={tx._id || index}>
                                                            <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
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
                                                            <td><code className="history-reference" title={tx.solanaDepositHash || tx.cryptoWithdrawalHash || tx.hotWalletPayoutHash || tx.payoutReferenceId || ''}>{tx.solanaDepositHash || tx.cryptoWithdrawalHash || tx.hotWalletPayoutHash || tx.payoutReferenceId || '-'}</code></td>
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
                                    <div className="history-pagination"><button type="button" disabled={Number(historyPagination.currentPage || 1) <= 1} onClick={() => this.loadTransactionHistory(Number(historyPagination.currentPage || 1) - 1)}>Previous</button><span>Page {historyPagination.currentPage || 1} of {historyPagination.totalPages || 1} · {historyPagination.totalTransactions || 0} records</span><button type="button" disabled={Number(historyPagination.currentPage || 1) >= Number(historyPagination.totalPages || 1)} onClick={() => this.loadTransactionHistory(Number(historyPagination.currentPage || 1) + 1)}>Next</button></div>
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
                            <p>Adjust Player Balance</p>
                        </div>
                        <div className="modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body adjust-modal-body">
                        {adjustUser && (
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="user-details">
                                        <p><span className="detail-label">Username:</span> {adjustUser.username || 'N/A'}</p>
                                        <p><span className="detail-label">Cash:</span> ${Number(adjustUser.cashBalance || 0).toLocaleString()}</p>
                                        <p><span className="detail-label">MPCE:</span> {Number(adjustUser.mpceCredit || 0).toLocaleString()} <small>({Number(adjustUser.timeBalanceMinutes || 0).toLocaleString()} minutes)</small></p>
                                        <p><span className="detail-label">FP:</span> {Number(adjustUser.fpBalance || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="col-12 mb-3">
                                    <div className="form-group">
                                        <label className="form-label">Balance</label>
                                        <select className="form-select" value={adjustAsset} onChange={(e) => this.setState({ adjustAsset: e.target.value })}>
                                            <option value="CASH">Cash / USD</option>
                                            <option value="MPCE">Time / MPCE</option>
                                            <option value="FP">FP</option>
                                        </select>
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
                                        disabled={!adjustAmount || parseFloat(adjustAmount) <= 0 || !adjustReason.trim()}
                                    >
                                        {adjustType === 'credit' ? `Credit ${adjustAsset}` : `Debit ${adjustAsset}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>

                <Modal isOpen={showInventoryModal} toggle={this.closeInventoryModal} className="main-modal inventory-modal" size="xl">
                    <ModalHeader toggle={this.closeInventoryModal}>
                        <div className="modal-title"><p>Player Inventory</p></div>
                    </ModalHeader>
                    <ModalBody className="modal-body inventory-modal-body">
                        {inventoryUser && <div className="inventory-admin-layout">
                            <div className="inventory-player-strip">
                                <div><small>Player</small><strong>{inventoryUser.username || 'N/A'}</strong></div>
                                <div><small>Email</small><strong>{inventoryUser.email || 'N/A'}</strong></div>
                                <div><small>Owned records</small><strong>{inventoryPagination?.totalItems || 0}</strong></div>
                            </div>

                            <section className="inventory-grant-panel">
                                <div className="inventory-section-heading">
                                    <div><h5>Grant catalog item</h5><p>Creates a zero-cost entitlement and records the administrator and reason.</p></div>
                                </div>
                                <div className="inventory-grant-grid">
                                    <label><span>Find item or SKU</span><input className="form-input" value={catalogSearch} onChange={this.handleCatalogSearch} placeholder="Name, SKU, or item ID" /></label>
                                    <label><span>Catalog item</span><select className="form-select" value={grantItemId} onChange={(e) => this.setState({ grantItemId: e.target.value })}>
                                        <option value="">Select an active item</option>
                                        {(inventoryCatalog || []).filter(item => item.itemType !== 'currency_bundle').map(item => <option key={item._id} value={item._id}>{item.sku || item._id} · {item.name}</option>)}
                                    </select></label>
                                    <label className="inventory-quantity"><span>Quantity</span><input className="form-input" type="number" min="1" max="100" step="1" value={grantQuantity} onChange={(e) => this.setState({ grantQuantity: e.target.value })} /></label>
                                    <label className="inventory-reason"><span>Required audit reason</span><input className="form-input" value={grantReason} onChange={(e) => this.setState({ grantReason: e.target.value })} placeholder="Why is this entitlement being granted?" /></label>
                                    <button type="button" className="inventory-grant-btn" disabled={!grantItemId || !grantReason.trim() || Number(grantQuantity) < 1} onClick={this.submitInventoryGrant}>Grant item</button>
                                </div>
                            </section>

                            <section className="inventory-owned-panel">
                                <div className="inventory-toolbar">
                                    <div><h5>Owned inventory</h5><p>Includes active, expired, consumed, and revoked records.</p></div>
                                    <div className="inventory-filter-controls">
                                        <input className="form-input" value={inventorySearch} onChange={this.handleInventorySearch} placeholder="Search name, SKU, type, or transaction" />
                                        <select className="form-select" value={inventoryStatus} onChange={this.handleInventoryStatus}>
                                            <option value="all">All statuses</option>
                                            <option value="active">Active</option>
                                            <option value="expired">Expired</option>
                                            <option value="consumed">Consumed</option>
                                            <option value="revoked">Revoked</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="inventory-table-wrap">
                                    <table className="inventory-table">
                                        <thead><tr><th>Item / SKU</th><th>Type</th><th>Qty</th><th>Status</th><th>Equipment</th><th>Acquired</th><th>Source</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {(userInventory || []).map(entry => <tr key={entry.id}>
                                                <td><strong>{entry.name}</strong><small>{entry.sku || entry.itemId || 'Catalog item removed'}</small></td>
                                                <td>{entry.itemType || '—'}{entry.itemSubType ? <small>{entry.itemSubType}</small> : null}</td>
                                                <td>{entry.quantity}</td>
                                                <td><span className={`inventory-status ${entry.status}`}>{entry.status}</span></td>
                                                <td>{entry.isEquipped ? <span className="inventory-equipped">Equipped{entry.equipSlot !== null ? ` · slot ${entry.equipSlot}` : ''}</span> : <span className="inventory-muted">Unequipped</span>}</td>
                                                <td>{entry.acquiredAt ? new Date(entry.acquiredAt).toLocaleString() : '—'}</td>
                                                <td>{String(entry.acquisitionSource || 'legacy').replace(/_/g, ' ')}</td>
                                                <td>{entry.status === 'active' && !entry.unlockedByDefault ? <button type="button" className="inventory-revoke-btn" onClick={() => this.setState({ revokeEntry: entry, revokeReason: '' })}>Revoke</button> : entry.unlockedByDefault ? <span className="inventory-muted" title="Disable default unlock in the catalog before individual revocation">Default access</span> : <span className="inventory-muted">—</span>}</td>
                                            </tr>)}
                                            {(!userInventory || userInventory.length === 0) && <tr><td colSpan="8" className="inventory-empty">No inventory records match this view.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                {inventoryPagination?.totalPages > 1 && <div className="inventory-pagination">
                                    <button type="button" disabled={inventoryPage <= 1} onClick={() => { const page = inventoryPage - 1; this.setState({ inventoryPage: page }, () => this.refreshInventory()); }}>Previous</button>
                                    <span>Page {inventoryPagination.currentPage} of {inventoryPagination.totalPages}</span>
                                    <button type="button" disabled={inventoryPage >= inventoryPagination.totalPages} onClick={() => { const page = inventoryPage + 1; this.setState({ inventoryPage: page }, () => this.refreshInventory()); }}>Next</button>
                                </div>}
                            </section>

                            {revokeEntry && <section className="inventory-revoke-confirm">
                                <div><strong>Revoke {revokeEntry.name}?</strong><p>This removes access without deleting the ownership history. Equipped items are unequipped immediately.</p></div>
                                <input className="form-input" value={revokeReason} onChange={(e) => this.setState({ revokeReason: e.target.value })} placeholder="Required audit reason" />
                                <button type="button" className="inventory-cancel-revoke" onClick={() => this.setState({ revokeEntry: null, revokeReason: '' })}>Cancel</button>
                                <button type="button" className="inventory-confirm-revoke" disabled={!revokeReason.trim()} onClick={this.submitInventoryRevoke}>Confirm revoke</button>
                            </section>}
                        </div>}
                    </ModalBody>
                </Modal>

                <Modal isOpen={showLogoutModal} toggle={this.closeLogoutModal} className="main-modal freeze-modal">
                    <ModalHeader toggle={this.closeLogoutModal}><div className="modal-title"><p>Force Logout</p></div></ModalHeader>
                    <ModalBody className="modal-body freeze-modal-body">
                        {logoutUser && <div>
                            <div className="user-details"><p><span className="detail-label">User:</span>{logoutUser.username || logoutUser.email || logoutUser._id}</p></div>
                            <div className="action-warning freeze-warning mt-3"><p>Every currently issued session will be rejected immediately. The account remains active and can sign in again.</p></div>
                            <div className="form-group mt-3"><label className="form-label">Required audit reason</label><textarea className="form-textarea" rows="3" value={logoutReason} onChange={(e) => this.setState({ logoutReason: e.target.value })} placeholder="Why are all sessions being revoked?" /></div>
                            <div className="col-12 mt-4 d-flex justify-content-around"><button className="delete-btn add-btn col-4" type="button" onClick={this.closeLogoutModal}>Cancel</button><button className="add-btn" type="button" disabled={!logoutReason.trim()} onClick={this.submitForceLogout}>Revoke sessions</button></div>
                        </div>}
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}

const mapDispatchToProps = {
    getUsers, toggleFreezeUser, getUserTransactions, adjustUserBalance, forceLogoutUser,
    getUserInventory, getInventoryCatalog, grantInventoryItem, revokeInventoryItem,
    setLoader, toggleModal
};

const mapStateToProps = ({ Users, Auth }) => {
    let { users, pagination, userTransactions, userInventory, inventoryPagination, inventoryCatalog } = Users;
    let { isModal } = Auth;
    return { users, pagination, userTransactions, userInventory, inventoryPagination, inventoryCatalog, isModal };
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);
