import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { canAccess } from '../../utils/adminAccess';

export default function IntegrityControls({ role, permissions }) {
  const [scope, setScope] = useState(''), [data, setData] = useState(null), [changes, setChanges] = useState({});
  const [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState('');
  const generation = useRef(0);
  const manage = canAccess({ role, permissions }, 'integrity.manage');
  const editable = c => manage && c.editable && (c.key !== 'withdrawal_review' || canAccess({ role, permissions }, 'withdrawals.manage'));
  const load = useCallback(async () => {
    const request = ++generation.current;
    try {
      const r = await axios.get(`/integrity/controls?scope=${encodeURIComponent(scope || 'staging')}`);
      if (request === generation.current) {setData(r.data.body); setChanges({});}
    } catch(e) {if(request === generation.current)setError(e.response?.data?.message || e.message); throw e;}
  }, [scope]);
  useEffect(() => {setData(null);setChanges({});setError('');setSaved('');load().catch(() => {});return () => {generation.current++;};}, [load]);
  const save = async e => {
    e.preventDefault(); if (!scope || !Object.keys(changes).length) return;
    if (reason.trim().length < 3) {setError('Enter an audit reason for the switch changes.'); return;}
    setBusy(true); setError(''); setSaved('');
    try {
      await axios.post('/integrity/controls', {scope,revision:data.revision,changes,reason});
      await load(); setReason(''); setSaved('Switches saved. They apply to the next check or analysis; existing evidence is retained.');
    } catch(e) {setError(e.response?.data?.message || e.message);} finally {setBusy(false);}
  };
  return <section className="integrity-card" aria-label="Anti-cheat test switches">
    <h3>Anti-cheat test switches</h3>
    <p className="integrity-help">Choose a reserved QA table to test checks independently. Staging-wide settings also cover reporting and new withdrawal holds. Production ignores test overrides. Always-on game protections are listed below with their reasons.</p>
    <label>Switch scope<select className="search-input" value={scope} disabled={busy} onChange={e => setScope(e.target.value)}>
      <option value="">Choose a QA table or staging scope</option>
      {(data?.scopeOptions || []).map(t => <option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}
      <option value="staging">Whole development/staging backend</option>
    </select></label>
    <button className="add-btn" disabled={busy} onClick={() => load().catch(() => {})}>Refresh switches</button>
    {data?.mutable === false && <p role="status">Switch editing is disabled on this backend. All protections use enforced defaults.</p>}
    {error && <p role="alert" className="integrity-error">{error}</p>}{saved && <p role="status">{saved}</p>}
    {scope && data?.controls && <form onSubmit={save}>
      <p><strong>Applies to: {scope === 'staging' ? 'the whole development/staging backend' : (data.scopeOptions.find(t => t.id === scope)?.name || scope)}</strong> · Revision {data.revision}</p>
      {data.controls.map(c => <div className="integrity-record" key={c.key}>
        <label><input type="checkbox" checked={changes[c.key] ?? c.enabled} disabled={busy || !editable(c)} onChange={e => setChanges(current => ({...current,[c.key]:e.target.checked}))} /> {c.number}. {c.name} · {c.switchable ? ((changes[c.key] ?? c.enabled) ? 'On' : 'Off') : 'Always on'}</label>
        <p className="integrity-help">{c.effect} {c.key === 'withdrawal_review' && !canAccess({ role, permissions }, 'withdrawals.manage') && 'Withdrawal management permission is required.'} {scope !== 'staging' && c.key === 'withdrawal_review' && 'Use the staging-wide scope to change this setting.'} {c.inherited && c.switchable && 'Currently inherits the staging setting.'}</p>
      </div>)}
      {manage && data.mutable && <><label>Switch change reason<input className="search-input" value={reason} maxLength="2000" onChange={e => setReason(e.target.value)} /></label>
        <div className="integrity-actions"><button className="add-btn" disabled={busy || !Object.keys(changes).length}>Save switches</button>
          <button type="button" className="add-btn" disabled={busy} onClick={() => setChanges(Object.fromEntries(data.controls.filter(editable).map(c => [c.key,true])))}>Set editable checks to On</button></div></>}
    </form>}
  </section>;
}
