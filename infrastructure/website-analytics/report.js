'use strict';

const crypto = require('node:crypto');

function queryFor({ database, appId, days, now = new Date() }) {
  if (!/^[a-z][a-z0-9_]{0,127}$/.test(database || '') || !/^[a-zA-Z0-9_-]{1,128}$/.test(appId || '')) throw new Error('Invalid analytics configuration');
  if (![7, 30, 90].includes(days)) throw new Error('Invalid reporting period');
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end.getTime() - days * 86400000);
  const date = value => value.toISOString().slice(0, 10);
  // An OR of exact partition tuples prunes correctly across month/year boundaries.
  const partitions = Array.from({ length: days }, (_, index) => {
    const value = new Date(start.getTime() + index * 86400000);
    return `(partition_year = '${value.getUTCFullYear()}' AND partition_month = '${String(value.getUTCMonth() + 1).padStart(2, '0')}' AND partition_day = '${String(value.getUTCDate()).padStart(2, '0')}')`;
  }).join(' OR ');
  const sql = `WITH ranked AS (
    SELECT *, row_number() OVER (PARTITION BY event_id ORDER BY ingest_time_msec DESC) AS delivery
    FROM "${database}"."event_v2"
    WHERE partition_app = '${appId}' AND (${partitions})
      AND event_timestamp >= TIMESTAMP '${date(start)} 00:00:00'
      AND event_timestamp < TIMESTAMP '${date(end)} 00:00:00'
      AND platform = 'Web'
  ), events AS (
    SELECT *, concat(user_pseudo_id, ':', session_id) AS visitor_session FROM ranked WHERE delivery = 1
  ), summary AS (
    SELECT 'summary' AS kind, 'all' AS label,
      count(DISTINCT user_pseudo_id) AS visitors, count(DISTINCT visitor_session) AS sessions,
      count_if(event_name = '_page_view') AS page_views,
      count_if(event_name = 'mpc_cta_click' AND (element_at(custom_parameters, 'target')).value = 'play_game') AS game_clicks,
      coalesce(sum(CASE WHEN event_name = '_user_engagement' THEN user_engagement_time_msec ELSE 0 END), 0) AS engagement_ms,
      count(DISTINCT CASE WHEN event_name = 'mpc_cta_click' AND (element_at(custom_parameters, 'target')).value = 'play_game' THEN visitor_session END) AS game_sessions,
      cast(max(event_timestamp) AS varchar) AS latest_event
    FROM events
  ), daily AS (
    SELECT 'daily' AS kind, cast(cast(event_timestamp AS date) AS varchar) AS label,
      count(DISTINCT user_pseudo_id) AS visitors, count(DISTINCT visitor_session) AS sessions,
      count_if(event_name = '_page_view') AS page_views,
      count_if(event_name = 'mpc_cta_click' AND (element_at(custom_parameters, 'target')).value = 'play_game') AS game_clicks,
      0 AS engagement_ms, 0 AS game_sessions, '' AS latest_event
    FROM events GROUP BY 2
  ), pages AS (
    SELECT 'pages' AS kind, coalesce(nullif(page_view_page_url_path, ''), '/') AS label,
      count(DISTINCT user_pseudo_id) AS visitors, count(DISTINCT visitor_session) AS sessions,
      count(*) AS page_views, 0 AS game_clicks, 0 AS engagement_ms, 0 AS game_sessions, '' AS latest_event
    FROM events WHERE event_name = '_page_view' GROUP BY 2 ORDER BY page_views DESC LIMIT 15
  ), sources AS (
    SELECT 'sources' AS kind, coalesce(nullif(page_view_latest_referrer_host, ''), 'Direct') AS label,
      count(DISTINCT user_pseudo_id) AS visitors, count(DISTINCT visitor_session) AS sessions,
      count(*) AS page_views, 0 AS game_clicks, 0 AS engagement_ms, 0 AS game_sessions, '' AS latest_event
    FROM events WHERE event_name = '_page_view' GROUP BY 2 ORDER BY visitors DESC LIMIT 10
  ), devices AS (
    SELECT 'devices' AS kind, coalesce(nullif(device_ua_device_category, ''), 'Unknown') AS label,
      count(DISTINCT user_pseudo_id) AS visitors, count(DISTINCT visitor_session) AS sessions,
      count(*) AS page_views, 0 AS game_clicks, 0 AS engagement_ms, 0 AS game_sessions, '' AS latest_event
    FROM events WHERE event_name = '_page_view' GROUP BY 2 ORDER BY sessions DESC LIMIT 10
  ), actions AS (
    SELECT 'actions' AS kind, coalesce((element_at(custom_parameters, 'target')).value, 'Other') AS label,
      count(DISTINCT user_pseudo_id) AS visitors, count(DISTINCT visitor_session) AS sessions,
      count(*) AS page_views, 0 AS game_clicks, 0 AS engagement_ms, 0 AS game_sessions, '' AS latest_event
    FROM events WHERE event_name = 'mpc_cta_click' GROUP BY 2 ORDER BY page_views DESC LIMIT 15
  ) SELECT * FROM summary UNION ALL SELECT * FROM daily UNION ALL SELECT * FROM pages
    UNION ALL SELECT * FROM sources UNION ALL SELECT * FROM devices UNION ALL SELECT * FROM actions`;
  return { sql, startDate: date(start), endDate: date(new Date(end.getTime() - 1)), days };
}

function reportFromRows(rows, period, generatedAt) {
  const numeric = row => ({
    label: row.label, visitors: Number(row.visitors || 0), sessions: Number(row.sessions || 0),
    pageViews: Number(row.page_views || 0), gameClicks: Number(row.game_clicks || 0),
  });
  const summary = rows.find(row => row.kind === 'summary') || {};
  const counts = numeric(summary);
  const daily = new Map(rows.filter(row => row.kind === 'daily').map(row => [row.label, numeric(row)]));
  return {
    status: 'ready', source: 'AWS Clickstream · Athena', timezone: 'UTC',
    startDate: period.startDate, endDate: period.endDate, generatedAt,
    latestEventAt: summary.latest_event ? `${summary.latest_event.replace(' ', 'T')}Z` : null,
    summary: {
      visitors: counts.visitors, sessions: counts.sessions, pageViews: counts.pageViews, gameClicks: counts.gameClicks,
      averageEngagementSeconds: counts.sessions ? Math.round(Number(summary.engagement_ms || 0) / counts.sessions / 1000) : 0,
      gameClickRate: counts.sessions ? Math.round(Number(summary.game_sessions || 0) / counts.sessions * 1000) / 10 : 0,
    },
    daily: Array.from({ length: period.days }, (_, index) => {
      const label = new Date(Date.parse(`${period.startDate}T00:00:00Z`) + index * 86400000).toISOString().slice(0, 10);
      return daily.get(label) || { label, visitors: 0, sessions: 0, pageViews: 0, gameClicks: 0 };
    }),
    pages: rows.filter(row => row.kind === 'pages').map(numeric),
    sources: rows.filter(row => row.kind === 'sources').map(numeric),
    devices: rows.filter(row => row.kind === 'devices').map(numeric),
    actions: rows.filter(row => row.kind === 'actions').map(numeric),
  };
}

function queryToken(sql, now = Date.now()) {
  return crypto.createHash('sha256').update(`${sql}:${Math.floor(now / 900000)}`).digest('hex');
}

module.exports = { queryFor, reportFromRows, queryToken };
