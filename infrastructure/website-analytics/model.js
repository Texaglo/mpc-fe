'use strict';
const { createHash, timingSafeEqual } = require('node:crypto');
const DAY = 86400000;
const PATHS = ['/', '/mint', '/bridge', '/legal', '/about', '/other'];
const SOURCES = ['Direct', 'Google', 'Bing', 'YouTube', 'Discord', 'Facebook', 'Instagram', 'X', 'Other'];
const TIMEZONES = ['UTC', 'America/Jamaica', 'America/Chicago', 'America/New_York', 'America/Los_Angeles', 'Europe/London'];
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
// Only our CloudFront distribution can supply trusted IP-derived geography.
// The public API remains compatible with old clients, whose region stays unknown.
function geography(headers = {}, edgeToken = '') {
  const supplied = headers['x-mpc-analytics-edge-token'];
  if (!edgeToken || typeof supplied !== 'string' || Buffer.byteLength(supplied) !== Buffer.byteLength(edgeToken)
    || !timingSafeEqual(Buffer.from(supplied), Buffer.from(edgeToken))) return {};
  const country = headers['cloudfront-viewer-country'];
  if (!/^[A-Z]{2}$/.test(country || '')) return {};
  const result = { country };
  const code = headers['cloudfront-viewer-country-region'];
  if (/^[A-Z0-9]{1,3}$/.test(code || '')) {
    result.regionCode = code;
    try {
      const name = decodeURIComponent(headers['cloudfront-viewer-country-region-name'] || '');
      if (name.length > 0 && name.length <= 80 && !/[\u0000-\u001f\u007f]/.test(name)) result.regionName = name;
    } catch (_) { /* A malformed name must not lose the visit or country. */ }
  }
  return result;
}
function transaction(event, appId, table, now = Date.now(), geo = {}) {
  const date = new Date(event.timestamp).toISOString().slice(0, 10);
  const page = 'p' + PATHS.indexOf(event.path);
  const names = { '#source': 'source', '#page': page, '#views': 'views', '#hour': 'h' + new Date(event.timestamp).getUTCHours() + page };
  const values = { ':visitor': event.visitor, ':source': event.source, ':device': event.device, ':ttl': Math.floor(new Date(date).getTime() / 1000) + 94 * 86400, ':one': 1 };
  let location = '';
  for (const field of ['country', 'regionCode', 'regionName']) {
    if (!geo[field]) continue;
    names['#' + field] = field; values[':' + field] = geo[field];
    location += `, #${field} = if_not_exists(#${field}, :${field})`;
  }
  return { TransactItems: [
    { Put: { TableName: table, Item: { pk: `${appId}#event#${event.id}`, sk: 'dedupe', expiresAt: Math.floor(now / 1000) + 172800 }, ConditionExpression: 'attribute_not_exists(pk)' } },
    { Update: { TableName: table, Key: { pk: `${appId}#day#${date}`, sk: event.session },
      UpdateExpression: 'SET visitor = if_not_exists(visitor, :visitor), #source = if_not_exists(#source, :source), device = if_not_exists(device, :device), expiresAt = :ttl' + location + ' ADD #views :one, #page :one, #hour :one',
      ExpressionAttributeNames: names, ExpressionAttributeValues: values } },
  ] };
}
const formatters = new Map();
function localParts(timestamp, timezone) {
  if (!formatters.has(timezone)) formatters.set(timezone, new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }));
  const parts = Object.fromEntries(formatters.get(timezone).formatToParts(timestamp).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}
const isoDate = timestamp => new Date(timestamp).toISOString().slice(0, 10);
function datesFor(days, now = Date.now(), timezone = 'UTC') {
  const end = Date.parse(localParts(now, timezone).date);
  return Array.from({ length: days }, (_, i) => isoDate(end - (days - 1 - i) * DAY));
}
function queryDates(dates, timezone) {
  if (timezone === 'UTC') return dates;
  // Include adjacent UTC partitions before filtering hours into local calendar days.
  return [isoDate(Date.parse(dates[0]) - DAY), ...dates, isoDate(Date.parse(dates[dates.length - 1]) + DAY)];
}
function summarize(byDay, now = Date.now(), options = {}) {
  const timezone = options.timezone || 'UTC', dates = options.dates || byDay.map(d => d.date);
  const startDate = dates[0], endDate = dates[dates.length - 1], selected = new Set(dates);
  const metric = () => ({ visitors: new Set(), sessions: new Set(), pageViews: 0 });
  const add = (m, item, count) => { if (count > 0) { m.visitors.add(item.visitor); m.sessions.add(item.sk); m.pageViews += count; } };
  const flat = (m, label) => ({ label, visitors: m.visitors.size, sessions: m.sessions.size, pageViews: m.pageViews });
  const total = metric(), pages = new Map(), sources = new Map(), devices = new Map(), countries = new Map(), regions = new Map();
  const daily = new Map(dates.map(d => [d, metric()]));
  const hours = Array.from({ length: 24 }, metric), weekdays = Array.from({ length: 7 }, metric), monthDays = Array.from({ length: 31 }, metric);
  const hourDays = Array(24).fill(0), weekdayDays = Array.from({ length: 7 }, () => new Set()), monthDayDays = Array.from({ length: 31 }, () => new Set());
  const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const group = (map, label, item, count) => { if (!map.has(label)) map.set(label, metric()); add(map.get(label), item, count); };
  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
  let timedPageViews = 0, legacyPageViews = 0, locatedPageViews = 0;
  const consume = (item, date, hour, counts) => {
    if (!selected.has(date)) return;
    const views = counts.reduce((a, b) => a + b, 0);
    if (!views) return;
    add(daily.get(date), item, views); add(total, item, views);
    group(sources, item.source || 'Other', item, views); group(devices, item.device || 'Unknown', item, views);
    counts.forEach((count, i) => { if (count) group(pages, PATHS[i], item, count); });
    const country = item.country ? countryNames.of(item.country) : 'Unknown';
    group(countries, country, item, views);
    group(regions, item.country && item.regionCode ? `${item.regionName || item.regionCode}, ${country}` : 'Unknown', item, views);
    if (item.country) locatedPageViews += views;
    if (hour === null) { legacyPageViews += views; return; }
    timedPageViews += views;
    const weekday = (new Date(date).getUTCDay() + 6) % 7, monthDay = Number(date.slice(8)) - 1;
    add(hours[hour], item, views); add(weekdays[weekday], item, views); add(monthDays[monthDay], item, views);
  };
  for (const { date, items } of byDay) for (const item of items) {
    const timedPages = Array(PATHS.length).fill(0);
    for (let hour = 0; hour < 24; hour++) {
      const counts = PATHS.map((_, p) => Number(item[`h${hour}p${p}`]) || 0);
      counts.forEach((count, p) => { timedPages[p] += count; });
      if (!counts.some(Boolean)) continue;
      const local = localParts(Date.parse(date) + hour * 3600000, timezone);
      consume(item, local.date, local.hour, counts);
    }
    // Legacy views have only a UTC date. Retain their totals but never invent an hour.
    consume(item, date, null, PATHS.map((_, p) => Math.max(0, (item['p' + p] || 0) - timedPages[p])));
  }
  const detailsStartAt = options.detailsStartAt || null;
  const detailsStart = detailsStartAt ? Date.parse(detailsStartAt) : now;
  // Hour slots account for daylight-saving transitions. Partial first/current hours
  // are included and disclosed in the UI. Days before activation are not zero traffic.
  for (let t = Math.max(Math.floor(detailsStart / 3600000) * 3600000, Date.parse(startDate) - DAY); t <= now; t += 3600000) {
    const local = localParts(t, timezone);
    if (!selected.has(local.date)) continue;
    hourDays[local.hour]++;
    weekdayDays[(new Date(local.date).getUTCDay() + 6) % 7].add(local.date);
    monthDayDays[Number(local.date.slice(8)) - 1].add(local.date);
  }
  const pattern = (metrics, labels, exposure) => metrics.map((m, i) => ({ ...flat(m, labels[i]), observations: exposure[i],
    averageViews: exposure[i] ? Number((m.pageViews / exposure[i]).toFixed(2)) : null }));
  const rows = map => [...map].map(([label, m]) => flat(m, label)).sort((a, b) => b.pageViews - a.pageViews);
  const { label, ...summary } = flat(total);
  return { status: 'ready', source: 'AWS website counter', timezone, startDate, endDate,
    generatedAt: new Date(now).toISOString(), summary, daily: [...daily].map(([date, m]) => flat(m, date)),
    pages: rows(pages), sources: rows(sources), devices: rows(devices), countries: rows(countries), regions: rows(regions),
    patterns: {
      hours: pattern(hours, Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00'), hourDays),
      weekdays: pattern(weekdays, weekdayNames, weekdayDays.map(s => s.size)),
      monthDays: pattern(monthDays, Array.from({ length: 31 }, (_, i) => String(i + 1)), monthDayDays.map(s => s.size)),
    },
    coverage: { detailsStartAt, timedPageViews, legacyPageViews, locatedPageViews, unknownLocationPageViews: summary.pageViews - locatedPageViews },
  };
}
module.exports = { validate, transaction, geography, datesFor, queryDates, summarize, localParts, PATHS, TIMEZONES };
