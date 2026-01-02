import { useEffect } from 'react';
import './index.css';
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats } from '../../store/actions/Dashboard';

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const { stats } = useSelector(state => state.Dashboard);

    useEffect(() => {
        dispatch(getDashboardStats());
    }, [dispatch]);

    return (
        <div className="content">
            <div className="main-container dashboard-container">
                <div className="dashboard-header">
                    <h2 className="dashboard-title">Dashboard</h2>
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
            </div>
        </div>
    );
};

export default AdminHomePage;
