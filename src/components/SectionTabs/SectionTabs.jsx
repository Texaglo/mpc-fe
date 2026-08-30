import { NavLink } from 'react-router-dom';
import './index.css';

const groups = [
    {
        id: 'overview',
        label: 'Overview',
        icon: 'tim-icons icon-chart-pie-36',
        tabs: [
            { path: '/home/dashboard', label: 'Dashboard' },
            { path: '/home/progress', label: 'Launch Progress' },
        ],
    },
    {
        id: 'commerce',
        label: 'Commerce',
        icon: 'tim-icons icon-bag-16',
        tabs: [
            { path: '/home/game-store', label: 'Game Store' },
            { path: '/home/marketplace', label: 'Marketplace' },
        ],
    },
    {
        id: 'players',
        label: 'Players',
        icon: 'tim-icons icon-single-02',
        tabs: [
            { path: '/home/users', label: 'User Management' },
            { path: '/home/leaderboards', label: 'Leaderboards' },
            { path: '/home/hand-history', label: 'Hand History' },
        ],
    },
    {
        id: 'operations',
        label: 'Operations',
        icon: 'tim-icons icon-settings-gear-63',
        tabs: [
            { path: '/home/pending-withdrawals', label: 'Withdrawals' },
            { path: '/home/cashier', label: 'Cashier' },
            { path: '/home/settings', label: 'Economy Settings' },
            { path: '/home/free-play', label: 'Free Play' },
        ],
    },
];

const SectionTabs = ({ pathname }) => {
    const group = groups.find((candidate) => candidate.tabs.some((tab) => tab.path === pathname));
    if (!group) return null;

    return (
        <nav className="section-tabs" aria-label={`${group.label} sections`}>
            <div className="section-tabs-label">
                <i className={group.icon} aria-hidden="true" />
                <span>{group.label}</span>
            </div>
            <div className="section-tabs-links">
                {group.tabs.map((tab) => (
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

export default SectionTabs;
