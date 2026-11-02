'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, datesFor, summarize } = require('./model');
test('cross-day visitors and sessions are distinct over the full range', () => {
  const r = summarize([
    { date: '2026-11-01', items: [{ sk: 's1', visitor: 'a', views: 2, p0: 1, p3: 1, source: 'Google', device: 'Mobile' }] },
    { date: '2026-11-02', items: [{ sk: 's1', visitor: 'a', views: 1, p0: 1, source: 'Google', device: 'Mobile' }, { sk: 's2', visitor: 'a', views: 1, p0: 1, source: 'Direct', device: 'Mobile' }, { sk: 's3', visitor: 'b', views: 1, p3: 1, source: 'Direct', device: 'Desktop' }] },
  ]);
  assert.deepEqual(r.summary, { visitors: 2, sessions: 3, pageViews: 5 });
  assert.deepEqual(r.daily.map(d => d.visitors), [1, 2]);
  assert.equal(r.pages.find(p => p.label === '/').pageViews, 3);
  assert.equal(r.devices.find(p => p.label === 'Mobile').sessions, 2);
  assert.equal(JSON.stringify(r).includes('"visitor":"a"'), false);
});
test('date ranges use UTC calendar days with real zeros for empty days', () => {
  const dates = datesFor(7, Date.parse('2026-11-02T00:01:00Z'));
  assert.equal(dates[0], '2026-10-27'); assert.equal(dates[6], '2026-11-02');
  const r = summarize(dates.map(date => ({ date, items: [] })));
  assert.equal(r.summary.visitors, 0); assert.equal(r.daily.length, 7);
});
test('server validation strips extras and scopes anonymous hashes by app', () => {
  const e = { id: '11111111-1111-4111-8111-111111111111', visitorId: '22222222-2222-4222-8222-222222222222', sessionId: '33333333-3333-4333-8333-333333333333', timestamp: Date.now(), path: '/', source: 'Direct', device: 'Desktop', wallet: 'private' };
  const a = validate({ appId: 'a', events: [e] }, 'a')[0];
  const b = validate({ appId: 'b', events: [e] }, 'b')[0];
  assert.notEqual(a.visitor, b.visitor); assert.equal(a.wallet, undefined); assert.equal(a.visitorId, undefined);
  assert.throws(() => validate({ appId: 'a', events: Array(11).fill(e) }, 'a'));
});

test('only authenticated edge geography is accepted; international names are decoded safely', () => {
  const { geography } = require('./model');
  const headers = { 'x-mpc-analytics-edge-token': 'secret', 'cloudfront-viewer-country': 'CA', 'cloudfront-viewer-country-region': 'QC', 'cloudfront-viewer-country-region-name': 'Qu%C3%A9bec' };
  assert.deepEqual(geography(headers), {});
  assert.deepEqual(geography(headers, 'wrong!'), {});
  assert.deepEqual(geography({ ...headers, 'x-mpc-analytics-edge-token': 'éééééé' }, 'secret'), {});
  assert.deepEqual(geography(headers, 'secret'), { country: 'CA', regionCode: 'QC', regionName: 'Québec' });
  assert.deepEqual(geography({ ...headers, 'cloudfront-viewer-country-region-name': '%0Aattack' }, 'secret'), { country: 'CA', regionCode: 'QC' });
});
test('each deduplicated write increments both the page and its UTC hour, without saving raw IPs', () => {
  const { transaction } = require('./model');
  const tx = transaction({ id: 'one', session: 's', visitor: 'v', timestamp: Date.parse('2026-11-02T04:30:00Z'), path: '/mint', source: 'Direct', device: 'Mobile' }, 'app', 'table', Date.now(), { country: 'US', regionCode: 'TX', regionName: 'Texas', ip: '1.2.3.4' });
  assert.equal(tx.TransactItems.length, 2);
  assert.equal(tx.TransactItems[1].Update.ExpressionAttributeNames['#hour'], 'h4p1');
  assert.match(tx.TransactItems[1].Update.UpdateExpression, /#views :one, #page :one, #hour :one/);
  assert.equal(JSON.stringify(tx).includes('1.2.3.4'), false);
});
test('local date boundaries include the adjacent UTC partition, without double counting sessions', () => {
  const { queryDates } = require('./model');
  const now = Date.parse('2026-11-03T04:30:00Z');
  const dates = datesFor(1, now, 'America/Jamaica');
  assert.deepEqual(dates, ['2026-11-02']);
  assert.deepEqual(queryDates(dates, 'America/Jamaica'), ['2026-11-01', '2026-11-02', '2026-11-03']);
  const item = { sk: 's', visitor: 'a', source: 'Google', device: 'Mobile', country: 'US', regionCode: 'TX', regionName: 'Texas' };
  const r = summarize([
    { date: '2026-11-02', items: [{ ...item, views: 3, p0: 3, h4p0: 1, h5p0: 2 }] },
    { date: '2026-11-03', items: [{ ...item, views: 4, p3: 4, h4p3: 3, h5p3: 1 }] },
  ], now, { dates, timezone: 'America/Jamaica', detailsStartAt: '2026-11-02T05:00:00Z' });
  assert.deepEqual(r.summary, { visitors: 1, sessions: 1, pageViews: 5 });
  assert.equal(r.patterns.hours[0].pageViews, 2); assert.equal(r.patterns.hours[23].pageViews, 3);
  assert.equal(r.patterns.weekdays[0].averageViews, 5);
  assert.equal(r.regions[0].label, 'Texas, United States');
  assert.equal(r.coverage.locatedPageViews, 5);
});
test('DST repeated hours combine their counts but preserve distinct sessions and exposure', () => {
  const r = summarize([{ date: '2026-11-01', items: [{ sk: 's', visitor: 'a', views: 4, p0: 4, h5p0: 1, h6p0: 3 }] }], Date.parse('2026-11-01T07:10:00Z'),
    { timezone: 'America/New_York', detailsStartAt: '2026-11-01T04:00:00Z' });
  assert.equal(r.patterns.hours[1].pageViews, 4); assert.equal(r.patterns.hours[1].sessions, 1);
  assert.equal(r.patterns.hours[1].observations, 2); assert.equal(r.patterns.hours[1].averageViews, 2);
});
test('legacy views stay in totals but do not create false hourly peaks or known locations', () => {
  const r = summarize([{ date: '2026-11-02', items: [{ sk: 's', visitor: 'v', views: 7, p0: 7, h12p0: 2 }] }], Date.parse('2026-11-02T12:10:00Z'), { detailsStartAt: '2026-11-02T12:00:00Z' });
  assert.equal(r.summary.pageViews, 7); assert.equal(r.coverage.legacyPageViews, 5);
  assert.equal(r.coverage.timedPageViews, 2); assert.equal(r.coverage.unknownLocationPageViews, 7);
  assert.equal(r.patterns.hours[11].averageViews, null); assert.equal(r.patterns.hours[12].averageViews, 2);
  assert.equal(r.patterns.monthDays[0].averageViews, null);
});
test('weekday and month-date averages account for unequal observation counts', () => {
  const dates = datesFor(9, Date.parse('2026-11-10T23:00:00Z'));
  const r = summarize(dates.map(date => ({ date, items: [{ sk: date, visitor: date, views: 2, p0: 2, h12p0: 2 }] })), Date.parse('2026-11-10T23:00:00Z'), { detailsStartAt: '2026-11-02T00:00:00Z' });
  assert.equal(r.patterns.weekdays[0].observations, 2);
  assert.equal(r.patterns.weekdays[0].pageViews, 4); assert.equal(r.patterns.weekdays[0].averageViews, 2);
  assert.equal(r.patterns.weekdays[2].observations, 1); assert.equal(r.patterns.weekdays[2].averageViews, 2);
});
