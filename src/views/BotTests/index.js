import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import './index.css';

const ACTIVE = new Set(['STARTING', 'WAITING_FOR_HUMAN', 'WAITING_FOR_NEXT_HAND', 'RUNNING', 'STOPPING']);
const bodyOf = (response) => response?.data?.body ?? [];

export default function BotTests() {
  const [tables, setTables] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ botCount: 2, startingStack: '', hands: 3, reason: '' });

  const selected = useMemo(() => tables.find((table) => table.id === selectedId), [tables, selectedId]);
  const activeRun = useMemo(() => runs.find((run) => ACTIVE.has(run.status)), [runs]);

  const refresh = useCallback(async (quiet = false) => {
    try {
      const [tableResponse, runResponse] = await Promise.all([
        axios.get('/admin/table-bot-runs/tables'), axios.get('/admin/table-bot-runs'),
      ]);
      const nextTables = bodyOf(tableResponse);
      setTables(nextTables);
      setRuns(bodyOf(runResponse));
      setSelectedId((current) => current || nextTables[0]?.id || '');
    } catch (error) {
      if (!quiet) EventBus.publish('error', error?.response?.data?.message || 'Unable to load table test controls');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(true), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!selected) return;
    setForm((current) => ({ ...current, startingStack: current.startingStack || selected.minBuyIn, botCount: Math.max(1, Math.min(current.botCount, selected.availableBotSeats || 1)) }));
  }, [selected]);

  const deploy = async (event) => {
    event.preventDefault();
    if (!selected) return;
    if (!window.confirm(`Arm ${form.botCount} test bot(s) for ${selected.name}? They will wait for a real player before joining.`)) return;
    setSubmitting(true);
    try {
      const response = await axios.post('/admin/table-bot-runs', { ...form, ringId: selected.id });
      EventBus.publish('success', response?.data?.message || 'Bots armed');
      setForm((current) => ({ ...current, reason: '' }));
      await refresh(true);
    } catch (error) { EventBus.publish('error', error?.response?.data?.message || 'Unable to arm test bots'); }
    finally { setSubmitting(false); }
  };

  const stop = async (run) => {
    const reason = window.prompt('Required audit reason for stopping this run:', 'Manual test completed');
    if (!reason) return;
    try {
      await axios.post(`/admin/table-bot-runs/${run.runId}/stop`, { reason });
      EventBus.publish('success', 'Bot cleanup requested');
      await refresh(true);
    } catch (error) { EventBus.publish('error', error?.response?.data?.message || 'Unable to stop bots'); }
  };

  return <section className="bot-tests">
    <header className="bot-tests__hero">
      <div><span className="bot-tests__eyebrow">Controlled QA</span><h2>Free Play Table Bots</h2><p>Arm test players for an FP table. They stay out until a real player sits, never raise, and leave when the real player leaves.</p></div>
      <span className="bot-tests__safety">FP ONLY</span>
    </header>

    <div className="bot-tests__grid">
      <form className="bot-tests__panel" onSubmit={deploy}>
        <h3>Deploy to a table</h3>
        <label>Free Play table<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setForm((current) => ({ ...current, startingStack: '' })); }} disabled={loading}>
          {!tables.length && <option value="">No eligible FP tables</option>}
          {tables.map((table) => <option key={table.id} value={table.id}>{table.name} · {table.smallBlind}/{table.bigBlind} FP · {table.seated} seated{table.waiting ? ` + ${table.waiting} waiting` : ''} / {table.seatLimit}</option>)}
        </select></label>
        {selected && <div className="bot-tests__table-facts"><span>Buy-in <strong>{selected.minBuyIn}–{selected.maxBuyIn} FP</strong></span><span>Seats <strong>{selected.seated} seated · {selected.waiting || 0} waiting</strong></span><span>Bot capacity <strong>{selected.availableBotSeats}</strong></span><span>Status <strong>{selected.gameStatus || selected.tableStatus}</strong></span></div>}
        <div className="bot-tests__fields">
          <label>Bots<input type="number" min="1" max={Math.max(1, selected?.availableBotSeats || 1)} value={form.botCount} onChange={(event) => setForm({ ...form, botCount: Number(event.target.value) })} /></label>
          <label>Starting FP<input type="number" min={selected?.minBuyIn || 0.01} max={selected?.maxBuyIn || undefined} step="0.01" value={form.startingStack} onChange={(event) => setForm({ ...form, startingStack: event.target.value })} /></label>
          <label>Hands<input type="number" min="1" max="100" value={form.hands} onChange={(event) => setForm({ ...form, hands: Number(event.target.value) })} /></label>
        </div>
        <label>Audit reason<textarea minLength="3" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="What are you validating?" /></label>
        <div className="bot-tests__gate"><strong>Human-start gate is always on.</strong><span>Bots cannot start or continue a bot-only game.</span></div>
        {activeRun && <div className="bot-tests__active-warning">A test is already active on <strong>{activeRun.tableName || activeRun.ringId}</strong>. Stop it before arming another table.</div>}
        <button className="bot-tests__deploy" disabled={submitting || activeRun || !selected || selected.availableBotSeats < 1 || selected.tableStatus !== 'ACTIVE'}>{submitting ? 'ARMING…' : 'ARM TEST BOTS'}</button>
      </form>

      <div className="bot-tests__panel bot-tests__runs"><div className="bot-tests__panel-heading"><h3>Recent runs</h3><button type="button" onClick={() => refresh()}>Refresh</button></div>
        {!runs.length && <div className="bot-tests__empty">No bot tests have run since this backend started.</div>}
        {runs.map((run) => <article className="bot-run" key={run.runId}>
          <div><span className={`bot-run__status is-${run.status.toLowerCase()}`}>{run.status.replaceAll('_', ' ')}</span><strong>{run.tableName || run.ringId}</strong><small>{run.config.botCount} bots · {run.completedHands}/{run.config.hands} hands · {run.botsJoined} seated · {run.botsWaiting || 0} waiting for next hand</small></div>
          {run.error && <p className="bot-run__error">{run.error}</p>}
          {run.stoppedReason && <p>{run.stoppedReason}</p>}
          {ACTIVE.has(run.status) && <button type="button" onClick={() => stop(run)} disabled={run.status === 'STOPPING'}>{run.status === 'STOPPING' ? 'Stopping…' : 'Stop & remove'}</button>}
        </article>)}
      </div>
    </div>
  </section>;
}
