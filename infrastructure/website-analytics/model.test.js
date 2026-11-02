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
