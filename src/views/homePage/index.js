import { useEffect, useState } from 'react';
import './index.css';
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats, getDashboardCharts, getAuditLogs } from '../../store/actions/Dashboard';
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
    const { stats, charts, auditLogs } = useSelector(state => state.Dashboard);

    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCustomDates, setShowCustomDates] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        dispatch(getAuditLogs({ page: 1, limit: 10 }));
    }, []);

    const fetchDashboardData = (period = 'all', start = '', end = '') => {
        const params = { period };
        if (period === 'custom' && start && end) {
            params.startDate = start;
            params.endDate = end;
        }
        dispatch(getDashboardStats(params));
        dispatch(getDashboardCharts(params));
    };

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
            'FREEZE_USER': 'Froze User',
            'UNFREEZE_USER': 'Unfroze User',
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

                <div className="stats-grid">
                    {/* Total Users */}
                    <div className="stat-card">
                        <div className="stat-icon users-icon">
                            <i className="tim-icons icon-single-02"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats?.users?.total?.toLocaleString() || '0'}</span>
                            <span className="stat-label">Total Users</span>
                        </div>
                    </div>

                    {/* Frozen Users */}
                    <div className="stat-card">
                        <div className="stat-icon frozen-icon">
                            <i className="tim-icons icon-lock-circle"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats?.users?.frozen?.toLocaleString() || '0'}</span>
                            <span className="stat-label">Frozen Users</span>
                        </div>
                    </div>

                    {/* Pending Withdrawals */}
                    <div className="stat-card">
                        <div className="stat-icon pending-icon">
                            <i className="tim-icons icon-credit-card"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats?.withdrawals?.pendingCount?.toLocaleString() || '0'}</span>
                            <span className="stat-label">Pending Withdrawals</span>
                        </div>
                    </div>

                    {/* Today's Deposits */}
                    <div className="stat-card">
                        <div className="stat-icon deposits-icon">
                            <i className="tim-icons icon-coins"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats?.today?.deposits?.count?.toLocaleString() || '0'}</span>
                            <span className="stat-label">Today's Deposits</span>
                        </div>
                    </div>

                    {/* Today's Withdrawals */}
                    <div className="stat-card">
                        <div className="stat-icon withdrawals-icon">
                            <i className="tim-icons icon-send"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats?.today?.withdrawals?.count?.toLocaleString() || '0'}</span>
                            <span className="stat-label">Today's Withdrawals</span>
                        </div>
                    </div>
                </div>

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
                                <h3 className="chart-title">Recent Admin Activity</h3>
                                <span className="chart-subtitle">Audit Log</span>
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
