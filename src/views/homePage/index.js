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
            title: 'Live Floor',
            caption: 'Current player and table activity',
            items: [
                {
                    label: 'Players Online',
                    value: stats?.live?.playersOnline?.toLocaleString() || '0',
                    detail: `${stats?.live?.recentAuthenticatedPlayers ?? stats?.live?.httpActivePlayers ?? 0} authenticated · ${stats?.live?.socketConnections || 0} sockets`,
                    icon: 'icon-wifi', iconClass: 'online-icon', to: '/home/users',
                },
                {
                    label: 'Active Tables',
                    value: stats?.live?.activeTables?.toLocaleString() || '0',
                    detail: "Ring, Sit'n'Go & tournaments",
                    icon: 'icon-controller', iconClass: 'active-tables-icon', to: '/home/games',
                },
                {
                    label: 'Players Seated',
                    value: stats?.live?.playersSeated?.toLocaleString() || '0',
                    detail: `${stats?.live?.connectedRingPlayers || 0} connected at ring tables`,
                    icon: 'icon-single-02', iconClass: 'seated-icon', to: '/home/games',
                },
                {
                    label: 'Total Users',
                    value: stats?.users?.total?.toLocaleString() || '0',
                    detail: `${stats?.users?.newInPeriod?.toLocaleString() || 0} added in selected period`,
                    icon: 'icon-single-02', iconClass: 'users-icon', to: '/home/users',
                },
                {
                    label: 'New Today',
                    value: stats?.users?.newToday?.toLocaleString() || '0',
                    detail: 'New player accounts',
                    icon: 'icon-simple-add', iconClass: 'new-accounts-icon', to: '/home/users',
                },
            ],
        },
        {
            id: 'cash-flow',
            title: "Today's Cash Flow",
            caption: 'Movement requiring operator awareness',
            items: [
                {
                    label: "Today's Deposits",
                    value: stats?.today?.deposits?.count?.toLocaleString() || '0',
                    detail: 'Recorded deposits',
                    icon: 'icon-coins', iconClass: 'deposits-icon', to: '/home/cashier',
                },
                {
                    label: "Today's Withdrawals",
                    value: stats?.today?.withdrawals?.count?.toLocaleString() || '0',
                    detail: 'Recorded withdrawals',
                    icon: 'icon-send', iconClass: 'withdrawals-icon', to: '/home/pending-withdrawals',
                },
                {
                    label: 'Pending Withdrawals',
                    value: stats?.withdrawals?.pendingCount?.toLocaleString() || '0',
                    detail: 'Awaiting operator review',
                    icon: 'icon-credit-card', iconClass: 'pending-icon', to: '/home/pending-withdrawals',
                },
                {
                    label: 'Time Purchased',
                    value: `${formatMinutes(stats?.today?.timePurchases?.timeMinutes)} min`,
                    detail: `${formatMpce(stats?.today?.timePurchases?.mpce)} MPCE · ${formatUsd(stats?.today?.timePurchases?.cashUsd)}`,
                    icon: 'icon-time-alarm', iconClass: 'time-purchased-icon', to: '/home/cashier', valueClass: 'treasury-value',
                },
                {
                    label: 'Revenue Today',
                    value: formatUsd(stats?.revenueToday?.estimatedUsd),
                    detail: `${formatMpce(stats?.revenueToday?.mpce)} MPCE · ${formatMinutes(stats?.revenueToday?.timeMinutes)} min`,
                    icon: 'icon-coins', iconClass: 'revenue-today-icon', to: '/home/mpce-ledger', valueClass: 'treasury-value',
                },
            ],
        },
        {
            id: 'economy-risk',
            title: 'Economy & Risk',
            caption: 'Liabilities, house earnings and custody',
            items: [
                {
                    label: 'Player Liabilities',
                    value: formatUsd(stats?.liabilities?.mainnetCashUsd ?? stats?.liabilities?.cashUsd),
                    detail: `Dev ${formatUsd(stats?.liabilities?.devnetCashUsd)} · ${formatMpce(stats?.liabilities?.mpce)} MPCE · ${formatMpce(stats?.liabilities?.fp)} FP`,
                    icon: 'icon-chart-pie-36', iconClass: 'liabilities-icon', to: '/home/users', valueClass: 'treasury-value',
                },
                {
                    label: 'House MPCE',
                    value: formatMpce(stats?.houseMpce?.availableBalance),
                    detail: `+${formatMpce(stats?.houseMpce?.periodEarned)} in selected period`,
                    icon: 'icon-bank', iconClass: 'house-mpce-icon', to: '/home/mpce-ledger',
                },
                {
                    label: 'Treasury SOL',
                    value: walletBalance?.treasuryWallet?.balanceSOL || 'Unavailable',
                    detail: walletBalance?.network || 'Network unavailable',
                    icon: 'icon-wallet-43', iconClass: 'treasury-icon', to: '/home/pending-withdrawals', valueClass: 'treasury-value',
                },
                {
                    label: 'Treasury USDC',
                    value: walletBalance?.treasuryWallet?.balanceUSDC || 'Unavailable',
                    detail: 'Deposit custody',
                    icon: 'icon-money-coins', iconClass: 'treasury-usdc-icon', to: '/home/pending-withdrawals', valueClass: 'treasury-value',
                },
                {
                    label: 'Banned Users',
                    value: stats?.users?.frozen?.toLocaleString() || '0',
                    detail: 'Account access restricted',
                    icon: 'icon-lock-circle', iconClass: 'frozen-icon', to: '/home/users',
                },
            ],
        },
    ];

    return (
        <div className="content">
            <div className="main-container dashboard-container">
                <div className="dashboard-header">
                    <h2 className="dashboard-title">Dashboard</h2>
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
                    <div><strong>System status</strong><span>Live backend checks</span></div>
                    {[
                        ['API', stats?.system?.api?.status],
                        ['Database', stats?.system?.database?.status],
                        ['Sockets', stats?.system?.sockets?.status],
                        ['Solana RPC', stats?.system?.solanaRpc?.status],
                        ['Game engine', stats?.system?.gameEngine?.newGamesPaused ? 'PAUSED' : stats?.system?.gameEngine?.status],
                        ['Cashier', stats?.system?.cashier?.status],
                    ].map(([label, status]) => (
                        <span className={`system-status-chip is-${String(status || 'checking').toLowerCase()}`} key={label}>
                            <i />{label}: {status || 'Checking'}
                        </span>
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
