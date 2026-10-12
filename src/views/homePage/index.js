import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './index.css';
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats, getDashboardCharts, getAuditLogs } from '../../store/actions/Dashboard';
import { getWalletBalance } from '../../store/actions/PendingWithdrawals';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const { stats, charts, auditLogs } = useSelector(state => state.Dashboard);
    const { walletBalance } = useSelector(state => state.PendingWithdrawals);

    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCustomDates, setShowCustomDates] = useState(false);
    const [activityFilter, setActivityFilter] = useState('All');
    const activeDashboardQuery = useRef({ period: 'all' });

    const fetchDashboardData = useCallback((period = 'all', start = '', end = '', options = {}) => {
        const params = { period };
        if (period === 'custom' && start && end) {
            params.startDate = start;
            params.endDate = end;
        }
        activeDashboardQuery.current = params;
        const requestParams = options.silent ? { ...params, silent: true } : params;
        dispatch(getDashboardStats(requestParams));
        dispatch(getDashboardCharts(requestParams));
        dispatch(getAuditLogs({ page: 1, limit: 10, ...requestParams }));
    }, [dispatch]);

    useEffect(() => {
        fetchDashboardData();
        dispatch(getWalletBalance());

        const refreshTimer = window.setInterval(() => {
            const params = activeDashboardQuery.current;
            fetchDashboardData(params.period, params.startDate, params.endDate, { silent: true });
            dispatch(getWalletBalance({ silent: true }));
        }, 30000);

        return () => window.clearInterval(refreshTimer);
    }, [dispatch, fetchDashboardData]);

    const handlePeriodChange = (e) => {
        const period = e.target.value;
        setSelectedPeriod(period);

        if (period === 'custom') {
            setShowCustomDates(true);
        } else {
            setShowCustomDates(false);
            setStartDate('');
            setEndDate('');
            fetchDashboardData(period);
        }
    };

    const handleCustomDateApply = () => {
        if (startDate && endDate) {
            fetchDashboardData('custom', startDate, endDate);
        }
    };

    const formatMpce = (value) => Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
    });

    const formatMinutes = (value) => Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });

    const formatUsd = (value) => Number(value || 0).toLocaleString(undefined, {
        style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
    });

    // Default chart data if API data not available
    const defaultDailyUsers = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [0, 0, 0, 0, 0, 0, 0]
    };

    const defaultRevenue = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        deposits: [0, 0, 0, 0, 0, 0, 0],
        withdrawals: [0, 0, 0, 0, 0, 0, 0]
    };

    const defaultGameTypes = {
        labels: ['Ring', 'Sit\'n\'Go', 'Tournament'],
        data: [0, 0, 0]
    };

    // Daily Active Users Chart
    const dailyUsersData = {
        labels: charts?.dailyActiveUsers?.labels || defaultDailyUsers.labels,
        datasets: [
            {
                label: 'Active Users',
                data: charts?.dailyActiveUsers?.data || defaultDailyUsers.data,
                fill: true,
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4caf50',
                tension: 0.4,
                pointBackgroundColor: '#4caf50',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#4caf50'
            }
        ]
    };

    // Revenue Trends Chart (Deposits vs Withdrawals)
    const revenueData = {
        labels: charts?.revenueTrends?.labels || defaultRevenue.labels,
        datasets: [
            {
                label: 'Deposits',
                data: charts?.revenueTrends?.deposits || defaultRevenue.deposits,
                backgroundColor: 'rgba(33, 150, 243, 0.8)',
                borderColor: '#2196f3',
                borderWidth: 1
            },
            {
                label: 'Withdrawals',
                data: charts?.revenueTrends?.withdrawals || defaultRevenue.withdrawals,
                backgroundColor: 'rgba(244, 67, 54, 0.8)',
                borderColor: '#f44336',
                borderWidth: 1
            }
        ]
    };

    // Popular Game Types Chart
    const gameTypesData = {
        labels: charts?.popularGameTypes?.labels || defaultGameTypes.labels,
        datasets: [
            {
                data: charts?.popularGameTypes?.data || defaultGameTypes.data,
                backgroundColor: [
                    'rgba(208, 165, 53, 0.9)',
                    'rgba(156, 39, 176, 0.9)',
                    'rgba(33, 150, 243, 0.9)'
                ],
                borderColor: [
                    '#d0a535',
                    '#9c27b0',
                    '#2196f3'
                ],
                borderWidth: 2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#fff'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#888' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                ticks: { color: '#888' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#fff',
                    padding: 20
                }
            }
        }
    };

    const formatActionType = (action) => {
        const actionMap = {
            'FREEZE_USER': 'Banned User',
            'UNFREEZE_USER': 'Unbanned User',
            'APPROVE_WITHDRAWAL': 'Approved Withdrawal',
            'REJECT_WITHDRAWAL': 'Rejected Withdrawal',
            'ADJUST_BALANCE': 'Adjusted Balance',
            'TOGGLE_STORE_ITEM': 'Toggled Store Item',
            'UPDATE_SETTINGS': 'Updated Settings'
        };
        return actionMap[action] || action;
    };

    const getActionIcon = (action) => {
        const iconMap = {
            'FREEZE_USER': 'icon-lock-circle',
            'UNFREEZE_USER': 'icon-key-25',
            'APPROVE_WITHDRAWAL': 'icon-check-2',
            'REJECT_WITHDRAWAL': 'icon-simple-remove',
            'ADJUST_BALANCE': 'icon-coins',
            'TOGGLE_STORE_ITEM': 'icon-bag-16',
            'UPDATE_SETTINGS': 'icon-settings-gear-63'
        };
        return iconMap[action] || 'icon-single-02';
    };

    const getActionIconClass = (action) => {
        const classMap = {
            'FREEZE_USER': 'icon-freeze',
            'UNFREEZE_USER': 'icon-unfreeze',
            'APPROVE_WITHDRAWAL': 'icon-approve',
            'REJECT_WITHDRAWAL': 'icon-reject',
            'ADJUST_BALANCE': 'icon-adjust',
            'TOGGLE_STORE_ITEM': 'icon-store',
            'UPDATE_SETTINGS': 'icon-settings'
        };
        return classMap[action] || '';
    };

    const dashboardKpiGroups = [
        {
            id: 'live-floor',
            title: 'Live Platform Metrics',
            caption: 'Updating in real time',
            items: [
                {
                    label: 'Players Online',
                    value: stats?.live?.playersOnline?.toLocaleString() || '0',
                    detail: `${stats?.live?.socketConnections || 0} socket connections`,
                    icon: 'icon-single-02', iconClass: 'online-icon', to: '/home/users',
                },
                {
                    label: 'Cash Players Online',
                    value: stats?.live?.cashPlayersOnline?.toLocaleString() ?? '—',
                    detail: 'Cash presence',
                    icon: 'icon-money-coins', iconClass: 'cash-players-icon', to: '/home/users',
                },
                {
                    label: 'Free Play Players Online',
                    value: stats?.live?.freePlayPlayersOnline?.toLocaleString() ?? '—',
                    detail: 'Free Play presence',
                    icon: 'icon-controller', iconClass: 'free-players-icon', to: '/home/users',
                },
                {
                    label: 'Active Cash Tables',
                    value: stats?.live?.breakdown?.cash?.activeTables?.toLocaleString() ?? '—',
                    detail: 'Cash ring tables',
                    icon: 'icon-controller', iconClass: 'active-tables-icon', to: '/home/games',
                },
                {
                    label: 'Active Free Play Tables',
                    value: stats?.live?.breakdown?.freePlay?.activeTables?.toLocaleString() ?? '—',
                    detail: 'Free Play ring tables',
                    icon: 'icon-controller', iconClass: 'free-tables-icon', to: '/home/games',
                },
                {
                    label: 'Players Seated',
                    value: stats?.live?.playersSeated?.toLocaleString() || '0',
                    detail: 'At live tables',
                    icon: 'icon-single-02', iconClass: 'seated-icon', to: '/home/games',
                },
                {
                    label: 'New Users Today',
                    value: stats?.users?.newToday?.toLocaleString() || '0',
                    detail: 'Player registrations',
                    icon: 'icon-simple-add', iconClass: 'new-accounts-icon', to: '/home/users',
                },
                {
                    label: 'Pending KYC Reviews',
                    value: stats?.users?.pendingKyc?.toLocaleString() ?? '—',
                    detail: 'Awaiting review',
                    icon: 'icon-lock-circle', iconClass: 'pending-icon', to: '/home/users',
                },
            ],
        },
        {
            id: 'cash-flow',
            title: 'Revenue & Cashier Activity',
            caption: '',
            items: [
                {
                    label: 'Deposits Today',
                    value: formatUsd(stats?.today?.deposits?.amount),
                    detail: `${stats?.today?.deposits?.count || 0} completed deposits`,
                    icon: 'icon-coins', iconClass: 'deposits-icon', to: '/home/cashier',
                },
                {
                    label: 'Pending Withdrawals',
                    value: stats?.withdrawals?.pendingCount?.toLocaleString() || '0',
                    detail: `${formatUsd(stats?.withdrawals?.pendingAmount)} awaiting review`,
                    icon: 'icon-credit-card', iconClass: 'pending-icon', to: '/home/pending-withdrawals',
                },
                {
                    label: 'Approved Withdrawals Today',
                    value: formatUsd(stats?.today?.withdrawals?.amount),
                    detail: `${stats?.today?.withdrawals?.count || 0} approved requests`,
                    icon: 'icon-check-2', iconClass: 'withdrawals-icon', to: '/home/pending-withdrawals',
                },
                {
                    label: 'Play Time Sold Today',
                    value: formatUsd(stats?.today?.timePurchases?.cashUsd),
                    detail: `${formatMinutes(stats?.today?.timePurchases?.timeMinutes)} minutes`,
                    icon: 'icon-time-alarm', iconClass: 'time-purchased-icon', to: '/home/cashier', valueClass: 'treasury-value',
                },
                {
                    label: 'FP Chip Sales Today',
                    value: stats?.today?.fpChipSales?.amountUsd == null ? '—' : formatUsd(stats.today.fpChipSales.amountUsd),
                    detail: 'Free Play purchases',
                    icon: 'icon-controller', iconClass: 'free-players-icon', to: '/home/free-play',
                },
                {
                    label: 'Revenue Today',
                    value: formatUsd(stats?.revenueToday?.estimatedUsd),
                    detail: `${formatMpce(stats?.revenueToday?.mpce)} MPCE earned`,
                    icon: 'icon-coins', iconClass: 'revenue-today-icon', to: '/home/mpce-ledger', valueClass: 'treasury-value',
                },
            ],
        },
        {
            id: 'economy-risk',
            title: 'Economy & Risk',
            caption: '',
            items: [
                {
                    label: 'Treasury USDC',
                    value: walletBalance?.treasuryWallet?.balanceUSDC == null ? '—' : Number(walletBalance.treasuryWallet.balanceUSDC).toLocaleString(),
                    detail: 'Deposit custody',
                    icon: 'icon-money-coins', iconClass: 'treasury-usdc-icon', to: '/home/pending-withdrawals', valueClass: 'treasury-value',
                },
                {
                    label: 'Treasury SOL',
                    value: walletBalance?.treasuryWallet?.balanceSOL == null ? '—' : Number(walletBalance.treasuryWallet.balanceSOL).toLocaleString(),
                    detail: 'Network balance',
                    icon: 'icon-wallet-43', iconClass: 'treasury-icon', to: '/home/pending-withdrawals', valueClass: 'treasury-value',
                },
                {
                    label: 'Player Cash Liabilities',
                    value: formatUsd(stats?.liabilities?.mainnetCashUsd ?? stats?.liabilities?.cashUsd),
                    detail: 'Player cash balance',
                    icon: 'icon-bank', iconClass: 'liabilities-icon', to: '/home/users', valueClass: 'treasury-value',
                },
                {
                    label: 'Free Play Chips Outstanding',
                    value: formatMpce(stats?.liabilities?.fp),
                    detail: 'Non-withdrawable FP',
                    icon: 'icon-controller', iconClass: 'free-tables-icon', to: '/home/free-play',
                },
                {
                    label: 'House MPCE Balance',
                    value: formatMpce(stats?.houseMpce?.availableBalance),
                    detail: `+${formatMpce(stats?.houseMpce?.periodEarned)} this period`,
                    icon: 'icon-wallet-43', iconClass: 'house-mpce-icon', to: '/home/mpce-ledger',
                },
                {
                    label: 'Fraud / Risk Alerts',
                    value: stats?.users?.frozen?.toLocaleString() || '0',
                    detail: 'Restricted accounts',
                    icon: 'icon-lock-circle', iconClass: 'frozen-icon', to: '/home/users',
                },
            ],
        },
    ];

    const activityFilters = ['All', 'Deposits', 'Withdrawals', 'Tables', 'Support / Risk'];
    const filteredActivity = (auditLogs || []).filter((log) => {
        if (activityFilter === 'All') return true;
        const action = String(log.action || '');
        if (activityFilter === 'Deposits') return /DEPOSIT|CREDIT/i.test(action);
        if (activityFilter === 'Withdrawals') return /WITHDRAW/i.test(action);
        if (activityFilter === 'Tables') return /RING|TABLE|TOURNAMENT|SNG/i.test(action);
        return /FREEZE|RESTRICT|KYC|RISK|FRAUD/i.test(action);
    }).slice(0, 5);
    const liveFloorRows = [
        ['Ring Tables', stats?.live?.breakdown?.ring],
        ["Sit'n'Go", stats?.live?.breakdown?.sitNGo],
        ['Tournaments', stats?.live?.breakdown?.tournament],
    ];

    return (
        <div className="content">
            <div className="main-container dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h2 className="dashboard-title">Dashboard / Overview</h2>
                        <p className="console-page-subtitle">Real-time system status, key metrics, and platform activity.</p>
                    </div>
                    <div className="period-filter-container">
                        <div className="period-filter">
                            <label>Period:</label>
                            <select value={selectedPeriod} onChange={handlePeriodChange}>
                                <option value="all">All Time</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        {showCustomDates && (
                            <div className="custom-date-picker">
                                <div className="date-input-group">
                                    <label>From:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="date-input-group">
                                    <label>To:</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="apply-btn"
                                    onClick={handleCustomDateApply}
                                    disabled={!startDate || !endDate}
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <section className="system-status-bar" aria-label="System status">
                    {[
                        ['API', stats?.system?.api?.status],
                        ['Database', stats?.system?.database?.status],
                        ['Game engine', stats?.system?.gameEngine?.newGamesPaused ? 'PAUSED' : stats?.system?.gameEngine?.status],
                        ['Cashier', stats?.system?.cashier?.status],
                        ['Wallet service', stats?.system?.solanaRpc?.status],
                        ['Geolocation', stats?.system?.geolocation?.status || 'Not monitored'],
                    ].map(([label, status]) => (
                        <div className={`system-status-chip is-${String(status || 'checking').toLowerCase()}`} key={label}>
                            <i aria-hidden="true" /><span><strong>{label}</strong><small>{status || 'Checking'}</small></span>
                        </div>
                    ))}
                </section>

                <div className="dashboard-kpi-groups">
                    {dashboardKpiGroups.map((group) => (
                        <section className="dashboard-kpi-group" aria-labelledby={`${group.id}-title`} key={group.id}>
                            <div className="dashboard-kpi-group-header">
                                <h3 id={`${group.id}-title`}>{group.title}</h3>
                                <span>{group.caption}</span>
                            </div>
                            <div className="stats-grid">
                                {group.items.map((item) => (
                                    <button
                                        type="button"
                                        className="stat-card dashboard-link-card compact-stat-card"
                                        onClick={() => history.push(item.to)}
                                        aria-label={`${item.label}: ${item.value}. ${item.detail}`}
                                        key={item.label}
                                    >
                                        <div className={`stat-icon ${item.iconClass}`}><i className={`tim-icons ${item.icon}`} /></div>
                                        <div className="stat-content">
                                            <span className={`stat-value ${item.valueClass || ''}`}>{item.value}</span>
                                            <span className="stat-label">{item.label}</span>
                                            <span className="stat-detail">{item.detail}</span>
                                        </div>
                                        <span className="compact-stat-arrow" aria-hidden="true">→</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="dashboard-operations-grid">
                    <section className="dashboard-operations-panel">
                        <header><h3><i className="tim-icons icon-light-3" /> Recent Activity</h3><button type="button" onClick={() => history.push('/home/audit-log')}>View all activity →</button></header>
                        <div className="dashboard-activity-filters">
                            {activityFilters.map(filter => <button type="button" key={filter} className={activityFilter === filter ? 'active' : ''} onClick={() => setActivityFilter(filter)}>{filter}</button>)}
                        </div>
                        <div className="dashboard-operations-list">
                            {filteredActivity.length ? filteredActivity.map(log => (
                                <div className="dashboard-activity-row" key={log._id}>
                                    <span className={`dashboard-list-icon ${getActionIconClass(log.action)}`}><i className={`tim-icons ${getActionIcon(log.action)}`} /></span>
                                    <span><strong>{formatActionType(log.action)}</strong><small>{log.targetUserId?.username || log.adminId?.username || 'System activity'}</small></span>
                                    <time>{log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</time>
                                </div>
                            )) : <div className="dashboard-operations-empty">No activity for this filter.</div>}
                        </div>
                    </section>
                    <section className="dashboard-operations-panel">
                        <header><h3><i className="tim-icons icon-controller" /> Live Tables / Live Floor</h3><button type="button" onClick={() => history.push('/home/games')}>View all tables →</button></header>
                        <table className="dashboard-floor-table"><thead><tr><th>Table</th><th>Tables</th><th>Players</th><th>Status</th></tr></thead><tbody>
                            {liveFloorRows.map(([label, data]) => <tr key={label}><td>{label}</td><td>{data?.activeTables ?? '—'}</td><td>{data?.playersSeated ?? '—'}</td><td><span className={`dashboard-state ${Number(data?.activeTables || 0) > 0 ? 'live' : ''}`}><i />{Number(data?.activeTables || 0) > 0 ? 'Live' : 'No tables'}</span></td></tr>)}
                        </tbody></table>
                        <div className="dashboard-floor-foot">{stats?.live?.activeTables ?? 0} active tables · {stats?.live?.playersSeated ?? 0} players seated</div>
                    </section>
                    <section className="dashboard-operations-panel">
                        <header><h3><i className="tim-icons icon-bell-55" /> System Notifications</h3><button type="button" onClick={() => history.push('/home/audit-log')}>View all →</button></header>
                        <div className="dashboard-operations-list">
                            {[
                                ['API', stats?.system?.api?.status],
                                ['Database', stats?.system?.database?.status],
                                ['Game engine', stats?.system?.gameEngine?.newGamesPaused ? 'PAUSED' : stats?.system?.gameEngine?.status],
                                ['Cashier', stats?.system?.cashier?.status],
                                ['Solana RPC', stats?.system?.solanaRpc?.status],
                            ].map(([label, status]) => <div className="dashboard-notification-row" key={label}><i className={`dashboard-notification-dot ${String(status || '').toLowerCase()}`} /><span><strong>{label}</strong><small>{status || 'Checking status'}</small></span></div>)}
                        </div>
                    </section>
                </div>

                <section className="house-ledger-card">
                    <div className="house-ledger-header">
                        <div>
                            <h3 className="chart-title">House MPCE Ledger</h3>
                            <span className="chart-subtitle">Completed user-to-house table-time transfers</span>
                        </div>
                        <div className="house-ledger-summary">
                            <span>{formatMpce(stats?.houseMpce?.totalEarned)} MPCE lifetime</span>
                            <span>
                                {stats?.houseMpce?.totalTimeTrackedCount > 0
                                    ? `${formatMinutes(stats?.houseMpce?.totalTimeMinutes)} tracked account minutes removed`
                                    : 'Minute detail begins with new burns'}
                            </span>
                            <button
                                type="button"
                                className="ledger-view-all-btn"
                                onClick={() => history.push('/home/mpce-ledger')}
                            >
                                View all transactions →
                            </button>
                        </div>
                    </div>

                    {stats?.houseMpce?.recent?.length > 0 ? (
                        <div className="house-ledger-table-wrap">
                            <table className="house-ledger-table">
                                <thead>
                                    <tr>
                                        <th>When</th>
                                        <th>Player</th>
                                        <th>Table / context</th>
                                        <th>Account time</th>
                                        <th>House earned</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.houseMpce.recent.map((entry) => (
                                        <tr key={entry.id}>
                                            <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}</td>
                                            <td>
                                                <span className="ledger-player-name">
                                                    {entry.user?.username || entry.user?.email || 'Unknown player'}
                                                </span>
                                                {entry.user?.username && entry.user?.email && (
                                                    <span className="ledger-player-email">{entry.user.email}</span>
                                                )}
                                            </td>
                                            <td>{entry.tableName || 'Table time'}</td>
                                            <td>{entry.timeMinutes === null ? 'Legacy — not recorded' : `${formatMinutes(entry.timeMinutes)} min`}</td>
                                            <td className="ledger-amount">+{formatMpce(entry.amountMpce)} MPCE</td>
                                            <td><span className="ledger-status">{entry.ledgerStatus || 'ACCRUED'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="house-ledger-empty">No MPCE burns recorded for this period.</div>
                    )}
                </section>

                {/* Charts Section */}
                <div className="charts-section">
                    <div className="charts-row">
                        {/* Daily Active Users Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">Daily Active Users</h3>
                                <span className="chart-subtitle">Last 7 days</span>
                            </div>
                            <div className="chart-body">
                                <Line data={dailyUsersData} options={chartOptions} />
                            </div>
                        </div>

                        {/* Revenue Trends Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">Revenue Trends</h3>
                                <span className="chart-subtitle">Deposits vs Withdrawals</span>
                            </div>
                            <div className="chart-body">
                                <Bar data={revenueData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="charts-row">
                        {/* Popular Game Types Chart */}
                        <div className="chart-card chart-card-small">
                            <div className="chart-header">
                                <h3 className="chart-title">Popular Game Types</h3>
                                <span className="chart-subtitle">Games played distribution</span>
                            </div>
                            <div className="chart-body doughnut-chart">
                                <Doughnut data={gameTypesData} options={doughnutOptions} />
                            </div>
                        </div>

                        {/* Audit Log */}
                        <div className="chart-card audit-log-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">Recent Admin Activity</h3>
                                    <span className="chart-subtitle">Audit Log</span>
                                </div>
                                <button type="button" className="audit-log-view-all" onClick={() => history.push('/home/audit-log')}>
                                    View all →
                                </button>
                            </div>
                            <div className="audit-log-body">
                                {auditLogs && auditLogs.length > 0 ? (
                                    <div className="audit-log-list">
                                        {auditLogs.map((log, index) => (
                                            <div key={index} className="audit-log-item">
                                                <div className={`audit-log-icon ${getActionIconClass(log.action)}`}>
                                                    <i className={`tim-icons ${getActionIcon(log.action)}`}></i>
                                                </div>
                                                <div className="audit-log-content">
                                                    <span className="audit-log-action">
                                                        {formatActionType(log.action)}
                                                    </span>
                                                    <span className="audit-log-details">
                                                        {log.adminId?.username || 'Admin'} → {log.targetUserId?.username || 'User'}
                                                    </span>
                                                    <span className="audit-log-time">
                                                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-audit-logs">
                                        <p>No recent admin activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHomePage;
