import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getHouseMpceLedger } from '../../store/actions/Dashboard';
import './index.css';

const formatNumber = (value, maximumFractionDigits = 6) => Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
});

const reasonLabels = {
    BURN_RATE: 'Scheduled table charge',
    BURN_RATE_PRORATED: 'Pro-rated table charge',
    TIME_BURN: 'Table-time burn',
};

const MpceLedger = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const { houseMpceLedger, houseMpceLedgerLoading } = useSelector(state => state.Dashboard);
    const { summary = {}, entries = [], pagination = {} } = houseMpceLedger || {};

    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState({ period: 'all' });

    useEffect(() => {
        dispatch(getHouseMpceLedger({
            ...appliedFilters,
            page: currentPage,
            limit: 25,
        }));
    }, [dispatch, appliedFilters, currentPage]);

    const handlePeriodChange = (event) => {
        const period = event.target.value;
        setSelectedPeriod(period);
        setCurrentPage(1);

        if (period !== 'custom') {
            setStartDate('');
            setEndDate('');
            setAppliedFilters({ period });
        }
    };

    const applyCustomDates = () => {
        if (!startDate || !endDate) return;
        setCurrentPage(1);
        setAppliedFilters({ period: 'custom', startDate, endDate });
    };

    const goToPage = (page) => {
        const totalPages = Number(pagination.totalPages || 1);
        if (page < 1 || page > totalPages || page === currentPage) return;
        setCurrentPage(page);
    };

    return (
        <div className="content">
            <div className="main-container mpce-ledger-page">
                <div className="mpce-ledger-page-header">
                    <div>
                        <button
                            type="button"
                            className="mpce-ledger-back"
                            onClick={() => history.push('/home/dashboard')}
                        >
                            ← Dashboard
                        </button>
                        <h2>House MPCE Ledger</h2>
                        <p>User-to-house table-time revenue and future treasury settlement history.</p>
                    </div>

                    <div className="mpce-ledger-filters">
                        <label>
                            Period
                            <select value={selectedPeriod} onChange={handlePeriodChange}>
                                <option value="all">All Time</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom</option>
                            </select>
                        </label>
                        {selectedPeriod === 'custom' && (
                            <div className="mpce-custom-dates">
                                <label>
                                    From
                                    <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                                </label>
                                <label>
                                    To
                                    <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                                </label>
                                <button type="button" onClick={applyCustomDates} disabled={!startDate || !endDate}>
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mpce-ledger-summary-grid">
                    <div className="mpce-ledger-summary-card primary">
                        <span>House earned</span>
                        <strong>{formatNumber(summary.totalEarned)} MPCE</strong>
                        <small>Completed transfers in this view</small>
                    </div>
                    <div className="mpce-ledger-summary-card">
                        <span>Accrued balance</span>
                        <strong>{formatNumber(summary.availableBalance)} MPCE</strong>
                        <small>Awaiting future on-chain settlement</small>
                    </div>
                    <div className="mpce-ledger-summary-card">
                        <span>Settled</span>
                        <strong>{formatNumber(summary.settled)} MPCE</strong>
                        <small>Recorded treasury settlements</small>
                    </div>
                    <div className="mpce-ledger-summary-card">
                        <span>Transfers</span>
                        <strong>{formatNumber(summary.burnCount, 0)}</strong>
                        <small>
                            {summary.timeTrackedCount > 0
                                ? `${formatNumber(summary.timeMinutes, 3)} tracked account minutes`
                                : 'Minute detail begins with new burns'}
                        </small>
                    </div>
                </div>

                <div className="mpce-ledger-table-card">
                    <div className="mpce-ledger-table-heading">
                        <div>
                            <h3>Transactions</h3>
                            <span>{formatNumber(pagination.totalEntries, 0)} total entries</span>
                        </div>
                        {houseMpceLedgerLoading && <span className="mpce-ledger-loading">Refreshing…</span>}
                    </div>

                    {entries.length > 0 ? (
                        <div className="mpce-ledger-table-scroll">
                            <table className="mpce-ledger-full-table">
                                <thead>
                                    <tr>
                                        <th>Date and time</th>
                                        <th>Player</th>
                                        <th>Table / context</th>
                                        <th>Charge type</th>
                                        <th>Account time</th>
                                        <th>Rate</th>
                                        <th>House earned</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="mpce-ledger-nowrap">
                                                {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}
                                            </td>
                                            <td>
                                                <span className="mpce-ledger-player">{entry.user?.username || 'Unknown player'}</span>
                                                <span className="mpce-ledger-muted">{entry.user?.email || entry.user?.id || ''}</span>
                                            </td>
                                            <td>{entry.tableName || 'Table time'}</td>
                                            <td>{reasonLabels[entry.reasonCode] || entry.reasonCode || 'Time charge'}</td>
                                            <td className="mpce-ledger-nowrap">
                                                {entry.timeMinutes === null
                                                    ? <span className="mpce-ledger-muted">Legacy — not recorded</span>
                                                    : `${formatNumber(entry.timeMinutes, 3)} min`}
                                            </td>
                                            <td className="mpce-ledger-nowrap">
                                                {entry.rateMpcePerHour === null
                                                    ? <span className="mpce-ledger-muted">Legacy — not recorded</span>
                                                    : `${formatNumber(entry.rateMpcePerHour)} MPCE/hr`}
                                            </td>
                                            <td className="mpce-ledger-earned">+{formatNumber(entry.amountMpce)} MPCE</td>
                                            <td>
                                                <span className={`mpce-ledger-status ${String(entry.ledgerStatus || 'ACCRUED').toLowerCase()}`}>
                                                    {entry.ledgerStatus || 'ACCRUED'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mpce-ledger-empty">
                            {houseMpceLedgerLoading ? 'Loading transactions…' : 'No MPCE transactions found for this period.'}
                        </div>
                    )}

                    <div className="mpce-ledger-pagination">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1 || houseMpceLedgerLoading}
                        >
                            Previous
                        </button>
                        <span>
                            Page {pagination.currentPage || currentPage} of {pagination.totalPages || 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= Number(pagination.totalPages || 1) || houseMpceLedgerLoading}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MpceLedger;
