import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Operations({ id, onClose }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState('');
    const [level, setLevel] = useState(0);
    const [userId, setUserId] = useState('');
    const [tableId, setTableId] = useState('');
    useEffect(() => {
        let active = true;
        let loading = false;
        const refresh = async () => {
            if (loading) return;
            loading = true;
            try {
                const response = await axios.get(`/competitions/${id}/operations`);
                if (active) { setData(response.data.body); setError(''); }
            } catch (e) { if (active) setError(e.response?.data?.message || e.message); }
            finally { loading = false; }
        };
        refresh(); const timer = setInterval(refresh, 2000);
        return () => { active = false; clearInterval(timer); };
    }, [id]);
    const control = async command => {
        if (!reason.trim()) { setError('Enter an audit reason before changing the competition.'); return; }
        setBusy(true);
        try {
            const response = await axios.post(`/competitions/${id}/control`, { command, reason, level: Number(level), ...(userId ? { userId } : {}), ...(tableId ? { tableId } : {}) });
            setData(response.data.body); setReason(''); setError('');
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setBusy(false); }
    };
    return <section className="competition-section" aria-label="Live competition">
        <button onClick={onClose}>Close live view</button>
        {error && <p role="alert">{error}</p>}
        {data && <>
            <h3>{data.event.name} — {data.event.status}</h3>
            <p>Hand round {data.event.roundNumber || 0} · Prize pool {data.event.prizePool} {data.event.balanceType} · Fees {data.event.collectedFees}</p>
            {data.event.runnerError && <p role="alert">Runner needs attention: {data.event.runnerError}</p>}
            {data.level && <p>Level {data.level.index + 1}: {data.level.smallBlind}/{data.level.bigBlind}, ante {data.level.ante}
                {data.level.onBreak ? ' · On break' : ''}{data.level.remainingSeconds != null ? ` · ${Math.ceil(data.level.remainingSeconds)} seconds remaining` : ' · Final level'}</p>}
            {['Registering', 'Running', 'Paused'].includes(data.event.status) && <fieldset disabled={busy}>
                <label>Audit reason <input aria-label="Audit reason" value={reason} onChange={e => setReason(e.target.value)} /></label>
                {data.event.status !== 'Registering' && <button onClick={() => control(data.event.status === 'Paused' ? 'resume' : 'pause')}>{data.event.status === 'Paused' ? 'Resume' : 'Pause'}</button>}
                {data.event.status === 'Running' && <button disabled={data.event.pauseRequested} onClick={() => control('pause-after-hand')}>{data.event.pauseRequested ? 'Pause after hands requested' : 'Pause after current hands'}</button>}
                {data.event.status === 'Paused' && <><label>Next-hand blind level <select aria-label="Next-hand blind level" value={level} onChange={e => setLevel(e.target.value)}>
                    {data.event.blinds.map((b, i) => <option key={i} value={i}>{i + 1}: {b.smallBlind}/{b.bigBlind}</option>)}
                </select></label><button onClick={() => control('level')}>Set level for next hand</button></>}
                <label>Player ID <input aria-label="Player ID" value={userId} onChange={e => setUserId(e.target.value)} /></label>
                {data.event.status === 'Registering' && <><button disabled={!userId} onClick={() => control('remove-entry')}>Remove entry and refund</button>
                    {data.event.buyIn === 0 && data.event.fee === 0 && <button disabled={!userId} onClick={() => control('add-free-entry')}>Add free entry</button>}</>}
                {data.event.status === 'Paused' && <><label>Target table <select aria-label="Target table" value={tableId} onChange={e => setTableId(e.target.value)}><option value="">Select table</option>{data.tables.filter(t => !t.closed).map(t => <option value={t._id} key={t._id}>{t.number}</option>)}</select></label>
                    <button disabled={!userId || !tableId} onClick={() => control('move')}>Move between settled hands</button>
                    <button disabled={!userId} onClick={() => control('disqualify')}>Disqualify outside paid places</button>
                    <p>Moves and disqualifications require all hands to have settled. Paid-place disqualifications require a separate prize ruling.</p></>}
            </fieldset>}
            <h4>Tables</h4>
            {data.tables.map(table => <div className="competition-section" key={table._id}>
                <h4>Table {table.number} {table.closed ? '— closed' : table.settled ? '— between hands' : '— playing'}</h4>
                <p>Board: {(table.runtime?.tableCards || []).join(' · ') || 'No community cards'} · Pot: {table.runtime?.bet || 0}</p>
                <table><thead><tr><th>Player</th><th>Stack</th><th>Bet</th><th>State</th></tr></thead><tbody>
                    {(table.runtime?.players || []).map(p => <tr key={p.userId}><td>{p.playerName}</td><td>{p.sum}</td><td>{p.bet}</td><td>{p.fold ? 'Folded' : !table.settled && p.playerID === table.runtime.currentPlayerID ? 'Acting' : p.sum === 0 ? 'All-in / eliminated' : 'Seated'}</td></tr>)}
                </tbody></table>
            </div>)}
            <h4>Results and settlement</h4>
            <table><thead><tr><th>Player ID</th><th>Status</th><th>Finish</th><th>Prize</th><th>Settlement</th></tr></thead><tbody>
                {data.results.map(r => <tr key={r._id}><td>{r.userId}</td><td>{r.status}</td><td>{r.finishPosition || '—'}{r.tiedPlaces > 1 ? ' (tie)' : ''}</td><td>{r.payout || 0} {data.event.balanceType}</td><td>{r.paidAt ? 'Settled' : data.event.status === 'Settling' ? 'Pending; automatic retry' : '—'}</td></tr>)}
            </tbody></table>
        </>}
    </section>;
}
