import ConsoleIcon from '../../components/ConsoleIcon';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAuditLogs } from '../../store/actions/Dashboard';
import './index.css';

const actionLabels = {
    FREEZE_USER: 'Suspend player',
    UNFREEZE_USER: 'Unsuspend player',
    FORCE_LOGOUT: 'Force logout',
    APPROVE_WITHDRAWAL: 'Approve withdrawal',
    REJECT_WITHDRAWAL: 'Reject withdrawal',
    REQUEST_HOT_WALLET_REFILL: 'Request wallet refill',
    APPROVE_HOT_WALLET_REFILL: 'Approve wallet refill',
    REJECT_HOT_WALLET_REFILL: 'Reject wallet refill',
    ADJUST_BALANCE: 'Adjust balance',
    UPDATE_SETTINGS: 'Update economy setting',
    UPDATE_CASHIER_SETTINGS: 'Update cashier setting',
    PAUSE_NEW_GAMES: 'Pause new games',
    RESUME_NEW_GAMES: 'Resume new games',
    GRANT_INVENTORY_ITEM: 'Grant inventory item',
    REVOKE_INVENTORY_ITEM: 'Revoke inventory item',
    UPDATE_FREE_PLAY_SETTINGS: 'Update Free Play settings',
};

const readableAction = (action) => actionLabels[action] || String(action || 'Unknown action')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (character) => character.toUpperCase());

const displayValue = (value) => {
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const getChange = (details = {}) => {
    const previous = details.previousValue ?? details.previousBalance ?? details.previousVersion;
    const next = details.newValue ?? details.newBalance ?? details.sessionVersion;
    if (previous === undefined && next === undefined) return '—';
    return `${displayValue(previous)} → ${displayValue(next)}`;
};

const getModule = (log) => {
    const action = String(log.action || '').toUpperCase();
    if (/RING|TABLE|TOURNAMENT|SNG|GAME/.test(action)) return 'Games';
    if (/WITHDRAWAL|WALLET|CASHIER|DEPOSIT|REFILL/.test(action)) return 'Operations';
    if (/INVENTORY|PRODUCT|STORE|PURCHASE/.test(action)) return 'Commerce';
    if (/USER|PLAYER|BALANCE|LOGOUT|KYC/.test(action)) return 'Players';
    return 'System';
};

const AuditLog = () => {
    const dispatch = useDispatch();
    const {
        auditLogs = [],
        auditLogsPagination = {},
        auditLogActionTypes = [],
        auditLogsLoading,
    } = useSelector((state) => state.Dashboard);

    const [currentPage, setCurrentPage] = useState(1);
    const [period, setPeriod] = useState('all');
    const [action, setAction] = useState('');
    const [module, setModule] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const request = useMemo(() => ({
        page: currentPage,
        limit: 25,
        period,
        action: action || undefined,
        search: search || undefined,
        ...(period === 'custom' && startDate && endDate ? { startDate, endDate } : {}),
    }), [action, currentPage, endDate, period, search, startDate]);

    useEffect(() => {
        if (period === 'custom' && (!startDate || !endDate)) return;
        dispatch(getAuditLogs(request));
    }, [dispatch, endDate, period, request, startDate]);

    const submitSearch = (event) => {
        event.preventDefault();
        setCurrentPage(1);
        setSearch(searchInput.trim());
    };

    const resetFilters = () => {
        setCurrentPage(1);
        setPeriod('all');
        setAction('');
        setModule('');
        setSearchInput('');
        setSearch('');
        setStartDate('');
        setEndDate('');
    };

    const totalPages = Number(auditLogsPagination.totalPages || 1);
    const visibleAuditLogs = module ? auditLogs.filter((log) => getModule(log) === module) : auditLogs;

    return (
        <div className="content">
            <div className="main-container audit-page">
                <div className="audit-page-header">
                    <div>
                        <h2>Audit Log</h2>
                        <p>Permanent operational history showing who changed what, who was affected, and why.</p>
                    </div>
                    <div className="audit-total"><ConsoleIcon name="clock" />
                        <span>Newest activity</span>
                        <strong>{auditLogs[0]?.createdAt ? new Date(auditLogs[0].createdAt).toLocaleString() : '—'}</strong>
                    </div>
                </div>

                <div className="console-metric-grid audit-metric-grid" aria-label="Audit record summary">
                    <div className="console-metric"><span className="console-metric-icon blue"><ConsoleIcon name="clipboard" /></span><div><small>Total Records</small><strong>{Number(auditLogsPagination.totalLogs || 0).toLocaleString()}</strong></div></div>
                    <div className="console-metric"><span className="console-metric-icon red"><ConsoleIcon name="shield-alert" /></span><div><small>Critical · This Page</small><strong>{auditLogs.filter(log => ['FREEZE_USER', 'REJECT_WITHDRAWAL', 'FORCE_LOGOUT'].includes(log.action)).length}</strong></div></div>
                    <div className="console-metric"><span className="console-metric-icon blue"><ConsoleIcon name="users" /></span><div><small>Player Changes · This Page</small><strong>{auditLogs.filter(log => Boolean(log.targetUserId)).length}</strong></div></div>
                    <div className="console-metric"><span className="console-metric-icon blue"><ConsoleIcon name="database" /></span><div><small>Table Changes · This Page</small><strong>{auditLogs.filter(log => /RING|TABLE|TOURNAMENT|SNG/i.test(String(log.action || ''))).length}</strong></div></div>
                </div>

                <form className="audit-filters" onSubmit={submitSearch}>
                    <label className="audit-search-field">
                        Search
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Admin, player, ID, reason or IP"
                        />
                    </label>
                    <label>
                        Action
                        <select value={action} onChange={(event) => { setAction(event.target.value); setCurrentPage(1); }}>
                            <option value="">All actions</option>
                            {auditLogActionTypes.map((type) => (
                                <option value={type} key={type}>{readableAction(type)}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Module
                        <select value={module} onChange={(event) => setModule(event.target.value)}>
                            <option value="">All modules</option>
                            {['Games', 'Commerce', 'Operations', 'Players', 'System'].map((name) => <option value={name} key={name}>{name}</option>)}
                        </select>
                    </label>
                    <label>
                        Period
                        <select value={period} onChange={(event) => { setPeriod(event.target.value); setCurrentPage(1); }}>
                            <option value="all">All time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 days</option>
                            <option value="month">Last 30 days</option>
                            <option value="custom">Custom</option>
                        </select>
                    </label>
                    {period === 'custom' && (
                        <>
                            <label>From<input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setCurrentPage(1); }} /></label>
                            <label>To<input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setCurrentPage(1); }} /></label>
                        </>
                    )}
                    <button type="submit" className="audit-primary-button">Search</button>
                    <button type="button" className="audit-reset-button" onClick={resetFilters}>Reset</button>
                </form>

                <div className="audit-table-card">
                    <div className="audit-table-heading">
                        <div>
                            <h3>Recorded activity</h3>
                            <span>Newest activity appears first</span>
                        </div>
                        {auditLogsLoading && <span className="audit-loading">Refreshing…</span>}
                    </div>

                    {visibleAuditLogs.length > 0 ? (
                        <div className="audit-table-scroll">
                            <table className="audit-table">
                                <thead>
                                    <tr>
                                        <th>Date and time</th>
                                        <th>Administrator</th>
                                        <th>Module</th>
                                        <th>Action</th>
                                        <th>Affected player / scope</th>
                                        <th>Old value → new value</th>
                                        <th>Reason</th>
                                        <th>IP</th>
                                        <th>Record</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleAuditLogs.map((log) => {
                                        const details = log.details || {};
                                        return (
                                            <tr key={log._id}>
                                                <td className="audit-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                                                <td>
                                                    <strong>{log.adminId?.username || 'Admin'}</strong>
                                                    <small>{log.adminId?.email || log.adminId?._id || ''}</small>
                                                </td>
                                                <td className="audit-module"><span><ConsoleIcon name={({ Games: "controller", Operations: "settings", Commerce: "wallet", Players: "user", System: "settings" })[getModule(log)]} />{getModule(log)}</span></td>
                                                <td><span className={`audit-action audit-${String(log.action || '').toLowerCase()}`}>{readableAction(log.action)}</span></td>
                                                <td>
                                                    <strong>{log.targetUserId?.username || details.username || 'System / global'}</strong>
                                                    <small>{log.targetUserId?.email || log.targetUserId?._id || ''}</small>
                                                </td>
                                                <td className="audit-change">{getChange(details)}</td>
                                                <td>{details.reason || details.adminNotes || '—'}</td>
                                                <td className="audit-nowrap">{log.ipAddress || '—'}</td>
                                                <td>
                                                    <details className="audit-details">
                                                        <summary>View</summary>
                                                        <pre>{JSON.stringify(details, null, 2)}</pre>
                                                    </details>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="audit-empty">{auditLogsLoading ? 'Loading audit records…' : 'No audit records match these filters.'}</div>
                    )}

                    <div className="audit-pagination">
                        <button type="button" disabled={currentPage <= 1 || auditLogsLoading} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
                        <span>Page {auditLogsPagination.currentPage || currentPage} of {totalPages}</span>
                        <button type="button" disabled={currentPage >= totalPages || auditLogsLoading} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
