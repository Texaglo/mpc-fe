import React, { useEffect, useState } from 'react';
import axios from 'axios';

const date = value => value ? new Date(value).toLocaleString() : 'Not recorded';
export default function NetworkHistory({ userId, onSelectPlayer }) {
    const [data, setData] = useState(null);
    const [offset, setOffset] = useState(0);
    const [refresh, setRefresh] = useState(0);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        let active = true;
        setBusy(true); setError(''); setData(null);
        axios.get(`/integrity/players/${encodeURIComponent(userId)}/networks?limit=10&offset=${offset}`)
            .then(r => { if (active) setData(r.data.body); })
            .catch(e => { if (active) setError(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setBusy(false); });
        return () => { active = false; };
    }, [userId, offset, refresh]);
    return <section className="integrity-card" aria-label="Player IP history">
        <div className="integrity-row"><h3>IP and network history</h3><button className="add-btn" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh IP history</button></div>
        <p className="integrity-help">Shared Wi-Fi, mobile networks and VPNs can put unrelated players on the same IP. A match never automatically bans a player or blocks a table. It does not establish location or ownership.</p>
        {busy && <p role="status">Loading network history…</p>}
        {error && <p role="alert" className="integrity-error">{error}</p>}
        {data && <>
            <p>{data.retentionDays}-day history · {data.total} IP/day records. Access to this history is audited.</p>
            <p className="integrity-help">{data.sampling}</p>
            {!data.items?.length && <p>No IP observations recorded yet.</p>}
            {!!data.items?.length && <div className="integrity-table-scroll"><table className="integrity-table">
                <thead><tr><th>IP address / source</th><th>First / last seen</th><th>Observed samples / logins</th><th>Other accounts on this IP (30 days)</th></tr></thead>
                <tbody>{data.items.map(row => <tr key={row._id}>
                    <td><strong>{row.ipAddress}</strong><br />{row.source === 'trusted_proxy' ? 'Trusted load balancer' : 'Direct connection'}<br />{(row.channels || []).join(', ')}</td>
                    <td>{date(row.firstSeen)}<br />{date(row.lastSeen)}</td>
                    <td>{row.observations} samples<br />{row.logins} successful logins</td>
                    <td>{!row.sharedAccounts?.length ? 'None observed' : row.sharedAccounts.map(peer => <div key={peer.userId}>
                        <button className="integrity-player" onClick={() => onSelectPlayer(peer.userId)}>{peer.username}</button>
                        <p>{peer.observations} samples · {date(peer.firstSeen)} – {date(peer.lastSeen)}</p>
                    </div>)}{row.sharedAccountsTruncated && <p>Showing the 20 most recently observed accounts.</p>}</td>
                </tr>)}</tbody>
            </table></div>}
            <p className="integrity-help">Open a matching account to compare activity and hand evidence. Confirm common ownership only after review; use the existing player controls with an audit reason if restrictions are warranted.</p>
            <div className="integrity-actions"><button className="add-btn" disabled={busy || !offset} onClick={() => setOffset(n => n - 10)}>Previous IP records</button>
                <button className="add-btn" disabled={busy || offset + 10 >= data.total} onClick={() => setOffset(n => n + 10)}>Next IP records</button></div>
        </>}
    </section>;
}
