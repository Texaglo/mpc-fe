import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { setLoader } from '../../store/actions/Auth';
import { canAccess } from '../../utils/adminAccess';
import './index.css';

const SETTING_META = {
    timePriceUsdPerHour: { label: 'Time price', hint: 'USD charged for one hour of standard time', unit: '$ / hour', min: 0.01 },
    minDepositUsd: { label: 'Minimum deposit', hint: 'Lowest accepted cash value across deposit methods', unit: 'USD', min: 0 },
    maxDepositUsd: { label: 'Maximum deposit', hint: 'Highest accepted cash value across deposit methods', unit: 'USD', min: 0.01 },
    minWithdrawalUsd: { label: 'Minimum withdrawal', hint: 'Lowest request the cashier accepts', unit: 'USD', min: 0 },
    maxWithdrawalUsd: { label: 'Maximum withdrawal', hint: 'Highest request the cashier accepts', unit: 'USD', min: 0.01 },
};

const SWITCH_META = {
    cashierPaused: { label: 'Cashier kill switch', hint: 'Stops new deposits, withdrawals and time purchases', danger: true },
    depositsPaused: { label: 'Pause deposits', hint: 'Stops new card, crypto and MoonPay deposit intents' },
    withdrawalsPaused: { label: 'Pause withdrawals', hint: 'Stops new withdrawal requests' },
};

const formatNumber = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
const unwrapError = error => error?.response?.data?.message || error?.message || 'Request failed';

const Cashier = () => {
    const dispatch = useDispatch();
    const access = useSelector(({ Auth }) => ({ role: Auth.role, permissions: Auth.permissions }));
    const canManage = canAccess(access, 'cashier.manage');
    const [settings, setSettings] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTransactions: 0 });
    const [filters, setFilters] = useState({ category: 'all', status: 'all', search: '' });
    const [appliedSearch, setAppliedSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [reason, setReason] = useState('');

    const loadSettings = useCallback(async () => {
        const response = await axios.get('/admin/settings');
        const map = {};
        (response.data?.body?.settings || []).forEach(setting => { map[setting.key] = setting; });
        setSettings(map);
    }, []);

    const loadTransactions = useCallback(async (page = 1) => {
        const params = new URLSearchParams({
            category: filters.category,
            status: filters.status,
            search: appliedSearch,
            page: String(page),
            limit: '25',
        });
        const response = await axios.get(`/admin/cashier/transactions?${params.toString()}`);
        setTransactions(response.data?.body?.transactions || []);
        setPagination(response.data?.body?.pagination || { currentPage: 1, totalPages: 1, totalTransactions: 0 });
    }, [filters.category, filters.status, appliedSearch]);

    useEffect(() => {
        let mounted = true;
        dispatch(setLoader(true));
        Promise.all([loadSettings(), loadTransactions(1)])
            .catch(error => mounted && EventBus.publish('error', unwrapError(error)))
            .finally(() => mounted && dispatch(setLoader(false)));
        return () => { mounted = false; };
    }, [dispatch, loadSettings, loadTransactions]);

    const openEditor = (key, nextValue) => {
        setEditing(key);
        setEditValue(String(nextValue ?? settings[key]?.value ?? ''));
        setReason('');
    };

    const closeEditor = () => {
        setEditing(null);
        setEditValue('');
        setReason('');
    };

    const submitSetting = async () => {
        const numericValue = Number(editValue);
        if (!editing || !Number.isFinite(numericValue) || !reason.trim()) return;
        dispatch(setLoader(true));
        try {
            await axios.put('/admin/settings', { key: editing, value: numericValue, reason: reason.trim() });
            await loadSettings();
            EventBus.publish('success', `${SWITCH_META[editing]?.label || SETTING_META[editing]?.label} updated`);
            closeEditor();
        } catch (error) {
            EventBus.publish('error', unwrapError(error));
        } finally {
            dispatch(setLoader(false));
        }
    };

    const editingMeta = SWITCH_META[editing] || SETTING_META[editing];
    const isSwitchEdit = Boolean(SWITCH_META[editing]);
    const editIsValid = Boolean(reason.trim()) && Number.isFinite(Number(editValue)) && (
        isSwitchEdit ? ['0', '1'].includes(String(editValue)) : Number(editValue) >= Number(editingMeta?.min || 0)
    );

    const categoryLabel = useMemo(() => ({
        cryptoDeposit: 'Crypto deposit',
        bankDeposit: 'Card deposit',
        deposit: 'Deposit',
        withdraw: 'Withdrawal',
        timePurchase: 'Time purchase',
    }), []);

    return (
        <div className="content cashier-content">
            <div className="cashier-page">
                <header className="cashier-heading">
                    <div>
                        <span className="cashier-eyebrow">Economy operations</span>
                        <h2>Cashier Control Center</h2>
                        <p>Audited limits, emergency controls and the complete player cash-flow ledger.</p>
                    </div>
                    <div className={`cashier-state ${Number(settings.cashierPaused?.value) === 1 ? 'paused' : 'live'}`}>
                        <span />{Number(settings.cashierPaused?.value) === 1 ? 'Cashier paused' : 'Cashier live'}
                    </div>
                </header>

                <section className="cashier-switch-grid" aria-label="Cashier availability controls">
                    {Object.entries(SWITCH_META).map(([key, meta]) => {
                        const enabled = Number(settings[key]?.value) === 1;
                        return (
                            <article className={`cashier-switch-card ${enabled ? 'enabled' : ''} ${meta.danger ? 'danger' : ''}`} key={key}>
                                <div><h4>{meta.label}</h4><p>{meta.hint}</p></div>
                                {canManage ? <button
                                    type="button"
                                    className={`cashier-toggle ${enabled ? 'on' : 'off'}`}
                                    aria-label={`${meta.label}: ${enabled ? 'paused' : 'running'}`}
                                    onClick={() => openEditor(key, enabled ? 0 : 1)}
                                ><span />{enabled ? 'Paused' : 'Running'}</button> : <span className={`cashier-toggle ${enabled ? 'on' : 'off'}`}><span />{enabled ? 'Paused' : 'Running'}</span>}
                            </article>
                        );
                    })}
                </section>

                <section className="cashier-limit-section">
                    <div className="cashier-section-title"><div><span>Pricing & limits</span><h3>Cashier rules</h3></div><p>All values are enforced by the backend on existing player routes.</p></div>
                    <div className="cashier-limit-grid">
                        {Object.entries(SETTING_META).map(([key, meta]) => (
                            <article className="cashier-limit-card" key={key}>
                                <div><span>{meta.label}</span><strong>{formatNumber(settings[key]?.value)} <small>{meta.unit}</small></strong><p>{meta.hint}</p></div>
                                {canManage && <button type="button" onClick={() => openEditor(key)}>Edit</button>}
                            </article>
                        ))}
                    </div>
                </section>

                <section className="cashier-ledger-section">
                    <div className="cashier-section-title"><div><span>Audit trail</span><h3>Cashier ledger</h3></div><strong>{pagination.totalTransactions || 0} records</strong></div>
                    <div className="cashier-filters">
                        <select value={filters.category} onChange={event => setFilters(current => ({ ...current, category: event.target.value }))} aria-label="Transaction category">
                            <option value="all">All transactions</option><option value="deposits">Deposits</option><option value="withdrawals">Withdrawals</option><option value="time">Time purchases</option>
                        </select>
                        <select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))} aria-label="Transaction status">
                            <option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
                        </select>
                        <div className="cashier-search"><input value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} placeholder="Player, wallet, transaction or hash" aria-label="Search cashier ledger" /><button type="button" onClick={() => setAppliedSearch(filters.search.trim())}>Search</button></div>
                    </div>
                    <div className="cashier-table-wrap">
                        <table className="cashier-table">
                            <thead><tr><th>When</th><th>Player</th><th>Type</th><th>Cash value</th><th>Movement</th><th>Status</th><th>Reference</th></tr></thead>
                            <tbody>
                                {transactions.map(tx => {
                                    const reference = tx.solanaDepositHash || tx.hotWalletPayoutHash || tx.cryptoWithdrawalHash || tx.payoutReferenceId || tx._id;
                                    return <tr key={tx._id}>
                                        <td>{new Date(tx.createdAt).toLocaleString()}</td>
                                        <td><strong>{tx.userId?.username || 'Unknown player'}</strong><small>{tx.userId?.email || tx.userId?._id || '—'}</small></td>
                                        <td>{categoryLabel[tx.type] || tx.type}</td>
                                        <td>${formatNumber(tx.cashAmountUsd ?? (tx.type === 'timePurchase' || tx.type === 'withdraw' ? tx.paidAmount : tx.receivedAmount))}</td>
                                        <td>{formatNumber(tx.paidAmount)} {String(tx.paidCoinType || '').toUpperCase()} → {formatNumber(tx.receivedAmount)} {String(tx.receivedCoinType || '').toUpperCase()}</td>
                                        <td><span className={`cashier-status ${tx.status}`}>{tx.status}</span></td>
                                        <td title={reference}>{reference ? `${String(reference).slice(0, 8)}…${String(reference).slice(-6)}` : '—'}</td>
                                    </tr>;
                                })}
                                {!transactions.length && <tr><td colSpan="7" className="cashier-empty">No transactions match these filters.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="cashier-pagination">
                        <button type="button" disabled={pagination.currentPage <= 1} onClick={() => loadTransactions(pagination.currentPage - 1)}>Previous</button>
                        <span>Page {pagination.currentPage || 1} of {pagination.totalPages || 1}</span>
                        <button type="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => loadTransactions(pagination.currentPage + 1)}>Next</button>
                    </div>
                </section>
            </div>

            <Modal isOpen={Boolean(editing)} toggle={closeEditor} className="main-modal cashier-edit-modal">
                <ModalHeader toggle={closeEditor}><div className="modal-title"><p>{editingMeta?.label || 'Edit cashier setting'}</p></div></ModalHeader>
                <ModalBody>
                    <p className="cashier-edit-hint">{editingMeta?.hint}</p>
                    {isSwitchEdit ? (
                        <div className={`cashier-change-preview ${editValue === '1' ? 'pause' : 'resume'}`}>{editValue === '1' ? 'Pause this operation' : 'Resume this operation'}</div>
                    ) : (
                        <label className="cashier-edit-field">New value<input type="number" min={editingMeta?.min || 0} step="any" value={editValue} onChange={event => setEditValue(event.target.value)} /></label>
                    )}
                    <label className="cashier-edit-field">Required audit reason<textarea rows="3" value={reason} onChange={event => setReason(event.target.value)} placeholder="Why is this operational change required?" /></label>
                    <div className="cashier-modal-actions"><button type="button" className="cancel" onClick={closeEditor}>Cancel</button><button type="button" className="save" disabled={!editIsValid} onClick={submitSetting}>Apply change</button></div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default Cashier;
