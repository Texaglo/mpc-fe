import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import { useDispatch } from 'react-redux';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { setLoader } from '../../store/actions/Auth';
import './index.css';

const EMPTY_PAGINATION = { page: 1, limit: 25, total: 0, totalPages: 1 };
const EMPTY_FILTERS = { tableId: '', gameId: '', userId: '', search: '', status: 'all', economy: 'all' };
const STREET_ORDER = ['preflop', 'flop', 'turn', 'river', 'showdown'];

const unwrapError = error => error?.response?.data?.message || error?.message || 'Request failed';
const formatNumber = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
const formatDate = value => value ? new Date(value).toLocaleString() : '—';
const responseBody = response => response?.data?.body || {};
const normalizeStreet = value => String(value || 'preflop').toLowerCase();

const getEconomy = hand => String(
    hand?.economy || hand?.economyType || hand?.balanceType || hand?.currencyType || ''
).toUpperCase();

const getParticipants = hand => Array.isArray(hand?.participants) ? hand.participants : [];
const getBoard = hand => hand?.finalCommunityCards?.length
    ? hand.finalCommunityCards
    : (hand?.currentCommunityCards || []);

const getWinners = hand => {
    if (Array.isArray(hand?.winners) && hand.winners.length) return hand.winners;
    return getParticipants(hand).filter(participant => participant.isWinner);
};

const winnerName = winner => winner?.username || winner?.playerName || winner?.name
    || (winner?.playerId !== undefined ? `Player ${winner.playerId}` : 'Winner');

const movementLabel = movement => String(
    movement.currentAction || movement.action || movement.eventType || 'Event'
).replaceAll('_', ' ');

const normalizePagination = body => {
    const source = body?.pagination || {};
    return {
        page: Number(source.page || source.currentPage || 1),
        limit: Number(source.limit || 25),
        total: Number(source.total ?? source.totalHands ?? 0),
        totalPages: Math.max(1, Number(source.totalPages || 1)),
    };
};

const parseCard = value => {
    const original = String(value || '').trim().toUpperCase();
    if (!original) return null;
    const suitSymbols = { S: '♠', H: '♥', D: '♦', C: '♣', '♠': '♠', '♥': '♥', '♦': '♦', '♣': '♣' };
    const compact = original.replace(/[^0-9AJQKSCHD♠♥♦♣]/g, '');
    const pieces = original.split(/[_\-\s]+/).filter(Boolean);
    let rank = '';
    let suit = '';

    if (pieces.length >= 2) {
        if (suitSymbols[pieces[0]]) {
            suit = suitSymbols[pieces[0]];
            rank = pieces[1];
        } else {
            rank = pieces[0];
            suit = suitSymbols[pieces[1]] || pieces[1];
        }
    } else {
        const first = compact.charAt(0);
        const last = compact.charAt(compact.length - 1);
        if (suitSymbols[first]) {
            suit = suitSymbols[first];
            rank = compact.slice(1);
        } else if (suitSymbols[last]) {
            rank = compact.slice(0, -1);
            suit = suitSymbols[last];
        } else {
            rank = compact || original;
        }
    }

    return { rank: rank === 'T' ? '10' : rank, suit, red: suit === '♥' || suit === '♦', original };
};

const PlayingCard = ({ value, compact = false }) => {
    const card = parseCard(value);
    if (!card) return null;
    return <span className={`playing-card ${card.red ? 'red' : 'black'} ${compact ? 'compact' : ''}`} title={card.original}>
        <strong>{card.rank}</strong><i>{card.suit}</i>
    </span>;
};

const CardRow = ({ cards = [], compact = false, emptyLabel = 'Not available' }) => (
    <div className="hand-card-row">
        {cards.length
            ? cards.map((card, index) => <PlayingCard key={`${card}-${index}`} value={card} compact={compact} />)
            : <small>{emptyLabel}</small>}
    </div>
);

const BoardStages = ({ cards = [] }) => {
    const stages = [
        { label: 'Flop', cards: cards.slice(0, 3) },
        { label: 'Turn', cards: cards.slice(3, 4) },
        { label: 'River', cards: cards.slice(4, 5) },
    ];
    return <div className="hand-board-stages">
        {stages.map(stage => <div key={stage.label} className="hand-board-stage">
            <span>{stage.label}</span>
            <CardRow cards={stage.cards} emptyLabel="—" />
        </div>)}
    </div>;
};

const latestBoardForRound = (round, fallback = []) => {
    const movements = round?.movements || [];
    for (let index = movements.length - 1; index >= 0; index -= 1) {
        if (movements[index]?.currentCommunityCards?.length) return movements[index].currentCommunityCards;
    }
    const street = normalizeStreet(round?.street);
    if (street === 'flop') return fallback.slice(0, 3);
    if (street === 'turn') return fallback.slice(0, 4);
    if (street === 'river' || street === 'showdown') return fallback.slice(0, 5);
    return [];
};

const HandHistory = () => {
    const dispatch = useDispatch();
    const [hands, setHands] = useState([]);
    const [pagination, setPagination] = useState(EMPTY_PAGINATION);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadHands = useCallback(async (page = 1, showLoader = true) => {
        if (showLoader) dispatch(setLoader(true));
        try {
            const params = new URLSearchParams({ page: String(page), limit: '25' });
            ['tableId', 'gameId', 'userId', 'search'].forEach(key => {
                const value = String(appliedFilters[key] || '').trim();
                if (value) params.set(key, value);
            });
            if (appliedFilters.status !== 'all') params.set('status', appliedFilters.status);
            if (appliedFilters.economy !== 'all') params.set('economy', appliedFilters.economy);
            const response = await axios.get(`/history/admin/hands?${params.toString()}`);
            const body = responseBody(response);
            setHands(Array.isArray(body) ? body : (body.hands || body.items || []));
            setPagination(normalizePagination(body));
        } catch (error) {
            EventBus.publish('error', unwrapError(error));
        } finally {
            if (showLoader) dispatch(setLoader(false));
        }
    }, [appliedFilters, dispatch]);

    useEffect(() => {
        loadHands(1);
    }, [loadHands, refreshKey]);

    const openHand = async hand => {
        setSelected(hand);
        setDetail(null);
        setDetailLoading(true);
        try {
            const response = await axios.get(`/history/admin/hands/${encodeURIComponent(hand.handId || hand._id)}`);
            setDetail(responseBody(response));
        } catch (error) {
            EventBus.publish('error', unwrapError(error));
        } finally {
            setDetailLoading(false);
        }
    };

    const closeHand = () => {
        setSelected(null);
        setDetail(null);
        setDetailLoading(false);
    };

    const submitSearch = event => {
        event.preventDefault();
        setAppliedFilters({ ...filters });
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
    };

    const exportHand = async () => {
        const hand = detail?.hand || selected;
        if (!hand || hand.status !== 'COMPLETED') return;
        dispatch(setLoader(true));
        try {
            const response = await axios.get(`/history/admin/hands/${encodeURIComponent(hand.handId || hand._id)}/export`, { responseType: 'blob' });
            const disposition = response.headers?.['content-disposition'] || '';
            const serverFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
            const filename = serverFilename || `hand-${String(hand.handId || hand._id || 'history').replace(/[^a-z0-9._-]/gi, '_')}.json`;
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            EventBus.publish('error', unwrapError(error));
        } finally {
            dispatch(setLoader(false));
        }
    };

    const selectedHand = detail?.hand || selected;
    const movements = useMemo(() => detail?.movements || [], [detail]);
    const rounds = useMemo(() => {
        const provided = Array.isArray(detail?.rounds) ? detail.rounds : [];
        if (provided.length) return [...provided].sort((a, b) => {
            const streetDelta = STREET_ORDER.indexOf(normalizeStreet(a.street)) - STREET_ORDER.indexOf(normalizeStreet(b.street));
            return streetDelta || Number(a.roundNumber || 0) - Number(b.roundNumber || 0);
        });
        const grouped = new Map();
        movements.forEach(movement => {
            const street = normalizeStreet(movement.street);
            if (!grouped.has(street)) grouped.set(street, { street, movements: [] });
            grouped.get(street).movements.push(movement);
        });
        return [...grouped.values()];
    }, [detail, movements]);

    const finalBoard = getBoard(selectedHand || {});

    return (
        <div className="content hand-history-content">
            <div className="main-container hand-history-page">
                <header className="hand-history-header">
                    <div>
                        <span className="hand-history-eyebrow">Backend-authoritative records</span>
                        <h2>Hand History</h2>
                        <p>Find a table, narrow to a game, then inspect every hand and player action.</p>
                    </div>
                    <button type="button" className="hand-refresh-button" onClick={() => setRefreshKey(key => key + 1)}>Refresh</button>
                </header>

                <form className="hand-history-filters" onSubmit={submitSearch}>
                    <div className="hand-hierarchy-label"><strong>Search path</strong><span>Table → game → player</span></div>
                    <label><span>1. Table ID</span><input value={filters.tableId} onChange={event => setFilters(current => ({ ...current, tableId: event.target.value }))} placeholder="Mongo table ID" /></label>
                    <label><span>2. Game / session ID</span><input value={filters.gameId} onChange={event => setFilters(current => ({ ...current, gameId: event.target.value }))} placeholder="Game ID" /></label>
                    <label><span>3. Player user ID</span><input value={filters.userId} onChange={event => setFilters(current => ({ ...current, userId: event.target.value }))} placeholder="User ID" /></label>
                    <label className="hand-search-field"><span>Quick search</span><input type="search" value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} placeholder="Hand ID, table name, username, email or wallet" /></label>
                    <label><span>Status</span><select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}><option value="all">All statuses</option><option value="COMPLETED">Completed</option><option value="IN_PROGRESS">In progress</option><option value="ABANDONED">Abandoned</option></select></label>
                    <label><span>Economy</span><select value={filters.economy} onChange={event => setFilters(current => ({ ...current, economy: event.target.value }))}><option value="all">All economies</option><option value="CASH">Cash</option><option value="TIME">Time</option><option value="FP">Free Play</option></select></label>
                    <button type="submit" className="hand-search-button">Search hands</button>
                    <button type="button" className="hand-clear-button" onClick={clearFilters}>Clear</button>
                </form>

                <div className="hand-history-summary">
                    <span><strong>{formatNumber(pagination.total)}</strong> matching hands</span>
                    <small>Hole cards remain hidden for live hands and release only after backend completion.</small>
                </div>

                <div className="hand-history-table-wrap">
                    <table className="hand-history-table">
                        <thead><tr><th>Hand / time</th><th>Table</th><th>Game</th><th>Economy</th><th>Stakes</th><th>Board</th><th>Players</th><th>Pot</th><th>Winner</th><th>Status</th><th /></tr></thead>
                        <tbody>
                            {hands.map(hand => {
                                const winners = getWinners(hand);
                                const economy = getEconomy(hand);
                                return <tr key={hand.handId || hand._id}>
                                    <td><strong className="hand-id" title={hand.handId}>{hand.handId || hand._id || '—'}</strong><small>{formatDate(hand.startedAt || hand.createdAt)}</small></td>
                                    <td><strong>{hand.tableName || 'Unnamed table'}</strong><small title={hand.tableId}>{hand.tableId || '—'}</small></td>
                                    <td><strong>{hand.gameType || 'Poker'}</strong><small title={hand.gameId}>Session {hand.gameId || '—'} · Hand {hand.handNumber ?? '—'}</small></td>
                                    <td><span className={`hand-economy ${economy.toLowerCase()}`}>{economy || 'Not recorded'}</span></td>
                                    <td>{formatNumber(hand.smallBlindAmount)} / {formatNumber(hand.bigBlindAmount)}</td>
                                    <td><CardRow cards={getBoard(hand)} compact emptyLabel="—" /></td>
                                    <td>{getParticipants(hand).length}</td>
                                    <td>{formatNumber(hand.finalPot ?? hand.currentPot)}</td>
                                    <td>{winners.length ? winners.map(winnerName).join(', ') : '—'}</td>
                                    <td><span className={`hand-status ${String(hand.status || '').toLowerCase()}`}>{String(hand.status || 'Unknown').replaceAll('_', ' ')}</span></td>
                                    <td><button type="button" className="hand-view-button" onClick={() => openHand(hand)}>Inspect</button></td>
                                </tr>;
                            })}
                            {!hands.length && <tr><td className="hand-history-empty" colSpan="11">No hand records match these filters.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="hand-history-pagination">
                    <button type="button" disabled={pagination.page <= 1} onClick={() => loadHands(pagination.page - 1)}>Previous</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadHands(pagination.page + 1)}>Next</button>
                </div>
            </div>

            <Modal isOpen={Boolean(selected)} toggle={closeHand} className="main-modal hand-detail-modal" size="xl">
                <ModalHeader toggle={closeHand}><div className="modal-title"><p>Hand reconstruction</p></div></ModalHeader>
                <ModalBody className="hand-detail-body">
                    {detailLoading && <div className="hand-detail-loading">Loading authoritative timeline…</div>}
                    {!detailLoading && selectedHand && <>
                        <section className="hand-detail-hero">
                            <div><small>Hand ID</small><strong>{selectedHand.handId || selectedHand._id}</strong><span>{selectedHand.tableName || 'Unnamed table'} · Game {selectedHand.gameId || '—'} · Hand {selectedHand.handNumber ?? '—'}</span></div>
                            <div className="hand-detail-actions"><span className={`hand-status ${String(selectedHand.status || '').toLowerCase()}`}>{String(selectedHand.status || '').replaceAll('_', ' ')}</span><button type="button" disabled={selectedHand.status !== 'COMPLETED' || !detail} onClick={exportHand} title={selectedHand.status === 'COMPLETED' ? 'Download a backend evidence package' : 'Exports are available after completion'}>Export evidence</button></div>
                        </section>

                        <section className="hand-detail-grid">
                            <article><span>Started</span><strong>{formatDate(selectedHand.startedAt || selectedHand.createdAt)}</strong></article>
                            <article><span>Completed</span><strong>{formatDate(selectedHand.completedAt)}</strong></article>
                            <article><span>Stakes</span><strong>{formatNumber(selectedHand.smallBlindAmount)} / {formatNumber(selectedHand.bigBlindAmount)}</strong></article>
                            <article className="featured"><span>Final pot</span><strong>{formatNumber(selectedHand.finalPot ?? selectedHand.currentPot)} {getEconomy(selectedHand)}</strong></article>
                            <article><span>Actions</span><strong>{formatNumber(selectedHand.actionCount || movements.length)}</strong></article>
                            <article><span>Economy</span><strong>{getEconomy(selectedHand) || 'Not recorded'}</strong></article>
                        </section>

                        <section className="hand-detail-section hand-board-section"><div><h4>Community cards</h4><p>Authoritative board by street</p></div><BoardStages cards={finalBoard} /></section>

                        <section className="hand-detail-section">
                            <div className="hand-detail-section-title"><div><h4>Players, hole cards & settlement</h4><p>Private cards appear only after backend completion.</p></div></div>
                            <div className="hand-player-cards">
                                {getParticipants(selectedHand).map(participant => <article className={participant.isWinner ? 'winner' : ''} key={`${participant.playerId}-${participant.seatNumber}`}>
                                    <header><div><strong>{participant.username || `Player ${participant.playerId}`}</strong><small>Seat {Number(participant.seatNumber) + 1}</small></div>{participant.isWinner && <span>Winner</span>}</header>
                                    <CardRow cards={participant.pocketCards || []} emptyLabel={selectedHand.status === 'COMPLETED' ? 'Not recorded' : 'Hidden until complete'} />
                                    <dl><div><dt>User ID</dt><dd title={participant.userId}>{participant.userId || '—'}</dd></div><div><dt>Stack</dt><dd>{formatNumber(participant.startingStack)} → {formatNumber(participant.endingStack)}</dd></div><div><dt>Final hand</dt><dd>{participant.finalHand?.name || participant.finalHand?.handName || participant.finalHand?.rank || '—'}</dd></div><div><dt>Outcome</dt><dd>{participant.isWinner ? `Won ${formatNumber(participant.prize)}` : (participant.folded ? 'Folded' : '—')}</dd></div></dl>
                                </article>)}
                            </div>
                        </section>

                        <section className="hand-detail-section">
                            <div className="hand-detail-section-title"><div><h4>Pot settlement</h4><p>Main pot, side pots, unmatched chips and refunds.</p></div></div>
                            <div className="hand-pot-grid"><article><span>Winners</span><strong>{getWinners(selectedHand).length ? getWinners(selectedHand).map(winner => `${winnerName(winner)}${winner.prize !== undefined ? ` · ${formatNumber(winner.prize)}` : ''}`).join(', ') : '—'}</strong></article><article><span>Side pots</span><strong>{selectedHand.sidePots?.length ? selectedHand.sidePots.map((pot, index) => `#${index + 1} ${formatNumber(pot.amount ?? pot.pot ?? pot)}`).join(' · ') : 'None'}</strong></article><article><span>Refunds</span><strong>{selectedHand.sidePotRefunds?.length ? selectedHand.sidePotRefunds.map(refund => `${refund.username || refund.playerId}: ${formatNumber(refund.amount ?? refund)}`).join(' · ') : 'None'}</strong></article></div>
                        </section>

                        <section className="hand-detail-section">
                            <div className="hand-detail-section-title"><div><h4>Action by street</h4><p>Strict backend sequence with the board and pot state at each stage.</p></div></div>
                            <div className="hand-rounds">
                                {rounds.map((round, roundIndex) => {
                                    const roundBoard = latestBoardForRound(round, finalBoard);
                                    const roundMovements = round.movements || [];
                                    const finalMovement = roundMovements[roundMovements.length - 1] || {};
                                    return <article className="hand-round" key={`${round.street}-${round.roundNumber ?? roundIndex}`}>
                                        <header><div><h5>{normalizeStreet(round.street).toUpperCase()}</h5><CardRow cards={roundBoard} compact emptyLabel="No board cards" /></div><strong>Pot {formatNumber(finalMovement.currentPot)}</strong></header>
                                        <div className="hand-movement-list">{roundMovements.map(movement => <div className="hand-movement" key={movement._id || movement.eventKey || movement.sequence}><span className="hand-sequence">#{movement.sequence}</span><div><strong>{movement.username || (movement.playerId !== null && movement.playerId !== undefined ? `Player ${movement.playerId}` : 'Table')}</strong><small>{movementLabel(movement)}{movement.isAutomatic ? ' · automatic' : ''}</small></div><span className="hand-amount">{Number(movement.amountCommitted || movement.requestedAmount || 0) ? formatNumber(movement.amountCommitted || movement.requestedAmount) : '—'}</span><span className="hand-pot">Pot {formatNumber(movement.currentPot)}</span><time>{movement.timeStamp ? new Date(movement.timeStamp).toLocaleTimeString() : '—'}</time></div>)}</div>
                                    </article>;
                                })}
                                {!rounds.length && <div className="hand-history-empty">No action movements were recorded.</div>}
                            </div>
                        </section>
                    </>}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default HandHistory;
