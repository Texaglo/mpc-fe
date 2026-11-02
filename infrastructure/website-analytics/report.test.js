const { test } = require('node:test');
const assert = require('node:assert/strict');
const { queryFor, reportFromRows, queryToken } = require('./report');

test('partitions cover year boundaries and only allow fixed reporting periods', () => {
  const period = queryFor({ database: 'mpc_website', appId: 'mpc_web', days: 7, now: new Date('2027-01-03T04:00:00Z') });
  assert.equal(period.startDate, '2026-12-28');
  assert.equal(period.endDate, '2027-01-03');
  assert.match(period.sql, /partition_year = '2026' AND partition_month = '12' AND partition_day = '28'/);
  assert.match(period.sql, /partition_year = '2027' AND partition_month = '01' AND partition_day = '03'/);
  assert.match(period.sql, /PARTITION BY event_id/);
  // Guidance event_v2 stores custom values as map<string, struct<value:string,type:string>>.
  assert.match(period.sql, /element_at\(custom_parameters, 'target'\)\)\.value/);
  assert.throws(() => queryFor({ database: 'mpc; DROP TABLE users', appId: 'web', days: 7 }));
  assert.throws(() => queryFor({ database: 'mpc', appId: "web' OR true", days: 7 }));
  assert.throws(() => queryFor({ database: 'mpc', appId: 'web', days: 365 }));
});

test('reports preserve zero counts and do not sum daily distinct visitors into the period total', () => {
  const period = { startDate: '2026-11-01', endDate: '2026-11-07', days: 7 };
  const report = reportFromRows([
    { kind: 'summary', visitors: '2', sessions: '3', page_views: '5', game_clicks: '2', engagement_ms: '150000', game_sessions: '1', latest_event: '2026-11-02 12:00:00.000' },
    { kind: 'daily', label: '2026-11-01', visitors: '2', sessions: '2', page_views: '3', game_clicks: '1' },
    { kind: 'daily', label: '2026-11-02', visitors: '1', sessions: '1', page_views: '2', game_clicks: '1' },
  ], period, '2026-11-02T12:05:00Z');
  assert.equal(report.summary.visitors, 2);
  assert.equal(report.summary.averageEngagementSeconds, 50);
  assert.equal(report.summary.gameClickRate, 33.3);
  assert.equal(report.daily.length, 7);
  assert.equal(report.daily[6].pageViews, 0);
  assert.equal(report.latestEventAt, '2026-11-02T12:00:00.000Z');
  const empty = reportFromRows([], period, 'now');
  assert.equal(empty.summary.visitors, 0);
  assert.equal(empty.summary.gameClickRate, 0);
  assert.equal(empty.latestEventAt, null);
});

test('queries share idempotency tokens inside a 15-minute window', () => {
  assert.equal(queryToken('SELECT 1', 1000), queryToken('SELECT 1', 2000));
  assert.notEqual(queryToken('SELECT 1', 1000), queryToken('SELECT 1', 900001));
  assert.notEqual(queryToken('SELECT 1', 1000), queryToken('SELECT 2', 1000));
});
