import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import { connect } from 'react-redux';
import { canAccess } from '../../utils/adminAccess';
import './index.css';

const ACTIVE = new Set(['STARTING', 'WAITING_FOR_HUMAN', 'WAITING_FOR_NEXT_HAND', 'RUNNING', 'STOPPING']);
const bodyOf = (response) => response?.data?.body ?? [];
const STRATEGIES = [
  ['contextual', 'Table-aware'], ['random', 'Random legal'], ['aggressive', 'Aggressive'],
  ['passive', 'Passive'], ['tight', 'Tight'], ['calling_station', 'Calling station'],
];
const newProfile = (index, stack) => ({
  name: `Test Bot ${index + 1}`, startingStack: stack || '', strategy: 'contextual',
  aggression: 50, bluffFrequency: 6, foldFrequency: 35,
  thinkTimeMinMs: 1200, thinkTimeMaxMs: 6000, rebuy: true,
});
const syncProfiles = (profiles, count, stack) => Array.from({ length: count }, (_, index) => ({
  ...newProfile(index, stack), ...(profiles[index] || {}),
  startingStack: profiles[index]?.startingStack || stack || '',
}));

function BotTests({ role, permissions }) {
  const [tables, setTables] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [expandedRun, setExpandedRun] = useState('');
  const [form, setForm] = useState({
    botCount: 2, startingStack: '', hands: 10, reason: '', allowBotOnly: false,
    continueWithoutHuman: false, endCondition: 'hands', runSeconds: 3600, botProfiles: [],
  });

  const selected = useMemo(() => tables.find((table) => table.id === selectedId), [tables, selectedId]);
  const activeRun = useMemo(() => runs.find((run) => ACTIVE.has(run.status)), [runs]);
  const botCapacity = form.allowBotOnly ? selected?.botOnlyCapacity : selected?.availableBotSeats;
  const canManage = canAccess({ role, permissions }, 'bots.manage');

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
    setForm((current) => {
      const limit = current.allowBotOnly ? selected.botOnlyCapacity : selected.availableBotSeats;
      const count = Math.max(current.allowBotOnly ? 2 : 1, Math.min(current.botCount, limit || 1));
      const stack = current.startingStack || selected.minBuyIn;
      return { ...current, startingStack: stack, botCount: count, botProfiles: syncProfiles(current.botProfiles, count, stack) };
    });
  }, [selected]);

  const updateForm = (changes) => setForm((current) => {
    const next = { ...current, ...changes };
    if (changes.botCount !== undefined) next.botProfiles = syncProfiles(current.botProfiles, Number(changes.botCount), next.startingStack);
    if (changes.startingStack !== undefined) next.botProfiles = next.botProfiles.map((profile) => ({ ...profile, startingStack: changes.startingStack }));
    if (changes.allowBotOnly === true) {
      next.continueWithoutHuman = true;
      next.botCount = Math.max(2, next.botCount);
      next.botProfiles = syncProfiles(next.botProfiles, next.botCount, next.startingStack);
    }
    return next;
  });
  const updateProfile = (index, changes) => setForm((current) => ({
    ...current,
    botProfiles: current.botProfiles.map((profile, profileIndex) => profileIndex === index ? { ...profile, ...changes } : profile),
  }));

  const deploy = async (event) => {
    event.preventDefault();
    if (!selected) return;
    const mode = form.allowBotOnly ? 'bot-only spectate test' : 'human-gated test';
    if (!window.confirm(`Start a ${mode} with ${form.botCount} bot(s) on ${selected.name}?`)) return;
    setSubmitting(true);
    try {
      const response = await axios.post('/admin/table-bot-runs', { ...form, ringId: selected.id });
      EventBus.publish('success', response?.data?.message || 'Bot test started');
      setForm((current) => ({ ...current, reason: '' }));
      await refresh(true);
    } catch (error) { EventBus.publish('error', error?.response?.data?.message || 'Unable to start test bots'); }
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
      <div><span className="bot-tests__eyebrow">Controlled QA</span><h2>Free Play Table Bots</h2><p>Build repeatable table scenarios, watch bot-only hands, or keep bots seated while developers join, sit out and leave.</p></div>
      <span className="bot-tests__safety">FP ONLY</span>
    </header>

    <div className="bot-tests__grid">
      {canManage ? <form className="bot-tests__panel" onSubmit={deploy}>
        <h3>Deploy to a table</h3>
        <label>Free Play table<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); updateForm({ startingStack: '' }); }} disabled={loading}>
          {!tables.length && <option value="">No eligible FP tables</option>}
          {tables.map((table) => <option key={table.id} value={table.id}>{table.name} · {table.smallBlind}/{table.bigBlind} FP · {table.seated} seated{table.waiting ? ` + ${table.waiting} waiting` : ''} / {table.seatLimit}</option>)}
        </select></label>
        {selected && <div className="bot-tests__table-facts"><span>Buy-in <strong>{selected.minBuyIn}–{selected.maxBuyIn} FP</strong></span><span>Seats <strong>{selected.seated} seated · {selected.waiting || 0} waiting</strong></span><span>Human-gated capacity <strong>{selected.availableBotSeats}</strong></span><span>Bot-only capacity <strong>{selected.botOnlyCapacity}</strong></span></div>}

        <div className="bot-tests__mode">
          <button type="button" className={!form.allowBotOnly ? 'is-selected' : ''} onClick={() => updateForm({ allowBotOnly: false })}><strong>Human-gated</strong><span>Bots wait for a real player.</span></button>
          <button type="button" className={form.allowBotOnly ? 'is-selected' : ''} onClick={() => updateForm({ allowBotOnly: true })}><strong>Bot-only spectate</strong><span>Bots may play without a human.</span></button>
        </div>

        <div className="bot-tests__fields">
          <label>Bots<input type="number" min={form.allowBotOnly ? 2 : 1} max={Math.max(form.allowBotOnly ? 2 : 1, botCapacity || 1)} value={form.botCount} onChange={(event) => updateForm({ botCount: Number(event.target.value) })} /></label>
          <label>Default buy-in<input type="number" min={selected?.minBuyIn || 0.01} max={selected?.maxBuyIn || undefined} step="0.01" value={form.startingStack} onChange={(event) => updateForm({ startingStack: event.target.value })} /></label>
          <label>Hands<input type="number" min="1" max="100" value={form.hands} onChange={(event) => updateForm({ hands: Number(event.target.value) })} /></label>
          <label>End condition<select value={form.endCondition} onChange={(event) => updateForm({ endCondition: event.target.value })}><option value="hands">After hand target</option><option value="human_left">When human leaves</option><option value="manual">Manual stop</option></select></label>
        </div>
        <label className="bot-tests__check"><input type="checkbox" checked={form.continueWithoutHuman} disabled={form.allowBotOnly} onChange={(event) => updateForm({ continueWithoutHuman: event.target.checked })} /><span><strong>Continue when humans leave or sit out</strong><small>Keeps the scenario alive instead of stopping the bots.</small></span></label>

        <div className="bot-profiles"><div className="bot-profiles__heading"><h4>Per-bot behavior</h4><span>Each bot can test a different action pattern.</span></div>
          {form.botProfiles.map((profile, index) => <details className="bot-profile" key={index} open={index === 0}>
            <summary><strong>{profile.name || `Test Bot ${index + 1}`}</strong><span>{profile.strategy.replace('_', ' ')} · {profile.startingStack} FP</span></summary>
            <div className="bot-profile__grid">
              <label>Name<input maxLength="24" value={profile.name} onChange={(event) => updateProfile(index, { name: event.target.value })} /></label>
              <label>Buy-in FP<input type="number" step="0.01" min={selected?.minBuyIn || 0.01} max={selected?.maxBuyIn || undefined} value={profile.startingStack} onChange={(event) => updateProfile(index, { startingStack: event.target.value })} /></label>
              <label>Strategy<select value={profile.strategy} onChange={(event) => updateProfile(index, { strategy: event.target.value })}>{STRATEGIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>Aggression %<input type="number" min="0" max="100" value={profile.aggression} onChange={(event) => updateProfile(index, { aggression: Number(event.target.value) })} /></label>
              <label>Bluff %<input type="number" min="0" max="100" value={profile.bluffFrequency} onChange={(event) => updateProfile(index, { bluffFrequency: Number(event.target.value) })} /></label>
              <label>Fold %<input type="number" min="0" max="100" value={profile.foldFrequency} onChange={(event) => updateProfile(index, { foldFrequency: Number(event.target.value) })} /></label>
              <label>Think min (sec)<input type="number" min="0.1" max="12" step="0.1" value={profile.thinkTimeMinMs / 1000} onChange={(event) => updateProfile(index, { thinkTimeMinMs: Number(event.target.value) * 1000 })} /></label>
              <label>Think max (sec)<input type="number" min="0.1" max="14" step="0.1" value={profile.thinkTimeMaxMs / 1000} onChange={(event) => updateProfile(index, { thinkTimeMaxMs: Number(event.target.value) * 1000 })} /></label>
              <label className="bot-tests__check"><input type="checkbox" checked={profile.rebuy} onChange={(event) => updateProfile(index, { rebuy: event.target.checked })} /><span><strong>Buy back after bust</strong><small>A zero stack loses its seat first, then makes a fresh buy-in.</small></span></label>
            </div>
          </details>)}
        </div>

        <label>Audit reason<textarea minLength="3" required value={form.reason} onChange={(event) => updateForm({ reason: event.target.value })} placeholder="What scenario are you validating?" /></label>
        <div className="bot-tests__gate"><strong>{form.allowBotOnly ? 'Spectator mode enabled.' : 'Human-start gate enabled.'}</strong><span>Bot identities and every action are retained in the run log. Tests remain limited to non-withdrawable FP tables.</span></div>
        {activeRun && <div className="bot-tests__active-warning">A test is already active on <strong>{activeRun.tableName || activeRun.ringId}</strong>. Stop it before starting another table.</div>}
        <button className="bot-tests__deploy" disabled={submitting || activeRun || !selected || Number(botCapacity || 0) < form.botCount || selected.tableStatus !== 'ACTIVE'}>{submitting ? 'STARTING…' : 'START BOT TEST'}</button>
      </form> : <div className="bot-tests__panel bot-tests__empty"><strong>Bot tests are read only.</strong><span>Your delegated access allows run-log review but not starting or stopping test players.</span></div>}

      <div className="bot-tests__panel bot-tests__runs"><div className="bot-tests__panel-heading"><h3>Run logs</h3><button type="button" onClick={() => refresh()}>Refresh</button></div>
        {!runs.length && <div className="bot-tests__empty">No bot tests recorded yet.</div>}
        {runs.map((run) => <article className="bot-run" key={run.runId}>
          <div><span className={`bot-run__status is-${run.status.toLowerCase()}`}>{run.status.replaceAll('_', ' ')}</span><strong>{run.tableName || run.ringId}</strong><small>{run.config.botCount} bots · {run.completedHands}/{run.config.hands} hands · {run.botsJoined} seated · {run.botsWaiting || 0} waiting</small></div>
          {run.error && <p className="bot-run__error">{run.error}</p>}
          {run.stoppedReason && <p>{run.stoppedReason}</p>}
          <div className="bot-run__actions"><button type="button" onClick={() => setExpandedRun(expandedRun === run.runId ? '' : run.runId)}>{expandedRun === run.runId ? 'Hide log' : 'View log'}</button>{canManage && ACTIVE.has(run.status) && <button type="button" onClick={() => stop(run)} disabled={run.status === 'STOPPING'}>{run.status === 'STOPPING' ? 'Stopping…' : 'Stop & remove'}</button>}</div>
          {expandedRun === run.runId && <div className="bot-run__events">{(run.events || []).slice().reverse().map((event, index) => <div key={`${event.at}-${index}`}><time>{new Date(event.at).toLocaleTimeString()}</time><strong>{String(event.type || 'event').replaceAll('-', ' ')}</strong><span>{[
            event.username,
            event.action,
            Number.isFinite(event.amount) ? `amount ${event.amount}` : null,
            event.round,
            event.gameStatus,
            Number.isFinite(event.pot) ? `pot ${event.pot}` : null,
            Number.isFinite(event.sidePotTotal) && event.sidePotTotal > 0 ? `side pots ${event.sidePotTotal}` : null,
            event.intent,
            event.message,
          ].filter((value) => value !== null && value !== undefined && value !== '').join(' · ')}</span></div>)}{!(run.events || []).length && <span>No events persisted for this run.</span>}</div>}
        </article>)}
      </div>
    </div>
  </section>;
}

export default connect(({ Auth }) => ({ role: Auth.role, permissions: Auth.permissions }))(BotTests);
