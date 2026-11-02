import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ConsoleIcon from '../../components/ConsoleIcon';
import './index.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);
const endpoint = process.env.REACT_APP_WEBSITE_ANALYTICS_API || '';
const number = value => Number(value || 0).toLocaleString();
const ZONES = [['America/Jamaica', 'Jamaica · UTC−5'], ['America/Chicago', 'Texas · Central time'], ['America/New_York', 'US Eastern time'], ['America/Los_Angeles', 'US Pacific time'], ['Europe/London', 'London time'], ['UTC', 'UTC']];
const dateTime = (value, timezone = 'UTC') => new Date(value).toLocaleString(undefined, { timeZone: timezone, timeZoneName: 'short' });
const average = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const chartOptions = { responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${average(context.raw)} average page views` } } },
  scales: { x: { grid: { display: false }, ticks: { color: '#93afc1', maxTicksLimit: 12 } }, y: { beginAtZero: true, grid: { color: '#153343' }, ticks: { color: '#93afc1' } } } };

function PatternChart({ title, subtitle, rows, color = '#f3c134', kind }) {
  return <section className={`web-analytics-panel web-analytics-pattern ${kind === 'monthDays' ? 'web-analytics-wide' : ''}`}>
    <div className="web-analytics-panel-heading"><h3><ConsoleIcon name="chart" />{title}</h3></div>
    <p className="web-analytics-chart-hint">{subtitle}</p>
    {!rows.some(row => row.pageViews > 0) ? <p className="web-analytics-empty">Collecting timed visits. Your traffic patterns will appear here.</p> : <div className="web-analytics-chart web-analytics-bars"><Bar role="img" aria-label={title} data={{ labels: rows.map(row => kind === 'weekdays' ? row.label.slice(0, 3) : row.label), datasets: [{ label: 'Average page views', data: rows.map(row => row.averageViews), backgroundColor: color, borderRadius: 4, maxBarThickness: 30 }] }} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { callbacks: { title: contexts => rows[contexts[0].dataIndex].label, label: context => {
      const row = rows[context.dataIndex];
      return [`${average(row.averageViews)} average page views`, `${number(row.pageViews)} total page views`, `${number(row.sessions)} visits with page activity`, `${row.observations} observed ${kind === 'hours' ? 'hour slots' : 'days'}`];
    } } } } }} /></div>}
  </section>;
}

function Peak({ title, rows, kind }) {
  const peak = rows.filter(row => row.pageViews > 0 && row.averageViews !== null).sort((a, b) => b.averageViews - a.averageViews)[0];
  const tied = peak && rows.filter(row => row.pageViews > 0 && row.averageViews === peak.averageViews).length > 1;
  return <div className="web-analytics-peak"><span>{title}</span><strong>{peak ? (kind === 'monthDays' ? `Day ${peak.label}` : peak.label) : 'Collecting data'}</strong><small>{peak ? `${average(peak.averageViews)} avg. views / ${kind === 'hours' ? 'hour slot' : 'day'}${tied ? ' · tied peak' : ''}` : 'Appears as new visits arrive'}</small></div>;
}

function Breakdown({ title, icon, rows, measure = 'visitors', label = 'Visitors' }) {
  const largest = Math.max(1, ...rows.map(row => row[measure]));
  return <section className="web-analytics-panel">
    <h3><ConsoleIcon name={icon} />{title}</h3>
    {!rows.length ? <p className="web-analytics-empty">No activity in this period.</p> : <table>
      <thead><tr><th scope="col">{title === 'Top pages' ? 'Page' : 'Name'}</th><th scope="col">{label}</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.label}><td><span>{row.label}</span><span aria-hidden="true" className="web-analytics-bar" style={{ width: `${row[measure] / largest * 100}%` }} /></td><td>{number(row[measure])}</td></tr>)}</tbody>
    </table>}
  </section>;
}

export default function WebsiteAnalytics() {
  const auth = useSelector(state => state.Auth.auth);
  const [days, setDays] = useState(30);
  const [timezone, setTimezone] = useState('America/Jamaica');
  const [reload, setReload] = useState(0);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    const controller = new AbortController();
    setReport(null); setError('');
    if (!endpoint) { setStatus('unconfigured'); return () => controller.abort(); }
    setStatus('loading');
    const load = async () => {
      try {
        const url = new URL(endpoint);
        if (url.protocol !== 'https:') throw new Error('Analytics connection is not configured correctly.');
        url.searchParams.set('days', days);
        url.searchParams.set('timezone', timezone);
        const response = await fetch(url.href, { headers: { Authorization: `Bearer ${auth}` }, credentials: 'omit', signal: controller.signal });
        if (id !== request.current) return;
        const data = await response.json();
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
    return () => controller.abort();
  }, [auth, days, timezone, reload]);

  const summary = report && report.summary;
  const metrics = summary ? [
    ['users', 'blue', 'Visitors', number(summary.visitors), 'Distinct anonymous browsers'],
    ['link', 'gold', 'Visits', number(summary.sessions), 'New visit after 30 minutes without a page view'],
    ['eye', 'blue', 'Page views', number(summary.pageViews), 'Across the main website'],
  ] : [];

  return <div className="content"><div className="main-container web-analytics-page">
    <header className="web-analytics-heading"><div><p className="web-analytics-eyebrow">AUDIENCE & ACQUISITION</p><h2>Website Analytics</h2><p>See how many people visit Modern Poker Club and where they visit from, and when traffic peaks.</p></div>
      <div className="web-analytics-controls"><label><ConsoleIcon name="calendar" /><span className="sr-only">Reporting period</span><select value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label><label><ConsoleIcon name="clock" /><span className="sr-only">Reporting time zone</span><select value={timezone} onChange={event => setTimezone(event.target.value)}>{ZONES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" disabled={status === 'loading' || status === 'unconfigured'} onClick={() => setReload(value => value + 1)}>Refresh</button></div>
    </header>
    {status === 'unconfigured' && <section className="web-analytics-state" role="status"><ConsoleIcon name="chart" /><h3>Website analytics is being connected</h3><p>Reports will appear here after website tracking is enabled.</p></section>}
    {status === 'loading' && <section className="web-analytics-state" role="status" aria-live="polite"><ConsoleIcon name="clock" /><h3>Loading your website report</h3><p>Preparing visitors, pages, and traffic sources…</p></section>}
    {status === 'error' && <section className="web-analytics-state is-error" role="alert"><ConsoleIcon name="warning" /><h3>Report unavailable</h3><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)}>Try again</button></section>}
    {report && <>
      <div className="web-analytics-status"><span><i aria-hidden="true" />Website visitor counter</span><span>{report.startDate} – {report.endDate} · {report.timezone || 'UTC'}</span><span>Updated: {dateTime(report.generatedAt, report.timezone)}</span></div>
      <div className="console-metric-grid web-analytics-metrics">{metrics.map(([icon, color, title, value, hint]) => <div className="console-metric" key={title}><span className={`console-metric-icon ${color}`}><ConsoleIcon name={icon} /></span><div><small>{title}</small><strong>{value}</strong><small className="web-analytics-hint">{hint}</small></div></div>)}</div>
      <section className="web-analytics-panel web-analytics-trend"><div className="web-analytics-panel-heading"><h3><ConsoleIcon name="chart" />Audience over time</h3><span>Daily visitors and visits</span></div>
        {summary.visitors === 0 ? <p className="web-analytics-empty">No website activity has been processed for this period yet.</p> : <div className="web-analytics-chart"><Line aria-label="Daily website visitors and sessions" role="img" data={{ labels: report.daily.map(row => row.label.slice(5)), datasets: [
          { label: 'Visitors', data: report.daily.map(row => row.visitors), borderColor: '#f3c134', backgroundColor: 'rgba(243,193,52,.1)', fill: true, tension: .25, pointRadius: 2 },
          { label: 'Visits', data: report.daily.map(row => row.sessions), borderColor: '#26b5f1', backgroundColor: 'transparent', tension: .25, pointRadius: 2 },
        ] }} options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { color: '#aec5d4', usePointStyle: true } } }, scales: { x: { grid: { display: false }, ticks: { color: '#87a3b5', maxTicksLimit: 12 } }, y: { beginAtZero: true, grid: { color: '#153343' }, ticks: { color: '#87a3b5', precision: 0 } } } }} /></div>}
      </section>
      {report.patterns && <>
        <div className="web-analytics-section-title"><div><p className="web-analytics-eyebrow">WHEN YOUR AUDIENCE VISITS</p><h3>Traffic patterns</h3></div><span>{report.timezone} · 24-hour clock</span></div>
        <div className="web-analytics-peaks"><Peak title="Busiest hour" rows={report.patterns.hours} kind="hours" /><Peak title="Busiest weekday" rows={report.patterns.weekdays} kind="weekdays" /><Peak title="Busiest date of the month" rows={report.patterns.monthDays} kind="monthDays" /></div>
        <div className="web-analytics-patterns"><PatternChart title="Time of day" subtitle="Average page views for each hour of the day" rows={report.patterns.hours} kind="hours" /><PatternChart title="Day of the week" subtitle="Average page views per observed weekday" rows={report.patterns.weekdays} kind="weekdays" color="#26b5f1" /><PatternChart title="Date of the month" subtitle="Average page views on each calendar date, across the selected months" rows={report.patterns.monthDays} kind="monthDays" color="#31c996" /></div>
        <p className="web-analytics-footnote"><ConsoleIcon name="info" />Averages use only the hours and days observed since detailed tracking began{report.coverage?.detailsStartAt ? ` (${dateTime(report.coverage.detailsStartAt, report.timezone)})` : ''}. First and current days may be partial. Dates not yet observed have no bar. {number(report.coverage?.timedPageViews)} timed page views; {number(report.coverage?.legacyPageViews)} older views have no hour and retain their original UTC date in the daily totals.</p>
      </>}
      {report.countries && <>
        <div className="web-analytics-section-title"><div><p className="web-analytics-eyebrow">WHERE YOUR AUDIENCE VISITS FROM</p><h3>Visitor locations</h3></div><span>{number(report.coverage?.locatedPageViews)} views with a known country</span></div>
        <div className="web-analytics-breakdowns"><Breakdown title="Countries" icon="location" rows={report.countries} /><Breakdown title="Regions / states" icon="location" rows={report.regions} /></div>
        <p className="web-analytics-footnote"><ConsoleIcon name="info" />Approximate network location, not GPS. VPNs and mobile networks can affect accuracy. Unknown includes older visits and locations AWS could not identify. A visitor may appear in more than one region. Raw IP addresses are not stored.</p>
      </>}
      <div className="web-analytics-breakdowns"><Breakdown title="Top pages" icon="document" rows={report.pages} measure="pageViews" label="Views" /><Breakdown title="Traffic sources" icon="link" rows={report.sources} /><Breakdown title="Devices" icon="pie" rows={report.devices} measure="sessions" label="Visits" /></div>
      <p className="web-analytics-footnote"><ConsoleIcon name="info" />Counts refresh within about a minute. Visitors are distinct anonymous browsers, not verified individuals or game logins. Privacy settings and ad blockers may reduce counts. Report generated {dateTime(report.generatedAt, report.timezone)}.</p>
    </>}
  </div></div>;
}
