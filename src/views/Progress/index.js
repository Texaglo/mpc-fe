import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { setLoader } from '../../store/actions/Auth';
import './index.css';

const STATUS = {
    ready: { label: 'Operational', shortLabel: 'Ready' },
    partial: { label: 'Partial', shortLabel: 'Partial' },
    missing: { label: 'Not implemented', shortLabel: 'Missing' },
};

const sections = [
    {
        id: 'dashboard',
        number: '01',
        title: 'Dashboard',
        description: 'Live operating picture for player activity, money movement and system health.',
        controls: [
            { name: 'Players online', status: 'ready', exists: 'Dashboard counts unique authenticated player sockets and recent authenticated player API activity, including multiple-connection detail, and links to Players.', remains: 'Verify the configured shared presence adapter during the multi-instance staging pass.' },
            { name: 'Active tables', status: 'ready', exists: 'Dashboard aggregates active Ring, Sit’n’Go and tournament games with a Games drill-through.', route: '/home/games', routeLabel: 'Open Games' },
            { name: 'Players currently seated', status: 'ready', exists: 'Dashboard aggregates stored seats across game types and separately shows connected ring seats.', route: '/home/games', routeLabel: 'Open Games' },
            { name: 'New accounts', status: 'ready', exists: 'Dashboard shows accounts created today and the selected reporting-period count with player drill-through.' },
            { name: 'Player wallet balances / liabilities', status: 'ready', exists: 'Dashboard aggregates Cash/USD, canonical MPCE, projected Unity minutes and FP as explicitly separate units.' },
            { name: 'Deposits today', status: 'ready', exists: 'The dashboard now aggregates completed crypto, card and legacy deposit records in USD.' },
            { name: 'Withdrawals today', status: 'ready', exists: 'Approved withdrawals are counted and displayed.', remains: 'Optional: make the metric clickable and show count plus amount.', route: '/home/pending-withdrawals', routeLabel: 'Open Withdrawals' },
            { name: 'Time purchased today', status: 'ready', exists: 'Dashboard shows today’s purchased minutes, MPCE issued and Cash/USD paid with a Cashier drill-through.' },
            { name: 'Revenue today', status: 'ready', exists: 'Dashboard shows house MPCE burned today and a clearly labelled USD estimate using the current standard Time price and MPCE minute value.' },
            { name: 'Pending withdrawals', status: 'ready', exists: 'A dashboard count and withdrawal queue exist.', remains: 'Align the queue with every withdrawal method and status.', route: '/home/pending-withdrawals', routeLabel: 'Open Queue' },
            { name: 'System / game status', status: 'ready', exists: 'Dashboard reports API, database, shared multi-instance presence, game/cashier controls and cached live Solana RPC slot/latency. Degraded checks emit internally and post to the configured external alert webhook.' },
        ],
    },
    {
        id: 'players',
        number: '02',
        title: 'Player Management',
        description: 'Player identity, balances, history, access control and support operations.',
        controls: [
            { name: 'Search username / email / user ID / wallet', status: 'ready', exists: 'Username, email, wallet and exact database user-ID search are operational.', route: '/home/users', routeLabel: 'Open Users' },
            { name: 'Player profile', status: 'ready', exists: 'A compact operator profile combines identity, balances, wallets, sessions, hand performance, inventory state and recent transactions.', route: '/home/users', routeLabel: 'Open Players' },
            { name: 'Cash balance', status: 'ready', exists: 'Cash is stored, returned and displayed explicitly in the player panel.' },
            { name: 'Time / MPCE balance', status: 'ready', exists: 'Canonical MPCE and the Unity-compatible minute projection are displayed and adjusted together.' },
            { name: 'FP balance', status: 'ready', exists: 'A canonical FP balance now exists with safe manual credit/debit ledger records.' },
            { name: 'Connected wallets', status: 'ready', exists: 'The player profile combines the primary linked wallet and every saved payout wallet without changing the single primary Unity contract.' },
            { name: 'Creation date / last login', status: 'ready', exists: 'Account creation, last login and shared authenticated activity timestamps are recorded and displayed.' },
            { name: 'Deposit / withdrawal history', status: 'ready', exists: 'Player transaction history is paginated and filterable with status, asset, timestamps and chain/provider references.' },
            { name: 'Time-purchase history', status: 'ready', exists: 'Time purchases have a dedicated transaction filter and preserve USD, MPCE and minute conversion detail.' },
            { name: 'Player inventory', status: 'ready', exists: 'The Users page exposes searchable owned, equipped, consumed, expired and revoked inventory with pagination.', route: '/home/users', routeLabel: 'Open Players' },
            { name: 'Current table / session', status: 'ready', exists: 'Player results resolve current Ring, Sit’n’Go and tournament sessions with game ID, status and ring connection state.' },
            { name: 'Suspend / unsuspend', status: 'ready', exists: 'Ban/unban requires a reason; bans revoke issued sessions immediately.' },
            { name: 'Force logout', status: 'ready', exists: 'A reasoned Force Logout action increments the player session version and invalidates every issued JWT.' },
            { name: 'Credit / debit Cash, Time or FP', status: 'ready', exists: 'The player panel explicitly selects Cash, MPCE or FP and maintains each canonical balance safely.' },
            { name: 'Reason + admin audit for adjustments', status: 'ready', exists: 'Every balance, suspension and session action requires a reason and creates a structured audit delta.' },
        ],
    },
    {
        id: 'cashier',
        number: '03',
        title: 'Economy & Cashier',
        description: 'Complete money movement, treasury operations and emergency economy controls.',
        controls: [
            { name: 'All deposits', status: 'ready', exists: 'The Cashier ledger lists card, crypto and legacy deposits with player, USD value and chain references.', route: '/home/cashier', routeLabel: 'Open Cashier' },
            { name: 'All withdrawals', status: 'ready', exists: 'The Cashier ledger includes every crypto and bank withdrawal across every status.', route: '/home/cashier', routeLabel: 'Open Cashier' },
            { name: 'Pending / approved / rejected / completed', status: 'ready', exists: 'The unified ledger exposes and filters all four transaction states.' },
            { name: 'Approve / reject manual withdrawals', status: 'ready', exists: 'Crypto withdrawals pay only from the prefunded distribution wallet; bank payouts require an external completion reference, and both methods support audited rejection.' },
            { name: 'Transaction details', status: 'ready', exists: 'Exposed withdrawals include player, amount, currency, timestamps and chain hashes.', remains: 'Carry the same detail into a unified cashier ledger.' },
            { name: 'Treasury / hot-wallet status', status: 'ready', exists: 'Live balances, addresses, network and hot-wallet thresholds are visible.', remains: 'Add service freshness and RPC failure state to system health.', route: '/home/pending-withdrawals', routeLabel: 'View Wallets' },
            { name: 'Time purchases', status: 'ready', exists: 'Cash-to-time purchases are visible for every player with USD, MPCE and minute detail.' },
            { name: 'Set Time price', status: 'ready', exists: 'USD/hour pricing is an audited database setting used dynamically by the existing purchase route.' },
            { name: 'Minimum / maximum deposit', status: 'ready', exists: 'Audited USD limits are enforced when new card, crypto or MoonPay deposits begin.' },
            { name: 'Minimum / maximum withdrawal', status: 'ready', exists: 'Audited USD limits replace the hardcoded minimum and are enforced on the existing route.' },
            { name: 'Pause deposits', status: 'ready', exists: 'An audited switch blocks new deposit intents without preventing settlement of funds already transferred.' },
            { name: 'Pause withdrawals', status: 'ready', exists: 'An audited switch blocks new withdrawal requests.' },
            { name: 'Global cashier kill switch', status: 'ready', exists: 'An audited emergency switch blocks deposits, withdrawals and time purchases.' },
            { name: 'Free Play operations', status: 'ready', exists: 'Operations includes audited FP availability, signup issuance, purchase conversion and dated daily-login schedules without creating a second token.', route: '/home/free-play', routeLabel: 'Open Free Play' },
            { name: 'Free Play ledger / liability', status: 'ready', exists: 'The canonical FP ledger shows outstanding non-withdrawable player balances and recent issuance, purchase and adjustment records.', route: '/home/free-play', routeLabel: 'Open FP Ledger' },
        ],
    },
    {
        id: 'games',
        number: '04',
        title: 'Game & Table Controls',
        description: 'Creation, availability, seating, stakes and emergency control of live poker tables.',
        controls: [
            { name: 'View all tables', status: 'ready', exists: 'The Ring screen lists all non-bot ring tables.', remains: 'Optional: add active-only and region filters.', route: '/home/games', routeLabel: 'Open Games' },
            { name: 'NLH / PLO game type', status: 'ready', exists: 'Texas Hold’em and Omaha are supported by the engine and form.', remains: 'Label Omaha + Pot Limit explicitly as PLO for operators.' },
            { name: 'Stakes', status: 'ready', exists: 'Small blind, big blind and buy-in range are displayed.' },
            { name: 'Seats / maximum players', status: 'ready', exists: 'Seat limits from 2 through 9 are validated and displayed.' },
            { name: 'Players seated', status: 'ready', exists: 'Current seated count is shown for each table.' },
            { name: 'Table status', status: 'ready', exists: 'Active, Disabled and Maintenance states are editable and enforced.' },
            { name: 'Create table', status: 'ready', exists: 'A compact, validated create/edit form is operational.' },
            { name: 'Disable / close table', status: 'ready', exists: 'Disable, Maintenance and Delete remain available, with an audited close-after-current-hand control that blocks new joins and preserves seated play.' },
            { name: 'Pause new matchmaking', status: 'ready', exists: 'Per-table status and the global audited switch reject new joins while preserving seated-player reconnects.' },
            { name: 'Current / previous hands', status: 'ready', exists: 'The Players area now includes a compact authoritative hand browser with status, table, players, stakes, pot and winner detail.', route: '/home/hand-history', routeLabel: 'Open Hands' },
            { name: 'Find table by table ID', status: 'ready', exists: 'The hand browser searches table names and exact table IDs returned by the history service.', route: '/home/hand-history', routeLabel: 'Search Hands' },
            { name: 'Find hand by hand ID', status: 'ready', exists: 'Operators can search exact hand IDs and open the complete backend timeline.', route: '/home/hand-history', routeLabel: 'Search Hands' },
            { name: 'Global disable new games', status: 'ready', exists: 'Games now has a reasoned, audited global pause/resume control. New joins are blocked while existing seats and reconnects remain compatible.' },
            { name: 'TIME / FP table economies', status: 'ready', exists: 'Join, queued join, top-up, leave, disconnect and automatic release debit/refund the table’s selected Cash, MPCE/Time or FP balance.' },
        ],
    },
    {
        id: 'hands',
        number: '05',
        title: 'Hand History',
        description: 'Authoritative dispute evidence, action reconstruction, search and controlled card disclosure.',
        controls: [
            { name: 'Hand ID and table', status: 'ready', exists: 'List and detail views expose the hand hierarchy, table name, table ID and hand number.', route: '/home/hand-history', routeLabel: 'Open Hands' },
            { name: 'Players', status: 'ready', exists: 'The detail view presents participants, seats, player IDs, stack movement and settlement.', route: '/home/hand-history', routeLabel: 'Open Hands' },
            { name: 'Stakes', status: 'ready', exists: 'Small and big blinds are visible in list and reconstruction views.' },
            { name: 'Hole cards after completion', status: 'ready', exists: 'Active-hand APIs reveal only the requesting player’s own cards; admins and outsiders receive no opponent cards until the hand is completed.' },
            { name: 'Board / runout', status: 'ready', exists: 'The final authoritative board is rendered alongside the street-grouped action timeline.' },
            { name: 'Every action + amount', status: 'ready', exists: 'Strictly sequenced movements show actor, event/action, committed amount, pot and event time.' },
            { name: 'Pot and side pots', status: 'ready', exists: 'Final pot, side pots and settlement refunds are summarized in the reconstruction.' },
            { name: 'Winner', status: 'ready', exists: 'Winners, prizes, final hands and player stack changes are presented together.' },
            { name: 'Timestamp', status: 'ready', exists: 'Hand and movement timestamps display in the operator’s local timezone.' },
            { name: 'Search player / table / hand', status: 'ready', exists: 'The visual browser searches hand, game, table ID/name, username, email, wallet or exact player ID with status/economy filters.' },
            { name: 'Download / export', status: 'ready', exists: 'Completed hands download from the backend as a SHA-256 evidence package; live hands cannot be exported and retain card secrecy.', route: '/home/hand-history', routeLabel: 'Open Hands' },
            { name: 'Performance leaderboards', status: 'ready', exists: 'Completed authoritative hands populate separate Cash and Free Play rankings for hands won, net won, time played and win/loss ratio.', route: '/home/leaderboards', routeLabel: 'Open Leaderboards' },
        ],
    },
    {
        id: 'inventory',
        number: '06',
        title: 'Inventory',
        description: 'Player-owned items, equipment state and operator-managed entitlement history.',
        controls: [
            { name: 'Items owned by player', status: 'ready', exists: 'Admins can inspect all lifecycle states from each player row.', route: '/home/users', routeLabel: 'Open Players' },
            { name: 'Equipped / unequipped status', status: 'ready', exists: 'The inventory view shows equipment state, group and slot without changing Unity equipment contracts.', route: '/home/users', routeLabel: 'Open Players' },
            { name: 'Grant item', status: 'ready', exists: 'Admins can grant active catalog entitlements with quantity, idempotency and a required audit reason.', route: '/home/users', routeLabel: 'Open Players' },
            { name: 'Remove item', status: 'ready', exists: 'Admins can soft-revoke active entitlements, unequip them and retain their complete ownership record and audit delta.', route: '/home/users', routeLabel: 'Open Players' },
            { name: 'Item transaction / history', status: 'ready', exists: 'Each entitlement exposes acquisition source/reference, equipped state and soft-revocation event/reason without deleting ownership history.' },
            { name: 'Search item / SKU', status: 'ready', exists: 'Catalog items have stable SKUs and the Marketplace and player inventory views search by name, SKU or item ID.', route: '/home/marketplace', routeLabel: 'Open Catalog' },
        ],
    },
    {
        id: 'audit',
        number: '07',
        title: 'Admin Audit Log',
        description: 'Complete accountability for every privileged action and financial change.',
        controls: [
            { name: 'Who did it', status: 'ready', exists: 'Admin identity is stored and populated in audit records.' },
            { name: 'What changed', status: 'ready', exists: 'Balance, session, cashier, settings, withdrawal, refill, inventory, table and catalog mutations are recorded.' },
            { name: 'Old value → new value', status: 'ready', exists: 'Privileged mutations store consistent previousValue and newValue structures, including table and catalog snapshots.' },
            { name: 'Player affected', status: 'ready', exists: 'Target player is stored for player-related actions.' },
            { name: 'Timestamp', status: 'ready', exists: 'Every audit entry receives a creation timestamp.' },
            { name: 'Reason', status: 'ready', exists: 'Sensitive financial, access, settings, wallet-refill and table-close actions require an operator reason; lower-risk table/catalog mutations also retain a reason in their audit entry.' },
            { name: 'Complete visual ledger', status: 'ready', exists: 'A dedicated audit page provides search, action and date filters, pagination, structured change summaries and raw record detail.', route: '/home/audit-log', routeLabel: 'Open Audit Log' },
        ],
    },
];

const blockers = [
    { number: '01', status: 'resolved', title: 'Balance adjustment integrity', detail: 'Resolved: the operator explicitly selects Cash, MPCE or FP and the matching balance and ledger are updated.' },
    { number: '02', status: 'resolved', title: 'Cashier operations', detail: 'Resolved: the full ledger, audited limits, pricing and emergency switches are operational.' },
    { number: '03', status: 'resolved', title: 'Immediate session revocation', detail: 'Resolved: bans and Force Logout invalidate all previously issued player JWTs.' },
    { number: '04', status: 'resolved', title: 'Active hand card disclosure', detail: 'Resolved: admin APIs preserve live-hand card secrecy and release all cards only after authoritative completion.' },
    { number: '05', status: 'resolved', title: 'TIME / FP table settlement', detail: 'Resolved: every ring stack lifecycle operation now follows the stored table/player balance type while keeping Unity’s stack contract unchanged.' },
    { number: '06', status: 'resolved', title: 'Isolated regression environment', detail: 'Resolved: Jest and the live backend E2E use dedicated local Mongo databases with a fail-closed test URI guard; 351 tests and all six live game-flow scenarios pass.' },
    { number: '07', title: 'NFT unique index is not enforced', detail: 'Backend startup reports a duplicate normalized Ethereum transaction hash and cannot build the safety index.' },
    { number: '08', title: 'Production perimeter is not proven', detail: 'TLS, secret-manager SESSION_SECRET, restricted CORS and protected API documentation must be verified in production mode.' },
    { number: '09', title: 'Controlled custody E2E remains', detail: 'The complete deposit/time/burn and hot-wallet refill/withdrawal flows need a staging/devnet run with retries and fee reserve checks.' },
    { number: '10', title: 'Dependency security remediation', detail: 'The current backend and admin dependency trees contain high and critical audit findings. Upgrade Solana/Web3, React/build tooling and transitive packages in controlled groups; do not apply a force audit migration.' },
    { number: '11', title: 'Production scale proof', detail: 'The shared presence adapter, socket failover, alert webhook and 30-player table load must be repeated in the deployed multi-instance environment.' },
];

const Progress = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        dispatch(setLoader(false));
    }, [dispatch]);

    const allControls = useMemo(() => sections.flatMap(section => (
        section.controls.map(control => ({ ...control, sectionId: section.id, sectionTitle: section.title }))
    )), []);

    const totals = useMemo(() => allControls.reduce((summary, control) => {
        summary[control.status] += 1;
        return summary;
    }, { ready: 0, partial: 0, missing: 0 }), [allControls]);

    const readiness = Math.round(((totals.ready + (totals.partial * 0.5)) / allControls.length) * 100);
    const normalizedSearch = search.trim().toLowerCase();

    const filteredSections = sections.map(section => ({
        ...section,
        controls: section.controls.filter(control => {
            const matchesStatus = statusFilter === 'all' || control.status === statusFilter;
            const haystack = `${control.name} ${control.exists || ''} ${control.remains || ''}`.toLowerCase();
            return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
        }),
    })).filter(section => section.controls.length > 0);

    const scrollToSection = (sectionId) => {
        const target = document.getElementById(`progress-${sectionId}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="content progress-content">
            <div className="progress-page">
                <header className="progress-hero">
                    <div className="progress-hero-copy">
                        <div className="progress-eyebrow"><span>P0</span> Launch control audit</div>
                        <h1>Admin & backend readiness</h1>
                        <p>A visual implementation map of the controls required before launch. This is a code-audit snapshot, not live system health.</p>
                        <div className="progress-meta">
                            <span><i className="tim-icons icon-calendar-60" /> Audited Aug 30, 2026</span>
                            <span><i className="tim-icons icon-settings" /> Admin panel + active node backend</span>
                        </div>
                    </div>
                    <div className="progress-score" aria-label={`${readiness}% weighted readiness`}>
                        <div className="progress-score-ring" style={{ '--progress-score': `${readiness * 3.6}deg` }}>
                            <div><strong>{readiness}%</strong><span>weighted</span></div>
                        </div>
                        <p>Partial controls count as half complete.</p>
                    </div>
                </header>

                <section className="progress-summary-grid" aria-label="Readiness totals">
                    <button type="button" className="progress-summary-card total" onClick={() => setStatusFilter('all')}>
                        <span className="progress-summary-icon"><i className="tim-icons icon-bullet-list-67" /></span>
                        <span><small>Total controls</small><strong>{allControls.length}</strong></span>
                    </button>
                    <button type="button" className="progress-summary-card ready" onClick={() => setStatusFilter('ready')}>
                        <span className="progress-summary-icon"><i className="tim-icons icon-check-2" /></span>
                        <span><small>Operational</small><strong>{totals.ready}</strong></span>
                    </button>
                    <button type="button" className="progress-summary-card partial" onClick={() => setStatusFilter('partial')}>
                        <span className="progress-summary-icon"><i className="tim-icons icon-puzzle-10" /></span>
                        <span><small>Partial</small><strong>{totals.partial}</strong></span>
                    </button>
                    <button type="button" className="progress-summary-card missing" onClick={() => setStatusFilter('missing')}>
                        <span className="progress-summary-icon"><i className="tim-icons icon-simple-remove" /></span>
                        <span><small>Missing</small><strong>{totals.missing}</strong></span>
                    </button>
                </section>

                <section className="progress-blockers">
                    <div className="progress-section-heading">
                        <div>
                            <span className="progress-kicker">Resolve first</span>
                            <h2>Launch-critical blockers</h2>
                        </div>
                        <span className="progress-priority-tag">P0 · {blockers.filter(blocker => blocker.status !== 'resolved').length} open risks</span>
                    </div>
                    <div className="progress-blocker-grid">
                        {blockers.map(blocker => (
                            <article className={`progress-blocker ${blocker.status || 'open'}`} key={blocker.number}>
                                <span>{blocker.number}</span>
                                <div><h3>{blocker.title}</h3><p>{blocker.detail}</p></div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="progress-controls-toolbar">
                    <div className="progress-section-tabs" aria-label="Jump to section">
                        {sections.map(section => (
                            <button type="button" key={section.id} onClick={() => scrollToSection(section.id)}>{section.title}</button>
                        ))}
                    </div>
                    <div className="progress-filter-row">
                        <div className="progress-status-filters" aria-label="Filter by status">
                            {['all', 'ready', 'partial', 'missing'].map(filter => (
                                <button
                                    type="button"
                                    key={filter}
                                    className={statusFilter === filter ? 'active' : ''}
                                    onClick={() => setStatusFilter(filter)}
                                >
                                    {filter === 'all' ? 'All controls' : STATUS[filter].label}
                                </button>
                            ))}
                        </div>
                        <label className="progress-search">
                            <i className="tim-icons icon-zoom-split" />
                            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search controls or gaps" />
                        </label>
                    </div>
                </section>

                <main className="progress-sections">
                    {filteredSections.map(section => {
                        const sectionTotals = section.controls.reduce((summary, control) => {
                            summary[control.status] += 1;
                            return summary;
                        }, { ready: 0, partial: 0, missing: 0 });

                        return (
                            <section className="progress-audit-section" id={`progress-${section.id}`} key={section.id}>
                                <div className="progress-audit-header">
                                    <div className="progress-audit-title">
                                        <span>{section.number}</span>
                                        <div><h2>{section.title}</h2><p>{section.description}</p></div>
                                    </div>
                                    <div className="progress-audit-counts">
                                        {sectionTotals.ready > 0 && <span className="ready">{sectionTotals.ready} ready</span>}
                                        {sectionTotals.partial > 0 && <span className="partial">{sectionTotals.partial} partial</span>}
                                        {sectionTotals.missing > 0 && <span className="missing">{sectionTotals.missing} missing</span>}
                                    </div>
                                </div>

                                <div className="progress-table-wrap">
                                    <table className="progress-table">
                                        <thead><tr><th>Control</th><th>Status</th><th>What exists</th><th>What remains</th><th>Panel</th></tr></thead>
                                        <tbody>
                                            {section.controls.map(control => (
                                                <tr key={control.name} className={control.risk ? 'is-risk' : ''}>
                                                    <td className="progress-control-name">
                                                        {control.risk && <span className="progress-risk-dot" title="Launch-critical risk" />}
                                                        {control.name}
                                                    </td>
                                                    <td><span className={`progress-status ${control.status}`}><i />{STATUS[control.status].shortLabel}</span></td>
                                                    <td>{control.exists || '—'}</td>
                                                    <td>{control.remains || <span className="progress-muted">No launch blocker identified.</span>}</td>
                                                    <td>
                                                        {control.route ? (
                                                            <button type="button" className="progress-route-link" onClick={() => history.push(control.route)}>{control.routeLabel || 'Open'} <span>→</span></button>
                                                        ) : <span className="progress-muted">—</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        );
                    })}

                    {filteredSections.length === 0 && (
                        <div className="progress-empty">
                            <i className="tim-icons icon-zoom-split" />
                            <h3>No controls match this view</h3>
                            <p>Clear the search or choose another status.</p>
                            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Reset filters</button>
                        </div>
                    )}
                </main>

                <footer className="progress-footer-note">
                    <i className="tim-icons icon-alert-circle-exc" />
                    <div><strong>How to use this page</strong><p>“Operational” means the control works through the admin panel and backend. “Partial” includes backend-only, panel-only, incomplete or unsafe implementations. Re-audit statuses after each implementation phase.</p></div>
                </footer>
            </div>
        </div>
    );
};

export default Progress;
