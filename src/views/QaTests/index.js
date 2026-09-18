import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { canAccess } from '../../utils/adminAccess';
import '../Users/index.css';
import '../Integrity/index.css';
const active = run => ['STARTING', 'RUNNING', 'WAITING_FOR_HUMAN', 'WAITING_FOR_NEXT_HAND', 'STOPPING'].includes(run.status);
export function QaTests({ role, permissions }) {
  const [options, setOptions] = useState(null), [runs, setRuns] = useState([]), [error, setError] = useState('');
  const [mode, setMode] = useState('heads_up'), [maxHands, setMaxHands] = useState(600), [minutes, setMinutes] = useState(240);
  const [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [report, setReport] = useState(null);
  const manage = canAccess({ role, permissions }, 'bots.manage');
  const failure = e => setError(e.response?.data?.message || e.message);
  const refresh = useCallback(async () => {
    const [o, r] = await Promise.all([axios.get('/admin/table-bot-runs/qa-options'), axios.get('/admin/table-bot-runs')]);
    setOptions(o.data.body); setRuns(r.data.body);
  }, []);
  useEffect(() => { refresh().catch(failure); const timer = setInterval(() => refresh().catch(failure), 5000); return () => clearInterval(timer); }, [refresh]);
  const change = async (path, body) => {
    if (reason.trim().length < 3) { setError('Enter an audit reason before starting or stopping a test.'); return; }
    setBusy(true); setError('');
    try { await axios.post(`/admin/table-bot-runs/${path}`, { ...body, reason }); setReason(''); await refresh(); }
    catch (e) { failure(e); } finally { setBusy(false); }
  };
  const loadReport = async (run, download = false) => {
    setBusy(true); setError('');
    try {
      const r = (await axios.get(`/admin/table-bot-runs/${run.runId}/qa-report`)).data.body; setReport(r);
      if (download) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `${run.runId}-qa-report.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) { failure(e); } finally { setBusy(false); }
  };
  return <div className="content"><main className="main-container users-container integrity-page">
    <div className="main-container-head"><h2 className="main-container-heading">Safe game tests</h2><button className="add-btn" onClick={() => refresh().catch(failure)}>Refresh</button></div>
    <p className="integrity-help">Real bot games on a new reserved Free Play table. Human accounts cannot join. Normal shuffling, betting, settlement and hand histories are used. No cards or outcomes are forced.</p>
    {options && !options.enabled && <p role="status">Test presets are disabled on this backend. Enable them on a development or staging backend; production runs are blocked.</p>}
    {error && <p role="alert" className="integrity-error">{error}</p>}
    {manage && <form className="integrity-card" onSubmit={e => { e.preventDefault(); change('qa', { mode, maxHands: Number(maxHands), runSeconds: Number(minutes) * 60 }); }}>
      <fieldset disabled={busy}>
        <label>Test preset<select className="search-input" value={mode} onChange={e => setMode(e.target.value)}>{Object.entries(options?.presets || {}).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}</select></label>
        <p>{mode === 'integrity' ? 'Target: at least 60 completed hands and 6 stored behavior review alerts supported by this run. Shared IP alerts do not count.' : 'Target: 4 naturally occurring split hands. Multi-player results also identify tied side pots and a different main-pot winner when they occur.'}</p>
        <div className="integrity-actions"><label>Maximum hands<input className="search-input" type="number" min="1" max="1500" required value={maxHands} onChange={e => setMaxHands(e.target.value)} /></label><label>Maximum minutes<input className="search-input" type="number" min="1" max="240" required value={minutes} onChange={e => setMinutes(e.target.value)} /></label></div>
        <label>Audit reason<input className="search-input" value={reason} onChange={e => setReason(e.target.value)} minLength="3" required /></label>
        <p className="integrity-help">The run stops at its target or limit. A limit reached without enough examples is incomplete, not a pass. Stop & remove uses normal bot departure and settlement. Histories remain available after stopping.</p>
        <button className="add-btn" disabled={!options?.enabled || runs.some(active)}>Start safe test</button>
      </fieldset>
    </form>}
    {runs.some(active) && <p role="status">A bot run is active. Only one run can operate at a time.</p>}
    <section className="integrity-card" aria-label="QA runs"><h3>Test runs</h3>
      {runs.filter(r => r.config.qa).map(run => <article className="integrity-record" key={run.runId}>
        <h4>{run.config.qa.label} · {run.status}</h4><p>{run.tableName} · {run.runId}</p>
        <p>{run.qaSummary?.completedHands ?? run.completedHands} completed hands · {run.qaSummary?.splitHands || 0} split hands · {run.qaSummary?.behaviorAlerts || 0} behavior alerts</p>
        <p>{run.error || run.stoppedReason}</p>
        <div className="integrity-actions"><button className="add-btn" disabled={busy} onClick={() => loadReport(run)}>View results</button><button className="add-btn" disabled={busy} onClick={() => loadReport(run, true)}>Download report</button>{manage && active(run) && <button className="add-btn" disabled={busy || run.status === 'STOPPING'} onClick={() => change(`${run.runId}/stop`, {})}>Stop & remove</button>}</div>
      </article>)}
      {!runs.some(r => r.config.qa) && <p>No preset runs yet.</p>}
    </section>
    {report && <section className="integrity-card" aria-label="Test results"><h3>Observed results</h3><p>Table: {report.tableId} · Results captured {new Date(report.generatedAt).toLocaleString()}. Use View results again to refresh.</p>
      <p>{report.summary.goalReached ? 'Observation target reached' : 'Observation target not reached'} · {report.summary.completedHands} hands · {report.summary.actionCount} history records</p>
      <p>{report.summary.splitHands} split hands · {report.summary.sidePotHands} side-pot hands · {report.summary.tiedSidePotHands} tied side pots · {report.summary.differentMainWinnerHands} with a different main-pot winner</p>
      <p>{!report.summary.completedHands ? 'No completed hands to verify yet.' : report.summary.stackConservationFailures.length ? 'Stack conservation FAILED — inspect the affected histories.' : 'Starting and ending stacks balance in all completed hands.'}</p>
      <p className="integrity-help">Open Players → Hand History using a hand ID below for cards, bets, folds and per-pot payments. Alert review, player restrictions and withdrawal holds are in Integrity & Reports.</p>
      {report.alerts.map(a => <p key={a._id}>{a.rule.replace(/_/g, ' ')} · {a.status} · {a._id} {canAccess({ role, permissions }, 'integrity.view') && a.users?.[0] && <a className="integrity-player" href={`#/home/integrity?player=${encodeURIComponent(a.users[0])}`}>Review player and actions</a>}</p>)}
      <details><summary>Recent completed hand IDs (all hands in download)</summary>{report.hands.slice(-20).map(h => <p key={h.handId}>{h.handId}</p>)}</details>
      {report.summary.splitHandIds.map(id => <details key={id}><summary>{id}</summary><pre>{JSON.stringify(report.hands.find(h => h.handId === id)?.sidePots, null, 2)}</pre></details>)}
    </section>}
  </main></div>;
}
export default connect(({ Auth }) => ({ role: Auth.role, permissions: Auth.permissions }))(QaTests);
