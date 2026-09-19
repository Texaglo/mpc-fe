import React,{useState,useEffect} from 'react';
import axios from 'axios';
import {Timing,number} from './Evidence';
const download=(data,name)=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};
export default function PlayerAnalysis({userId,manage,canReadHands}){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[payload,setPayload]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;setData(null);setError('');axios.get(`/integrity/players/${userId}/analysis`).then(r=>active&&setData(r.data.body)).catch(e=>active&&setError(e.message));return()=>{active=false;};},[userId]);
 const work=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.response?.data?.message||e.message);}finally{setBusy(false);}};
 const summary=data?.summary;
 return <section className="integrity-card" aria-label="Analysis across hands"><h3>Analysis across hands</h3>
  <p>Up to 1,000 completed hands, 20,000 actions and 90 days per player. Automatic timeout actions are excluded from behavioural timing. These are review signals.</p>
  {manage&&<button className="add-btn" disabled={busy} onClick={()=>work(async()=>{const r=await axios.post(`/integrity/players/${userId}/analyse`,{});setData(r.data.body);})}>Analyze this player's history</button>}
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  {!summary&&<p>No completed analysis yet. Automatic analysis processes players in batches.</p>}
  {summary&&<><p><strong>{number(summary.hands)} hands · {number(summary.actions)} player decisions · {number(summary.complexDecisions)} demanding turn/river decisions</strong></p>
   <p>{data.window?.from&&new Date(data.window.from).toLocaleString()} – {data.window?.to&&new Date(data.window.to).toLocaleString()}{(data.window?.actionLimitReached||data.window?.handLimitReached)&&' · History limit reached'}</p>
   <p>{number(summary.excludedByAssistanceSwitch)} recorded actions excluded by the assistance test switch.</p><Timing stats={summary.timing}/>
   <h4>Reference comparison</h4><p>{summary.solver?.matchedDecisions?`${number(summary.solver.matchedDecisions)} matched decisions (${number(summary.solver.coverage*100)}% coverage).`:'No solver reference matched. GTO accuracy has not been measured.'}</p>
   {!!summary.solver?.matchedDecisions&&<><p>Within 0.01 BB of reference best EV: {number(summary.solver.withinToleranceFraction*100)}% · Mean EV difference: {number(summary.solver.meanRegretBb)} BB.</p><p>Sources: {summary.solver.sources.join(', ')}</p></>}
   {!!summary.solver?.matchedDecisions&&<><p>Action counts compared with the sum of reference probabilities for these exact decisions. Matching these frequencies alone does not establish assistance.</p><table className="integrity-table"><thead><tr><th>Action</th><th>Observed</th><th>Reference expected</th></tr></thead><tbody>{summary.solver.actionFrequencies?.map(f=><tr key={f.action}><td>{f.label}</td><td>{number(f.observed)}</td><td>{number(f.expected)}</td></tr>)}</tbody></table></>}
   <p>{summary.solver?.limitation}</p>
   <details><summary>Compare game types and stakes</summary>{summary.cohorts?.map(c=><div key={c.cohort}><h4>{c.cohort}</h4><p>{c.hands} hands · {c.actions} decisions · {c.complexDecisions} demanding decisions · {c.solver.matchedDecisions} reference matches</p><Timing stats={c.complexTiming}/></div>)}</details>
   <p>Client telemetry: {number(summary.telemetry?.decisions)} decisions reported. {summary.telemetry?.note}</p>
   <p>Current review signals: {data.flags?.length?data.flags.map(f=>f.replace(/_/g,' ')).join(', '):'None met the thresholds in this sample.'}</p>
  </>}
  {manage&&canReadHands&&<details><summary>Offline solver reference workflow</summary><p>Export completed decision contexts for an approved offline solver. Import its reference results with source, version, configuration, reason and decisions. This does not run a solver or certify the supplied reference.</p>
   <button className="add-btn" disabled={busy} onClick={()=>work(async()=>{const r=await axios.get(`/integrity/players/${userId}/decisions`);download(r.data.body,`decisions-${userId}.json`);})}>Export completed decision contexts</button>
   <label>Reference results JSON<textarea className="search-input" rows="6" value={payload} onChange={e=>setPayload(e.target.value)}/></label>
   <button className="add-btn" disabled={busy||!payload.trim()} onClick={()=>work(async()=>{const r=await axios.post('/integrity/solver-references',JSON.parse(payload));setMessage(`${r.data.body.imported} reference decisions imported. Analyze this player again to compare.`);setPayload('');})}>Import reference results</button>
  </details>}
 </section>;
}
