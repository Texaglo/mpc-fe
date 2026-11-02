import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ConsoleIcon from '../../components/ConsoleIcon';
import './index.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);
const endpoint = process.env.REACT_APP_WEBSITE_ANALYTICS_API || '';
const number = value => Number(value || 0).toLocaleString();
const actions = { play_game: 'Play Free / Play now', youtube: 'YouTube', discord: 'Discord', marketplace: 'Magic Eden', nft_membership: 'NFT membership', nft_migration: 'NFT migration', legal: 'Rules & Legal' };
const duration = seconds => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
const dateTime = value => value ? new Date(value).toLocaleString() : 'No events received yet';

function Breakdown({ title, icon, rows, measure = 'visitors', label = 'Visitors' }) {
  const largest = Math.max(1, ...rows.map(row => row[measure]));
  return <section className="web-analytics-panel">
    <h3><ConsoleIcon name={icon} />{title}</h3>
    {!rows.length ? <p className="web-analytics-empty">No activity in this period.</p> : <table>
      <thead><tr><th scope="col">{title === 'Top pages' ? 'Page' : 'Name'}</th><th scope="col">{label}</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.label}><td><span>{actions[row.label] || row.label}</span><span aria-hidden="true" className="web-analytics-bar" style={{ width: `${row[measure] / largest * 100}%` }} /></td><td>{number(row[measure])}</td></tr>)}</tbody>
    </table>}
  </section>;
}

export default function WebsiteAnalytics() {
  const auth = useSelector(state => state.Auth.auth);
  const [days, setDays] = useState(30);
  const [reload, setReload] = useState(0);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    const controller = new AbortController();
    let timer;
    setReport(null); setError('');
    if (!endpoint) { setStatus('unconfigured'); return () => controller.abort(); }
    setStatus('loading');
    const started = Date.now();
    const load = async () => {
      try {
        const url = new URL(endpoint);
        if (url.protocol !== 'https:') throw new Error('Analytics connection is not configured correctly.');
        url.searchParams.set('days', days);
        const response = await fetch(url.href, { headers: { Authorization: `Bearer ${auth}` }, credentials: 'omit', signal: controller.signal });
        if (id !== request.current) return;
        const data = await response.json();
        if (response.status === 202) {
          if (Date.now() - started > 120000) throw new Error('The report is taking longer than usual. Please refresh in a moment.');
          timer = window.setTimeout(load, 3000); return;
        }
        if (!response.ok || data.status !== 'ready' || !data.summary || !Array.isArray(data.daily)) {
          throw new Error(data.message || 'Unable to load website analytics.');
        }
        setReport(data); setStatus('ready');
      } catch (failure) {
        if (controller.signal.aborted || id !== request.current) return;
        setError(failure.message || 'Unable to load website analytics.'); setStatus('error');
      }
    };
    load();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [auth, days, reload]);

  const summary = report && report.summary;
  const metrics = summary ? [
    ['users', 'blue', 'Visitors', number(summary.visitors), 'Distinct anonymous browsers'],
    ['link', 'gold', 'Sessions', number(summary.sessions), '30-minute inactivity timeout'],
    ['eye', 'blue', 'Page views', number(summary.pageViews), 'Across the main website'],
    ['controller', 'green', 'Game link clicks', number(summary.gameClicks), 'Play Free / Play now'],
    ['clock', 'gold', 'Avg. engagement', duration(summary.averageEngagementSeconds), 'Active time per session'],
    ['chart', 'green', 'Game click rate', `${summary.gameClickRate}%`, 'Sessions that clicked through'],
  ] : [];

  return <div className="content"><div className="main-container web-analytics-page">
    <header className="web-analytics-heading"><div><p className="web-analytics-eyebrow">AUDIENCE & ACQUISITION</p><h2>Website Analytics</h2><p>Understand how visitors discover Modern Poker Club and reach the game.</p></div>
      <div className="web-analytics-controls"><label><ConsoleIcon name="calendar" /><span className="sr-only">Reporting period</span><select value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label><button type="button" disabled={status === 'loading' || status === 'unconfigured'} onClick={() => setReload(value => value + 1)}>Refresh</button></div>
    </header>
    {status === 'unconfigured' && <section className="web-analytics-state" role="status"><ConsoleIcon name="chart" /><h3>Website analytics is being connected</h3><p>Reports will appear here after the AWS collection pipeline is enabled and receives its first events.</p></section>}
    {status === 'loading' && <section className="web-analytics-state" role="status" aria-live="polite"><ConsoleIcon name="clock" /><h3>Loading your website report</h3><p>Preparing visitors, pages, and traffic sources…</p></section>}
    {status === 'error' && <section className="web-analytics-state is-error" role="alert"><ConsoleIcon name="warning" /><h3>Report unavailable</h3><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)}>Try again</button></section>}
    {report && <>
      <div className="web-analytics-status"><span><i aria-hidden="true" />AWS Clickstream</span><span>{report.startDate} – {report.endDate} · UTC</span><span>Latest event: {dateTime(report.latestEventAt)}</span></div>
      <div className="console-metric-grid web-analytics-metrics">{metrics.map(([icon, color, title, value, hint]) => <div className="console-metric" key={title}><span className={`console-metric-icon ${color}`}><ConsoleIcon name={icon} /></span><div><small>{title}</small><strong>{value}</strong><small className="web-analytics-hint">{hint}</small></div></div>)}</div>
      <section className="web-analytics-panel web-analytics-trend"><div className="web-analytics-panel-heading"><h3><ConsoleIcon name="chart" />Audience over time</h3><span>Daily visitors and sessions</span></div>
        {summary.visitors === 0 ? <p className="web-analytics-empty">No website activity has been processed for this period yet.</p> : <div className="web-analytics-chart"><Line aria-label="Daily website visitors and sessions" role="img" data={{ labels: report.daily.map(row => row.label.slice(5)), datasets: [
          { label: 'Visitors', data: report.daily.map(row => row.visitors), borderColor: '#f3c134', backgroundColor: 'rgba(243,193,52,.1)', fill: true, tension: .25, pointRadius: 2 },
          { label: 'Sessions', data: report.daily.map(row => row.sessions), borderColor: '#26b5f1', backgroundColor: 'transparent', tension: .25, pointRadius: 2 },
        ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#aec5d4', usePointStyle: true } } }, scales: { x: { grid: { display: false }, ticks: { color: '#87a3b5', maxTicksLimit: 12 } }, y: { beginAtZero: true, grid: { color: '#153343' }, ticks: { color: '#87a3b5', precision: 0 } } } }} /></div>}
      </section>
      <div className="web-analytics-breakdowns"><Breakdown title="Top pages" icon="document" rows={report.pages} measure="pageViews" label="Views" /><Breakdown title="Traffic sources" icon="link" rows={report.sources} /><Breakdown title="Devices" icon="pie" rows={report.devices} measure="sessions" label="Sessions" /><Breakdown title="Key actions" icon="bolt" rows={report.actions} measure="pageViews" label="Clicks" /></div>
      <p className="web-analytics-footnote"><ConsoleIcon name="info" />Reports update after AWS processes incoming events and may lag recent visits. Visitors are anonymous browsers, and game link clicks do not confirm a game login. Report generated {dateTime(report.generatedAt)}.</p>
    </>}
  </div></div>;
}
