'use strict';
const { createHash } = require('node:crypto');
const DAY = 86400000;
const PATHS = ['/', '/mint', '/bridge', '/legal', '/about', '/other'];
const SOURCES = ['Direct', 'Google', 'Bing', 'YouTube', 'Discord', 'Facebook', 'Instagram', 'X', 'Other'];
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 32);
function validate(body, appId, now = Date.now()) {
  if (!body || body.appId !== appId || !Array.isArray(body.events) || !body.events.length || body.events.length > 10) throw new Error('Invalid batch');
  return body.events.map(e => {
    if (!e || !UUID.test(e.id) || !UUID.test(e.visitorId) || !UUID.test(e.sessionId)
      || !Number.isSafeInteger(e.timestamp) || e.timestamp < now - DAY || e.timestamp > now + 300000
      || !PATHS.includes(e.path) || !SOURCES.includes(e.source) || !['Desktop', 'Mobile', 'Tablet'].includes(e.device)) throw new Error('Invalid event');
    // Only these fields can reach storage. Do not store URLs, IPs, wallets or accounts.
    return { id: e.id, visitor: hash(appId + e.visitorId), session: hash(appId + e.visitorId + e.sessionId),
      timestamp: Math.min(e.timestamp, now), path: e.path, source: e.source, device: e.device };
  });
}
function transaction(event, appId, table, now = Date.now()) {
  const date = new Date(event.timestamp).toISOString().slice(0, 10);
  const page = 'p' + PATHS.indexOf(event.path);
  return { TransactItems: [
    { Put: { TableName: table, Item: { pk: `${appId}#event#${event.id}`, sk: 'dedupe', expiresAt: Math.floor(now / 1000) + 172800 }, ConditionExpression: 'attribute_not_exists(pk)' } },
    { Update: { TableName: table, Key: { pk: `${appId}#day#${date}`, sk: event.session },
      UpdateExpression: 'SET visitor = if_not_exists(visitor, :visitor), #source = if_not_exists(#source, :source), device = if_not_exists(device, :device), expiresAt = :ttl ADD #views :one, #page :one',
      ExpressionAttributeNames: { '#source': 'source', '#page': page, '#views': 'views' },
      ExpressionAttributeValues: { ':visitor': event.visitor, ':source': event.source, ':device': event.device, ':ttl': Math.floor(new Date(date).getTime() / 1000) + 94 * 86400, ':one': 1 } } },
  ] };
}
function datesFor(days, now = Date.now()) {
  const end = Math.floor(now / DAY) * DAY;
  return Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * DAY).toISOString().slice(0, 10));
}
function summarize(byDay, now = Date.now()) {
  const metric = () => ({ visitors: new Set(), sessions: new Set(), pageViews: 0 });
  const add = (m, item, count) => { m.visitors.add(item.visitor); m.sessions.add(item.sk); m.pageViews += count; };
  const flat = (m, label) => ({ label, visitors: m.visitors.size, sessions: m.sessions.size, pageViews: m.pageViews });
  const total = metric(), pages = new Map(), sources = new Map(), devices = new Map();
  const group = (map, label, item, count) => { if (!map.has(label)) map.set(label, metric()); add(map.get(label), item, count); };
  const daily = byDay.map(({ date, items }) => {
    const day = metric();
    for (const item of items) {
      add(day, item, item.views); add(total, item, item.views);
      group(sources, item.source, item, item.views); group(devices, item.device, item, item.views);
      PATHS.forEach((path, i) => { if (item['p' + i]) group(pages, path, item, item['p' + i]); });
    }
    return flat(day, date);
  });
  const rows = map => [...map].map(([label, m]) => flat(m, label)).sort((a, b) => b.pageViews - a.pageViews);
  const { label, ...summary } = flat(total);
  return { status: 'ready', source: 'AWS website counter', timezone: 'UTC', startDate: byDay[0].date,
    endDate: byDay[byDay.length - 1].date, generatedAt: new Date(now).toISOString(), summary, daily,
    pages: rows(pages), sources: rows(sources), devices: rows(devices) };
}
module.exports = { validate, transaction, datesFor, summarize, PATHS };
