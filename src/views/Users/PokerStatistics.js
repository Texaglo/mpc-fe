import React, { useEffect, useState } from 'react';
import axios from 'axios';

const number = (value, suffix = '') => value === null || value === undefined ? 'Not available' : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
export default function PokerStatistics({ userId, onOpenHand }) {
    const [period, setPeriod] = useState('lifetime');
    const [balanceType, setBalanceType] = useState('CASH');
    const [network, setNetwork] = useState('mainnet-beta');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let active = true;
        setLoading(true); setData(null); setError('');
        const query = new URLSearchParams({ period, balanceType, network });
        axios.get(`/history/admin/users/${encodeURIComponent(userId)}/profile-statistics?${query}`)
            .then(response => { if (active) setData(response.data.body); })
            .catch(e => { if (active) setError(e.response?.data?.message || 'Unable to load poker statistics'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [userId, period, balanceType, network]);
    const stats = data?.statistics;
    const fields = [
        ['Total profit / loss', 'totalProfitLoss'], ['Hands played', 'handsPlayed'], ['Sessions', 'sessions'],
        ['Hours played', 'hoursPlayed'], ['Average active session (seconds)', 'averageSessionLengthSeconds'],
        ['Win rate (bb/100)', 'winRateBbPer100'], ['VPIP', 'vpipPercent', '%'], ['PFR', 'pfrPercent', '%'],
        ['3-bet', 'threeBetPercent', '%'], ['Aggression factor', 'aggressionFactor'], ['Showdown win', 'showdownWinPercent', '%'],
        ['Average pot', 'averagePotSize'], ['Biggest award won', 'biggestPotWon'], ['Hourly win rate', 'hourlyWinRate'],
    ];
    return <section className="profile-panel" aria-label="Poker statistics">
        <h5>Poker statistics</h5>
        <div className="profile-stat-filters">
            <label>Period <select aria-label="Statistics period" value={period} onChange={e => setPeriod(e.target.value)}><option value="lifetime">Lifetime</option><option value="month">This month</option><option value="week">This week</option></select></label>
            <label>Economy <select aria-label="Statistics economy" value={balanceType} onChange={e => setBalanceType(e.target.value)}><option value="CASH">Cash</option><option value="FP">Free Play</option><option value="TIME">Time</option></select></label>
            {balanceType === 'CASH' && <label>Network <select aria-label="Statistics network" value={network} onChange={e => setNetwork(e.target.value)}><option value="mainnet-beta">Mainnet</option><option value="devnet">Devnet (test funds)</option></select></label>}
        </div>
        {loading && <p role="status">Loading poker statistics…</p>}
        {error && <p role="alert">{error}</p>}
        {data && <>
            <p>Completed ring hands · {data.units} · UTC calendar periods. Hours count active hand time, with overlapping tables counted once.</p>
            {!stats ? <p>No completed hands for these filters.</p> : <>
                <div className="profile-balance-grid">{fields.map(([label, key, suffix]) => <article key={key} title={data.definitions?.[key]}><span>{label}</span><strong>{number(stats[key], suffix)}</strong></article>)}
                    <article><span>Favorite stakes</span><strong>{stats.favoriteStakes ? `${number(stats.favoriteStakes.smallBlind)} / ${number(stats.favoriteStakes.bigBlind)}` : 'Not available'}</strong></article>
                </div>
                <p>Coverage: {stats.handsPlayed} dealt hands; {stats.handsWithCompleteActions} complete action histories; {stats.netChipsKnownHands} known results; {stats.timingKnownHands} timed hands; {stats.threeBetOpportunities} 3-bet opportunities. Rates use their available samples.</p>
            </>}
            {!!data.coverage?.missingNetworkHands && <p role="status">{data.coverage.missingNetworkHands} older cash hands lack a recorded network and are excluded.</p>}
            <div className="profile-balance-grid">{[
                ['Available wallet balance (excludes seated chips)', 'availableBalance'], ['Lifetime hand profit / loss', 'lifetimeProfitLoss'],
                ['This month hand profit / loss', 'monthProfitLoss'], ...(balanceType === 'CASH' ? [['Completed withdrawals (USD)', 'totalWithdrawnUsd']] : []),
            ].map(([label, key]) => <article key={key}><span>{label}</span><strong>{number(data.bankroll?.[key])}</strong></article>)}</div>
            <h5>Recent completed hands</h5>
            {(data.recentHands || []).map(hand => <div className="profile-record" key={hand.handId}>
                <strong>{hand.tableName || hand.tableId} · {hand.result}</strong>
                <span>{number(hand.smallBlind)} / {number(hand.bigBlind)} · Pot {number(hand.pot)} · Award {number(hand.awardedAmount)} · Net {number(hand.netProfitLoss)}</span>
                <small>{new Date(hand.completedAt).toLocaleString()}</small>
                <button className="profile-btn" onClick={() => onOpenHand(hand.handId)}>Review hand {hand.handId}</button>
            </div>)}
            <details><summary>Calculation definitions</summary>{Object.entries(data.definitions || {}).map(([key, value]) => <p key={key}><strong>{key}: </strong>{value}</p>)}</details>
        </>}
    </section>;
}
