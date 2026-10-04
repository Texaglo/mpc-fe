import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import Operations from './Operations';
import '../../assets/css/competition-management.css';

const localDate = value => {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const blank = () => ({ randomnessProvider: 'CSPRNG', oraoTimeChargeMpcePerHour: '', name: '', description: '', kind: 'MTT', balanceType: 'FP', gameVariant: "Texas Hold'em",
    formatLimit: 'No Limit', buyIn: 10, fee: 0, startingStack: 1000, seatLimit: 6, minPlayers: 2,
    maxPlayers: 30, region: 'us', registrationOpensAt: localDate(Date.now()), startsAt: localDate(Date.now() + 3600000),
    actionTimerSeconds: 15, timeBankSeconds: 0, breakEveryLevels: 0, breakDurationSeconds: 0, payoutPercentages: '100',
    blinds: [{ smallBlind: 10, bigBlind: 20, duration: 10, ante: 0 }] });
const Field = ({ label, children }) => <label className="competition-field"><span>{label}</span>{children}</label>;
const bodyOf = response => response.data.body;

export function configurationOf(form) {
    const fields = ['name', 'description', 'kind', 'balanceType', 'gameVariant', 'formatLimit', 'region'];
    const result = Object.fromEntries(fields.map(key => [key, form[key]]));
    for (const key of ['buyIn', 'fee', 'startingStack', 'seatLimit', 'actionTimerSeconds', 'timeBankSeconds']) result[key] = Number(form[key]);
    if (form.randomnessProvider) { result.randomnessProvider = form.randomnessProvider; result.oraoTimeChargeMpcePerHour = form.oraoTimeChargeMpcePerHour === '' || form.oraoTimeChargeMpcePerHour == null ? null : Number(form.oraoTimeChargeMpcePerHour); }
    result.breakEveryLevels = Number(form.breakEveryLevels || 0);
    result.breakDurationSeconds = Number(form.breakDurationSeconds || 0);
    result.registrationOpensAt = new Date(form.registrationOpensAt).toISOString();
    if (form.kind === 'MTT') {
        result.startsAt = new Date(form.startsAt).toISOString();
        result.minPlayers = Number(form.minPlayers);
        result.maxPlayers = Number(form.maxPlayers);
    }
    result.payoutPercentages = String(form.payoutPercentages).split(',').map(Number);
    result.blinds = form.blinds.map(level => Object.fromEntries(['smallBlind', 'bigBlind', 'duration', 'ante'].map(key => [key, Number(level[key])])));
    return result;
}

export default function CompetitionSetup() {
    const [form, setForm] = useState(blank);
    const [items, setItems] = useState([]);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [detail, setDetail] = useState(null);
    const [liveId, setLiveId] = useState(null);
    const [error, setError] = useState('');
    const report = e => {
        const message = e?.response?.data?.message || e.message || 'Competition request failed';
        setError(message);
        EventBus.publish('error', message);
    };
    const refresh = useCallback(async () => {
        try {
            const result = bodyOf(await axios.get(`/competitions/admin?limit=20&offset=${offset}`));
            setItems(result.items); setTotal(result.total); setError('');
        } catch (e) { report(e); }
    }, [offset]);
    useEffect(() => { refresh(); }, [refresh]);
    const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
    const save = async e => {
        e.preventDefault(); setBusy(true);
        try {
            const configuration = configurationOf(form);
            if (editing) {
                const reason = window.prompt('Reason for changing this draft:');
                if (!reason?.trim()) return;
                await axios.put(`/competitions/${editing}`, { configuration, reason });
            } else await axios.post('/competitions', configuration);
            setEditing(null); setForm(blank()); await refresh();
        } catch (e) { report(e); } finally { setBusy(false); }
    };
    const action = async (item, command) => {
        let reason;
        if (command === 'cancel') {
            reason = window.prompt('Cancel and refund all entries including fees. Audit reason:');
            if (!reason?.trim()) return;
        } else if (!window.confirm('Open registration on the staging backend? The enabled tournament runner will start a full SNG or a scheduled MTT automatically.')) return;
        setBusy(true);
        try { await axios.post(`/competitions/${item._id}/${command}`, { reason }); await refresh(); }
        catch (e) { report(e); } finally { setBusy(false); }
    };
    const inspect = async (item, resource, detailOffset = 0) => {
        setBusy(true);
        try { setDetail({ name: item.name, id: item._id, resource, ...bodyOf(await axios.get(`/competitions/${item._id}/${resource}?limit=20&offset=${detailOffset}`)) }); }
        catch (e) { report(e); } finally { setBusy(false); }
    };
    const input = (key, label, type = 'number') => <Field key={key} label={label}><input className="competition-control" type={type} required={key !== 'description'} name={key}
        value={form[key]} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} onChange={e => update(key, e.target.value)} /></Field>;
    const select = (key, label, choices) => <Field label={label}><select className="competition-control" value={form[key]} onChange={e => {
        update(key, e.target.value);
        if (key === 'gameVariant') update('formatLimit', e.target.value === 'Omaha' ? 'Pot Limit' : 'No Limit');
    }}>{choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}</select></Field>;
    return <div className="content"><div className="main-container competition-workspace">
        <h2>Competition setup — testing</h2>
        <p role="status">Local / staging testing only. The tournament runner supports gameplay and prize settlement when enabled on the staging backend. Use isolated test accounts and a separate database. Existing tournament screens use the legacy API.</p>
        {error && <p role="alert">{error}</p>}
        <form className="competition-form" onSubmit={save}><fieldset disabled={busy}>
            <section className="competition-section"><h3>{editing ? 'Edit draft' : 'New draft'}</h3><div className="competition-grid">
                {input('name', 'Name', 'text')}{input('description', 'Description', 'text')}
                {select('kind', 'Competition', ['MTT', 'SNG'])}{select('balanceType', 'Entry currency', ['FP', 'CASH'])}
                {select('gameVariant', 'Variant', ["Texas Hold'em", 'Omaha'])}{select('formatLimit', 'Betting format', ['No Limit', 'Pot Limit'])}
                {select('seatLimit', 'Players per table', [2, 4, 6])}{select('region', 'Region', ['us', 'usw', 'ussc', 'eu', 'asia', 'au', 'cae', 'in', 'jp', 'za', 'sa', 'kr', 'tr'])}
                {input('buyIn', 'Buy-in → prize pool')}{input('fee', 'Entry fee (additional)')}{input('startingStack', 'Tournament chips (not money)')}
                {input('registrationOpensAt', 'Registration opens (your local time)', 'datetime-local')}
                {form.kind === 'MTT' && <>{input('startsAt', 'Scheduled start (your local time)', 'datetime-local')}{input('minPlayers', 'Minimum entrants')}{input('maxPlayers', 'Maximum entrants')}</>}
                {input('actionTimerSeconds', 'Action timer (seconds)')}{input('timeBankSeconds', 'Time bank per hand (seconds)')}{input('breakEveryLevels', 'Break every N levels (0 disables)')}{input('breakDurationSeconds', 'Break duration (seconds)')}
                {input('payoutPercentages', 'Payout percentages by finish, comma separated', 'text')}
            </div></section>
            <section className="competition-section" style={form.randomnessProvider === 'ORAO' ? { border: '2px solid #b98c48' } : undefined}>
                <h3>Verifiable shuffle</h3>
                {select('randomnessProvider', 'Randomness provider', ['CSPRNG', 'ORAO'])}
                {form.randomnessProvider === 'ORAO' && <>
                    <p>Each table requests treasury-funded randomness for every hand. Complete deck verification opens after settlement, including folded cards. Oracle delays pause dealing. Free Play never burns MPCE. If a paid entrant runs out of MPCE, their entry and chips remain; the treasury covers the remaining oracle cost.</p>
                    {input('oraoTimeChargeMpcePerHour', 'ORAO MPCE/hour (0 = treasury sponsored)')}
                </>}
            </section>
            <section className="competition-section"><h3>Blind levels</h3>{form.blinds.map((level, index) => <div className="competition-grid" key={index}>
                {['smallBlind', 'bigBlind', 'duration', 'ante'].map(key => <Field key={key} label={`${index + 1}: ${key === 'duration' ? 'Minutes' : key}`}>
                    <input className="competition-control" type="number" min="0" step="any" required value={level[key]} onChange={e => update('blinds', form.blinds.map((b, i) => i === index ? { ...b, [key]: e.target.value } : b))} />
                </Field>)}
                <button className="add-btn" type="button" disabled={form.blinds.length === 1} onClick={() => update('blinds', form.blinds.filter((_, i) => i !== index))}>Remove level</button>
            </div>)}<button className="add-btn" type="button" onClick={() => update('blinds', [...form.blinds, { smallBlind: 20, bigBlind: 40, duration: 10, ante: 0 }])}>Add level</button></section>
            <button className="add-btn" type="submit">Save draft</button>
            {editing && <button className="add-btn" type="button" onClick={() => { setEditing(null); setForm(blank()); }}>Discard form changes</button>}
        </fieldset></form>
        <section className="competition-section"><h3>Competitions ({total})</h3><button className="add-btn" disabled={busy} onClick={refresh}>Refresh</button>
            {items.map(item => <div key={item._id} className="competition-section">
                <h4>{item.name} — {item.status}</h4>
                <p>{item.kind} · {item.gameVariant} · {item.formatLimit} · {item.buyIn} + {item.fee} {item.balanceType} · {item.registeredCount}/{item.maxPlayers} registered · Pool: {item.prizePool}</p>
                <p>ID: <code>{item._id}</code></p><div className="competition-actions">
                    {item.status === 'Draft' && <><button className="add-btn" disabled={busy} onClick={() => { setEditing(item._id); setForm({ ...blank(), ...item,
                        registrationOpensAt: localDate(item.registrationOpensAt), startsAt: item.startsAt ? localDate(item.startsAt) : blank().startsAt,
                        payoutPercentages: item.payoutPercentages.join(',') }); }}>Edit</button>
                        <button className="add-btn" disabled={busy} onClick={() => action(item, 'publish')}>Open staging registration</button></>}
                    {['Draft', 'Registering'].includes(item.status) && <button className="add-btn" disabled={busy} onClick={() => action(item, 'cancel')}>Cancel / refund</button>}
                    <button className="add-btn" disabled={busy} onClick={() => setLiveId(item._id)}>Live operations / results</button>
                    <button className="add-btn" disabled={busy} onClick={() => { setEditing(null); setForm({ ...blank(), ...item, name: `${item.name} (copy)`, registrationOpensAt: blank().registrationOpensAt, startsAt: blank().startsAt, payoutPercentages: item.payoutPercentages.join(',') }); }}>Clone as draft</button>
                    {['registrations', 'audit', 'seating-preview', 'history'].map(resource => <button className="add-btn" key={resource} disabled={busy} onClick={() => inspect(item, resource)}>{resource}</button>)}
                </div>
            </div>)}
            <button className="add-btn" disabled={busy || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>Previous</button>
            <button className="add-btn" disabled={busy || offset + 20 >= total} onClick={() => setOffset(offset + 20)}>Next</button>
        </section>
        {liveId && <Operations key={liveId} id={liveId} onClose={() => setLiveId(null)} />}
        {detail && <section className="competition-section"><h3>{detail.name}: {detail.resource}</h3>{detail.resource === 'registrations' ? <table><thead><tr><th>Player ID</th><th>Status</th><th>Buy-in</th><th>Fee</th><th>Currency</th></tr></thead><tbody>{(detail.items || []).map(e => <tr key={e._id}><td>{e.userId}</td><td>{e.status}</td><td>{e.buyIn}</td><td>{e.fee}</td><td>{e.balanceType}</td></tr>)}</tbody></table>
                : detail.resource === 'seating-preview' ? <ol>{(detail.tables || []).map((players, i) => <li key={i}>Table {i + 1}: {players.join(', ')}</li>)}</ol>
                : <table><thead><tr><th>Time</th><th>Operation / hand</th><th>Details</th></tr></thead><tbody>{(detail.items || []).map(e => <tr key={e._id}><td>{new Date(e.createdAt).toLocaleString()}</td><td>{e.action || `Hand ${e.roundNumber}`}</td><td>{e.reason || (e.terminalState?.tableCards || []).join(' · ')}<details><summary>Full record</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(e, null, 2)}</pre></details></td></tr>)}</tbody></table>}
            {detail.items && <><button className="add-btn" disabled={busy || detail.offset === 0} onClick={() => inspect({ _id: detail.id, name: detail.name }, detail.resource, Math.max(0, detail.offset - 20))}>Previous records</button>
                <button className="add-btn" disabled={busy || detail.offset + 20 >= detail.total} onClick={() => inspect({ _id: detail.id, name: detail.name }, detail.resource, detail.offset + 20)}>Next records</button></>}
            <button className="add-btn" onClick={() => setDetail(null)}>Close details</button>
        </section>}
    </div></div>;
}
