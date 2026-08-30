import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React from 'react';
import { setLoader } from '../../store/actions/Auth';
import { getPlayersLeaderboard } from '../../store/actions/Leaderboard';

const firstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
const numberOrNull = value => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const formatNumber = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const leaderboardRows = payload => {
    const responseEconomy = !Array.isArray(payload) ? payload?.economy : '';
    const source = Array.isArray(payload)
        ? payload
        : (payload?.players || payload?.leaderboard || payload?.entries || payload?.results || payload?.data || []);
    if (!Array.isArray(source)) return [];

    return source.map((entry, index) => {
        const user = entry.user || entry.userId || {};
        const handsPlayed = numberOrNull(firstValue(entry.handsPlayed, entry.totalHands, entry.handCount));
        const handsWon = numberOrNull(firstValue(entry.handsWon, entry.wins, entry.wonHands));
        const handsLost = numberOrNull(firstValue(entry.handsLost, entry.losses, entry.lostHands,
            handsPlayed !== null && handsWon !== null ? Math.max(0, handsPlayed - handsWon) : null));
        const netWon = numberOrNull(firstValue(entry.netWon, entry.netProfit, entry.cashWon, entry.totalWon, entry.earnings));
        const timePlayedMinutes = numberOrNull(firstValue(
            entry.timePlayedMinutes,
            entry.minutesPlayed,
            entry.timePlayed,
            entry.timePlayedSeconds !== undefined ? Number(entry.timePlayedSeconds) / 60 : null
        ));
        const explicitRatio = numberOrNull(firstValue(entry.winLossRatio, entry.winRate));
        const winLossRatio = explicitRatio !== null
            ? explicitRatio
            : (handsWon !== null && handsLost !== null ? (handsLost > 0 ? handsWon / handsLost : handsWon) : null);

        return {
            ...entry,
            _rank: numberOrNull(entry.rank) || index + 1,
            username: entry.username || entry.playerName || user.username || user.email || user._id || 'Unknown player',
            faction: entry.faction || user.faction || '—',
            economy: String(firstValue(entry.economy, entry.balanceType, entry.currencyType, entry.mode, responseEconomy, '')).toUpperCase(),
            handsPlayed,
            handsWon,
            handsLost,
            netWon,
            timePlayedMinutes,
            winLossRatio,
            legacyScore: numberOrNull(entry.score),
        };
    });
};

const formatTime = minutes => {
    if (minutes === null) return '—';
    const total = Math.max(0, Number(minutes || 0));
    const hours = Math.floor(total / 60);
    const remaining = Math.round(total % 60);
    return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
};

class Leaderboard extends React.Component {
    state = {
        selectedPeriod: 'all',
            selectedEconomy: 'CASH',
        selectedMetric: 'handsWon',
    };

    componentDidMount() {
        this.fetchLeaderboard();
    }

    fetchLeaderboard = () => {
        const { selectedPeriod, selectedEconomy, selectedMetric } = this.state;
        this.props.setLoader(true);
        this.props.getPlayersLeaderboard({
            period: selectedPeriod,
            economy: selectedEconomy,
            metric: selectedMetric,
        });
    };

    changeFilter = (key, value) => {
        this.setState({ [key]: value }, this.fetchLeaderboard);
    };

    render() {
        const { selectedPeriod, selectedEconomy, selectedMetric } = this.state;
        const normalized = leaderboardRows(this.props.playersLeaderboard);
        const hasLegacyScore = normalized.some(row => row.legacyScore !== null);
        const metricValue = row => numberOrNull(row[selectedMetric]);
        const hasSelectedMetric = normalized.some(row => metricValue(row) !== null);
        const rows = hasSelectedMetric
            ? normalized.slice().sort((left, right) => (metricValue(right) || 0) - (metricValue(left) || 0))
            : normalized;

        const columns = [
            {
                Header: '#',
                Cell: ({ index, original }) => original._rank || index + 1,
                width: 54,
                filterable: false,
            },
            {
                accessor: 'username',
                Header: 'Player',
                minWidth: 150,
                Cell: ({ value, original }) => <div className="leaderboard-player"><strong>{value}</strong><small>{original.economy || 'All economies'}</small></div>,
                filterMethod: (filter, row) => String(row[filter.id] || '').toLowerCase().includes(String(filter.value || '').toLowerCase()),
            },
            {
                accessor: 'handsPlayed',
                Header: 'Hands Played',
                width: 105,
                Cell: ({ value }) => value === null ? '—' : formatNumber(value),
            },
            {
                accessor: 'handsWon',
                Header: 'Hands Won',
                width: 95,
                Cell: ({ value }) => value === null ? '—' : formatNumber(value),
            },
            {
                accessor: 'netWon',
                Header: 'Net Won',
                width: 110,
                Cell: ({ value, original }) => value === null ? '—' : <span className={Number(value) >= 0 ? 'leaderboard-positive' : 'leaderboard-negative'}>{Number(value) > 0 ? '+' : ''}{formatNumber(value)} {original.economy}</span>,
            },
            {
                accessor: 'timePlayedMinutes',
                Header: 'Time Played',
                width: 110,
                Cell: ({ value }) => formatTime(value),
            },
            {
                accessor: 'winLossRatio',
                Header: 'W / L',
                width: 120,
                Cell: ({ value, original }) => value === null ? '—' : <div className="leaderboard-ratio"><strong>{original.handsWon ?? '—'} / {original.handsLost ?? '—'}</strong><small>{formatNumber(value)} ratio</small></div>,
            },
        ];

        if (hasLegacyScore) columns.push({
            accessor: 'legacyScore',
            Header: 'Legacy Score',
            width: 105,
            Cell: ({ value }) => value === null ? '—' : formatNumber(value),
        });

        return (
            <div className="content">
                <div className="main-container player-scores performance-leaderboard">
                    <div className="leaderboard-heading-row">
                        <div>
                            <span className="leaderboard-eyebrow">Hand performance</span>
                            <p className="main-container-heading">Players Leaderboard</p>
                            <small>Ranks richer hand statistics when supplied, while preserving legacy score responses.</small>
                        </div>
                        <div className="leaderboard-filter-grid">
                            <label>Period<select value={selectedPeriod} onChange={event => this.changeFilter('selectedPeriod', event.target.value)}><option value="all">All Time</option><option value="month">This Month</option><option value="week">This Week</option></select></label>
                            <label>Economy<select value={selectedEconomy} onChange={event => this.changeFilter('selectedEconomy', event.target.value)}><option value="CASH">Cash</option><option value="FP">Free Play</option></select></label>
                            <label>Rank by<select value={selectedMetric} onChange={event => this.changeFilter('selectedMetric', event.target.value)}><option value="handsWon">Hands won</option><option value="netWon">Net won</option><option value="timePlayedMinutes">Time played</option><option value="winLossRatio">Win / loss ratio</option></select></label>
                        </div>
                    </div>
                    {!hasSelectedMetric && rows.length > 0 && <div className="leaderboard-compat-note">This backend returned the legacy leaderboard. Hand-performance columns will populate automatically when richer statistics are available.</div>}
                    <ReactTable
                        minRows={Math.min(12, Math.max(5, rows.length))}
                        className="table"
                        data={rows}
                        resolveData={data => data.map(row => row)}
                        columns={columns}
                        filterable
                        defaultPageSize={20}
                    />
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = { getPlayersLeaderboard, setLoader };
const mapStateToProps = ({ Leaderboard: leaderboardState }) => ({
    playersLeaderboard: leaderboardState.playersLeaderboard,
});

export { leaderboardRows };
export default connect(mapStateToProps, mapDispatchToProps)(Leaderboard);
