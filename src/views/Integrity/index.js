import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { canAccess } from '../../utils/adminAccess';
import '../Users/index.css';
import './index.css';
import IntegrityControls from './Controls';
import Evidence from './Evidence';
import PlayerAnalysis from './PlayerAnalysis';

const title = value => String(value || '').replace(/_/g, ' ');
export function Integrity({ role, permissions, location }) {
    const initialUser = new URLSearchParams(location?.search || '').get('player') || '';
    const playerRequest = useRef(0);
    useEffect(() => () => { playerRequest.current++; }, []);
    const [tab, setTab] = useState('alerts');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [filter, setFilter] = useState(initialUser);
    const [userId, setUserId] = useState(initialUser);
    const [player, setPlayer] = useState(null);
    const [reason, setReason] = useState('');
    const [otherUser, setOtherUser] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [overview, setOverview] = useState(null);
    const manage = canAccess({ role, permissions }, 'integrity.manage');
    const canReadHands = canAccess({role,permissions}, 'hand_history.view');
    const hold = manage && canAccess({ role, permissions }, 'withdrawals.manage');
    const failure = e => setError(e.response?.data?.message || e.message);
    const refresh = useCallback(async () => {
        const [list, summary] = await Promise.all([
            axios.get(`/integrity/${tab}?limit=30&offset=${offset}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`),
            axios.get('/integrity/overview'),
        ]);
        setItems(list.data.body.items); setTotal(list.data.body.total); setOverview(summary.data.body);
    }, [tab, offset, userId]);
    useEffect(() => { let active = true; const load = () => refresh().catch(e => active && failure(e)); load(); const timer = setInterval(load, 30000); return () => { active = false; clearInterval(timer); }; }, [refresh]);
    const selectPlayer = useCallback(async id => {
        const request = ++playerRequest.current;
        setError(''); setUserId(id); setFilter(id); setOffset(0); setPlayer(null);
        if (!id) return;
        try { const result = await axios.get(`/integrity/players/${encodeURIComponent(id)}`); if (request === playerRequest.current) setPlayer(result.data.body); } catch (e) { if (request === playerRequest.current) failure(e); }
    }, []);
    useEffect(() => { if (initialUser) selectPlayer(initialUser); }, [initialUser, selectPlayer]);
    const act = async (path, body, needsReason = true) => {
        if (needsReason && reason.trim().length < 3) { setError('Enter an audit reason before making changes.'); return; }
        setBusy(true); setError('');
        try {
            await axios.post(`/integrity/${path}`, { ...body, reason });
            setReason(''); await refresh(); if (userId) await selectPlayer(userId);
        } catch (e) { failure(e); } finally { setBusy(false); }
    };
    return <div className="content"><main className="main-container users-container integrity-page">
        <div className="main-container-head"><h2 className="main-container-heading">Player integrity</h2>
            <div className="integrity-actions"><button className="add-btn" disabled={busy} onClick={() => refresh().catch(failure)}>Refresh</button>
                {manage && <button className="add-btn" disabled={busy} onClick={() => act('scan', {}, false)}>Analyze recent hands</button>}</div></div>
        <p className="integrity-help">Alerts are evidence for review, not proof of cheating. Shared networks never trigger an automatic ban. Solvers and outside action recommendations are prohibited during play.</p>
        {overview && <div className="users-stats"><span className="stat-item"><span className="stat-label">Open alerts</span><strong className="stat-value">{overview.openAlerts}</strong></span><span className="stat-item"><span className="stat-label">Open reports</span><strong className="stat-value">{overview.openReports}</strong></span></div>}
        {overview?.health && <section className="integrity-card" aria-label="Collection health"><h3>Collection health</h3>
            <p>Automatic scanner: {overview.health.scannerRunning ? (overview.health.scanFresh ? 'Running · recent scan completed' : 'Running · awaiting a recent successful scan') : 'Stopped on this backend process'}</p>
            <p>Last scan: {overview.health.lastScanAt ? new Date(overview.health.lastScanAt).toLocaleString() : 'No scan since startup'} · Last action: {overview.health.lastActionAt ? new Date(overview.health.lastActionAt).toLocaleString() : 'No action observed since startup'}</p>
            <details><summary>Protection coverage and limits</summary>{(overview.capabilities || []).map(c => <p key={c.number}><strong>{c.number}. {c.name} — {c.status}.</strong> {c.detail}</p>)}</details>
        </section>}
        <IntegrityControls role={role} permissions={permissions} />
        {overview?.health?.failedWrites > 0 && <p role="alert" className="integrity-error">Evidence collection needs attention: {overview.health.failedWrites} failed operations since startup. Check backend logs.</p>}
        {error && <div role="alert" className="integrity-error">{error}</div>}
        <form className="integrity-actions" onSubmit={e => { e.preventDefault(); selectPlayer(filter.trim()); }}><label>Player ID<input className="search-input" value={filter} onChange={e => setFilter(e.target.value)} /></label><button className="add-btn">Open player</button><button type="button" className="add-btn" onClick={() => selectPlayer('')}>All players</button></form>
        {manage && <label className="integrity-reason">Audit reason<input className="search-input" value={reason} maxLength={2000} onChange={e => setReason(e.target.value)} /></label>}
        {player && <section className="integrity-card" aria-label="Player controls"><h3>Player controls</h3>
            <p>{userId} · {player.identity?.deviceAvailable ? 'Device hint available (not verified identity)' : 'No device identifier supplied by client'}</p>
            <p>Last observed: {player.identity?.lastSeen ? new Date(player.identity.lastSeen).toLocaleString() : 'No observations yet'}</p>
            <fieldset disabled={busy || !manage}>
                <label><input type="checkbox" checked={Boolean(player.profile.cashSuspended)} onChange={e => setPlayer({ ...player, profile: { ...player.profile, cashSuspended: e.target.checked } })} /> Suspend new cash-table entries</label>
                <label><input type="checkbox" checked={Boolean(player.profile.tournamentsSuspended)} onChange={e => setPlayer({ ...player, profile: { ...player.profile, tournamentsSuspended: e.target.checked } })} /> Suspend new tournament entries</label>
                <label>Internal note<textarea className="search-input" value={player.profile.note || ''} maxLength={4000} onChange={e => setPlayer({ ...player, profile: { ...player.profile, note: e.target.value } })} /></label>
                <button className="add-btn" onClick={() => act(`players/${userId}`, player.profile)}>Save controls</button>
                <p className="integrity-help">Existing hands continue normally. Full account suspension and session revocation remain in User Management.</p>
                <label>Other account ID<input className="search-input" value={otherUser} onChange={e => setOtherUser(e.target.value)} /></label>
                <button className="add-btn" disabled={!otherUser} onClick={() => act('links', { userId, otherUserId: otherUser, confirmed: true })}>Confirm same owner</button>
                {(player.links || []).map(link => <div className="integrity-row" key={link._id}><span>{link.users.join(' ↔ ')} · {link.confirmed ? 'Confirmed link' : 'Link cleared'}</span>{link.confirmed && <button className="add-btn" onClick={() => act('links', { userId, otherUserId: link.users.find(x => x !== userId), confirmed: false })}>Clear link</button>}</div>)}
            </fieldset>
            <h4>60-minute return-stack requirements</h4>
            {!(player.returnFloors || []).length && <p>No active return-stack requirements.</p>}
            {(player.returnFloors || []).map((r, i) => <p key={i}>{r.tableName}: at least {r.amount} {r.balanceType} on return until {new Date(r.until).toLocaleString()}</p>)}
            <h4>Pending withdrawals</h4>
            {!player.withdrawals.length && <p>No pending withdrawals.</p>}
            {player.withdrawals.map(w => <div className="integrity-row" key={w._id}><span>{w.paidAmount} {w.asset} · {w.integrityHold ? 'Held for review' : 'Awaiting approval'} {w.integrityHoldReason}</span>{hold && <button className="add-btn" disabled={busy || w.payoutProcessing} onClick={() => act(`withdrawals/${w._id}/hold`, { hold: !w.integrityHold })}>{w.integrityHold ? 'Release review hold' : 'Hold for review'}</button>}</div>)}
        </section>}
        {userId && <PlayerAnalysis key={userId} userId={userId} manage={manage} canReadHands={canReadHands} />}
        <nav className="integrity-tabs" aria-label="Integrity records">{['alerts', 'reports', 'events', 'audit'].map(name => <button key={name} aria-pressed={tab === name} className="add-btn" onClick={() => { setTab(name); setOffset(0); }}>{title(name)}</button>)}</nav>
        <section className="integrity-card" aria-label="Integrity records list">
            {!items.length && <p>No {tab} found.</p>}
            {items.map(item => <article className="integrity-record" key={item._id}>
                <div className="integrity-row"><h3>{item.evidence?.presentation?.title || title(item.rule || item.category || item.action || item.kind)}</h3><span className="kyc-badge pending">{item.status || 'Recorded'}</span></div>
                <p>{new Date(item.createdAt || item.at).toLocaleString()} {item.handId && `· Hand ${item.handId}`} {item.tableId && `· Table ${item.tableId}`}</p>
                <div className="integrity-actions">{(item.users || [item.subjectId || item.userId].filter(Boolean)).map(id => <button className="integrity-player" key={id} onClick={() => selectPlayer(id)}>{item.playerDetails?.find(p=>p.id===id)?.name || id}</button>)}</div>
                {item.testOnly && <p>Test bot evidence — QA activity</p>}{!item.testOnly && item.hasTestAccounts && <p>Includes test bot activity</p>}
                {item.description && <p>{item.description}</p>}{item.reason && <p>Reason: {item.reason}</p>}
                <Evidence item={item} canReadHands={canReadHands} />
                {manage && ['alerts', 'reports'].includes(tab) && <div className="integrity-actions">{(tab === 'alerts' ? ['reviewing', 'dismissed', 'confirmed'] : ['reviewing', 'closed']).map(status => <button className="add-btn" key={status} disabled={busy || item.status === status} onClick={() => act(`${tab}/${item._id}`, { status })}>{title(status)}</button>)}</div>}
            </article>)}
        </section>
        <div className="integrity-actions"><button className="add-btn" disabled={!offset || busy} onClick={() => setOffset(offset - 30)}>Previous</button><span>{total ? offset + 1 : 0}–{Math.min(offset + 30, total)} of {total}</span><button className="add-btn" disabled={offset + 30 >= total || busy} onClick={() => setOffset(offset + 30)}>Next</button></div>
    </main></div>;
}
export default connect(({ Auth }) => ({ role: Auth.role, permissions: Auth.permissions }))(Integrity);
