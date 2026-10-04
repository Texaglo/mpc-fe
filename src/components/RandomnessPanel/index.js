import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export default function RandomnessPanel({ tableId, canCancel = false, canRetry = false, canRecover = false }) {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState('');
    const refresh = useCallback(async () => {
        try { const response = await axios.get('/randomness/admin/requests', { params: { tableId } }); setRows(response.data.requests); setError(''); }
        catch (e) { setError(e.response?.data?.message || e.message); }
    }, [tableId]);
    useEffect(() => { refresh(); }, [refresh]);
    const inspect = async row => {
        try { setSelected((await axios.get(`/randomness/hands/${row.id}`)).data); setError(''); }
        catch (e) { setError(e.response?.data?.message || e.message); }
    };
    const cancel = async row => {
        try { await axios.post(`/randomness/admin/requests/${row.id}/cancel`, { reason }); setReason(''); setSelected(null); await refresh(); }
        catch (e) { setError(e.response?.data?.message || e.message); }
    };
    const retry = async row => {
        try { await axios.post(`/randomness/admin/requests/${row.id}/retry`, { reason }); setReason(''); await refresh(); }
        catch (e) { setError(e.response?.data?.message || e.message); }
    };
    const recover = async row => {
        try { await axios.post(`/randomness/admin/requests/${row.id}/recover`, { reason }); setReason(''); await refresh(); }
        catch (e) { setError(e.response?.data?.message || e.message); }
    };
    const download = () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `mpc-orao-hand-${selected.id}.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    return <section className="competition-section" aria-label="ORAO hand verification">
        <h3>ORAO hand verification</h3>
        <p>Cards and shuffle secrets unlock only after the hand and pot settlement are complete. Full verification then reveals folded and mucked cards too.</p>
        <button type="button" className="add-btn" onClick={refresh}>Refresh requests</button>
        {error && <p role="alert">{error}</p>}
        {!rows.length && <p>No ORAO requests for this table.</p>}
        {rows.map(row => <div key={row.id} className="competition-section">
            <p><strong>{row.status}</strong> · {row.network} · {row.createdAt && new Date(row.createdAt).toLocaleString()}</p>
            <p>Reserved upfront total: {row.upfrontLamports == null ? 'Awaiting quote' : `${(row.reservedUpfrontLamports ?? row.upfrontLamports) / 1e9} SOL across ${row.signedAttempts || 1} signed attempt(s)`}. Treasury: <code>{(row.funder || row.payer)}</code></p>
            {row.reason && <p role="status">{row.reason}</p>}
            <button type="button" className="add-btn" onClick={() => inspect(row)}>{row.status === 'SETTLED' ? 'View completed-hand proof' : 'View request status'}</button>
            {(canCancel || canRetry) && !['SETTLED', 'ABANDONED'].includes(row.status) && <div>
                <label>Operator action reason <input className="competition-control" value={reason} onChange={e => setReason(e.target.value)} /></label>
                {canCancel && <button type="button" className="add-btn" disabled={reason.trim().length < 5} onClick={() => cancel(row)}>Cancel undealt request</button>}
                {canRetry && ['COMMITTED', 'PREPARED', 'PENDING'].includes(row.status) && <button type="button" className="add-btn" disabled={reason.trim().length < 5} onClick={() => retry(row)}>Retry same request</button>}
            </div>}
            {row.recovery && <p>Rent recovery: {row.recovery.status} · {(row.recovery.amountLamports || 0) / 1e9} SOL to treasury · {row.recovery.signature}</p>}
            {canRecover && row.status === 'SETTLED' && row.recovery?.status !== 'CONFIRMED' && <div>
                <label>Recovery reason <input className="competition-control" value={reason} onChange={e => setReason(e.target.value)} /></label>
                <button type="button" className="add-btn" disabled={reason.trim().length < 5} onClick={() => recover(row)}>{row.recovery ? 'Confirm or retry SOL recovery' : 'Return remaining SOL to treasury'}</button>
            </div>}
            {(row.operatorActions || []).map((action, i) => <p key={i}>{action.action} · {action.at && new Date(action.at).toLocaleString()} · {action.reason} · Admin {action.actorId}</p>)}
        </div>)}
        {selected && <section className="competition-section">
            <h4>{selected.verificationAvailable ? 'Completed-hand proof' : 'Verification locked until settlement'}</h4>
            <p>Commitment: <code style={{ overflowWrap: 'anywhere' }}>{selected.commitment}</code></p>
            <p>Oracle request: <code style={{ overflowWrap: 'anywhere' }}>{selected.requestAddress}</code></p>
            {selected.verificationAvailable && <>
                <p>Hand {selected.binding.identity.gameHandNumber}. Settlement: {new Date(selected.completedAt).toLocaleString()}.</p>
                {selected.verification && <p role={selected.verification.recordedCardsMatch ? 'status' : 'alert'}>{selected.verification.recordedCardsMatch ? 'Recorded cards match the committed shuffle.' : `Recorded-card discrepancy: ${selected.verification.reason}`} Independent on-chain verification is still required.</p>}
                {selected.observed && <div>
                    <p>Community cards: {selected.observed.board.join(', ') || 'Hand ended before a board was dealt'}</p>
                    {selected.observed.players.map(player => <p key={player.playerID}>Seat {selected.binding.players.find(p => p.playerID === player.playerID)?.seatNumber || player.playerID + 1}: {player.cards.join(', ') || 'No hole cards recorded'}</p>)}
                </div>}
                <button type="button" className="add-btn" onClick={download}>Download verification file</button>
                <p>Deck in deal order: {selected.deck.join(', ')}</p>
                <p>{selected.disclosure}</p>
                <details><summary>Reproducible proof data</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(selected, null, 2)}</pre></details>
            </>}
        </section>}
    </section>;
}
