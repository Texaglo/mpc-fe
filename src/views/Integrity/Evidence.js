import React, {useState} from 'react';
export const number = v => v === null || v === undefined ? 'Not available' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'number' ? v.toLocaleString(undefined,{maximumFractionDigits:3}) : String(v);
const date=v=>v?new Date(v).toLocaleString():'Not recorded';
export const handUrl=id=>`#/home/hand-history?hand=${encodeURIComponent(id)}`;
export function Timing({stats}) {
 if(!stats?.samples)return <p>No usable server timing measurements in this sample.</p>;
 return <><p>{number(stats.samples)} timed decisions · Median {number(stats.medianMs)} ms · 95th percentile {number(stats.p95Ms)} ms · Mean {number(stats.meanMs)} ms</p>
  <div className="integrity-stats">{(stats.distribution||[]).map(b=><div key={b.label}><strong>{number(b.count)}</strong><span>{b.label}</span><meter min="0" max={stats.samples} value={b.count} aria-label={b.label} /></div>)}</div></>;
}
export default function Evidence({item,canReadHands}) {
 const [shown,setShown]=useState(20);
 const p=item.evidence?.presentation;
 const name=id=>item.playerDetails?.find(x=>x.id===String(id))?.name||String(id);
 const link=id=>canReadHands?<a href={handUrl(id)}>Open hand {id}</a>:<span>Hand {id} · Hand History permission required</span>;
 const metrics=p?.metrics||Object.entries(item.evidence||item.data||{}).filter(([k,v])=>k!=='version'&&['number','boolean','string'].includes(typeof v)).map(([label,value])=>({label:label.replace(/([A-Z])/g,' $1').replace(/_/g,' '),value}));
 return <section className="integrity-evidence" aria-label="Case evidence">
  <p>{p?.summary||(item.kind==='going_south_blocked'?'Return buy-in was below the server-recorded 60-minute minimum. The backend rejected the join.':item.rule?'This older case contains a limited evidence snapshot. Run analysis to collect the new readable hand-based evidence where source records are available.':'Recorded operational evidence.')}</p>
  {p?.threshold&&<p><strong>Why this was flagged:</strong> {p.threshold}</p>}
  {p?.window?.actions>0&&<p><strong>Sample:</strong> {number(p.window.hands)} hands, {number(p.window.actions)} actions · {date(p.window.from)} – {date(p.window.to)}{p.window.actionLimitReached||p.window.handLimitReached?' · History limit reached':''}</p>}
  <dl className="integrity-metrics">{metrics.map(m=><div key={m.label}><dt>{m.label}</dt><dd>{number(m.value)}</dd></div>)}</dl>
  {p?.timing?.samples>0&&<details><summary>Decision-time statistics</summary><Timing stats={p.timing}/></details>}
  {!!p?.triggerHandIds?.length&&<details><summary>Hands matching the flagged pattern ({p.triggerHandIds.length})</summary><ol>{p.triggerHandIds.slice(0,shown).map(id=><li key={id}>{link(id)}</li>)}</ol>{shown<p.triggerHandIds.length&&<button className="add-btn" onClick={()=>setShown(shown+20)}>Show 20 more matching hands</button>}</details>}
  {!!p?.examples?.length&&<details><summary>Recorded decisions ({p.examples.length} examples)</summary><div className="integrity-table-scroll"><table className="integrity-table"><thead><tr><th>Time / player</th><th>Street / action</th><th>Time to act</th><th>Call / pot / committed</th><th>History</th></tr></thead><tbody>{p.examples.map((e,i)=><tr key={e.eventId||i}><td>{date(e.at)}<br/>{name(e.userId)}</td><td>{e.street} · {e.action}</td><td>{number(e.decisionMs)} ms</td><td>{number(e.callAmount)} / {number(e.potBefore)} / {number(e.committed)}</td><td>{e.handId&&link(e.handId)}</td></tr>)}</tbody></table></div></details>}
  {!!p?.results?.length&&<details><summary>Chip results by hand ({p.results.length} examples)</summary>{p.results.map((h,i)=><p key={h.handId||i}>{link(h.handId)} · {h.players.map(x=>`${name(x.userId)}: ${number(x.net)} chips`).join(' · ')}</p>)}</details>}
  {!!p?.handIds?.length&&<details><summary>Contributing hand histories ({p.handIds.length})</summary><p>The full sample includes context hands; examples and measurements explain which pattern triggered review.</p><ol>{p.handIds.slice(0,shown).map(id=><li key={id}>{link(id)}</li>)}</ol>{shown<p.handIds.length&&<button className="add-btn" onClick={()=>setShown(shown+20)}>Show 20 more hands</button>}</details>}
  {!p?.handIds?.length&&item.handId&&<p>{link(item.handId)}</p>}
  {p?.limitations&&<details><summary>Limits and next review steps</summary><ul>{[...p.limitations,...(p.nextSteps||[])].map(x=><li key={x}>{x}</li>)}</ul></details>}
  <details><summary>Technical record</summary><pre>{JSON.stringify(item.evidence||item.data||{actor:item.actorId,target:item.target,before:item.before,after:item.after},null,2)}</pre></details>
 </section>;
}
