import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { canAccess } from '../../utils/adminAccess';
import './index.css';

const groups = [
    {
        id: 'overview',
        label: 'Overview',
        icon: 'tim-icons icon-chart-pie-36',
        tabs: [
            { path: '/home/dashboard', label: 'Dashboard', permission: 'overview.view' },
            { path: '/home/progress', label: 'Launch Progress', permission: 'overview.view' },
        ],
    },
    {
        id: 'commerce',
        label: 'Commerce',
        icon: 'tim-icons icon-bag-16',
        tabs: [
            { path: '/home/game-store', label: 'Game Store', permission: 'commerce.view' },
            { path: '/home/marketplace', label: 'Marketplace', permission: 'commerce.view' },
        ],
    },
    {
        id: 'players',
        label: 'Players',
        icon: 'tim-icons icon-single-02',
        tabs: [
            { path: '/home/users', label: 'User Management', permission: 'players.view' },
            { path: '/home/leaderboards', label: 'Leaderboards', permission: 'players.view' },
            { path: '/home/hand-history', label: 'Hand History', permission: 'hand_history.view' },
        ],
    },
    {
        id: 'operations',
        label: 'Operations',
        icon: 'tim-icons icon-settings-gear-63',
        tabs: [
            { path: '/home/pending-withdrawals', label: 'Withdrawals', permission: 'operations.view' },
            { path: '/home/cashier', label: 'Cashier', permission: 'cashier.view' },
            { path: '/home/settings', label: 'Economy Settings', permission: 'economy.view' },
            { path: '/home/free-play', label: 'Free Play', permission: 'free_play.view' },
        ],
    },
];

const SectionTabs = ({ pathname, role, permissions }) => {
    const group = groups.find((candidate) => candidate.tabs.some((tab) => tab.path === pathname));
    if (!group) return null;

    return (
        <nav className="section-tabs" aria-label={`${group.label} sections`}>
            <div className="section-tabs-label">
                <i className={group.icon} aria-hidden="true" />
                <span>{group.label}</span>
            </div>
            <div className="section-tabs-links">
                {group.tabs.filter((tab) => canAccess({ role, permissions }, tab.permission)).map((tab) => (
                    <NavLink
                        exact
                        key={tab.path}
                        to={tab.path}
                        className="section-tab-link"
                        activeClassName="active"
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default connect(({ Auth }) => ({ role: Auth.role, permissions: Auth.permissions }))(SectionTabs);
