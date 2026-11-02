import { createWebsiteTracker, publicPage, trafficSource } from './clickstream';
const config = { appId: 'mpc_website', endpoint: 'https://counter.example.test/collect', hosts: ['modernpokerclub.com'] };
let store, win, sequence;
beforeEach(() => {
  jest.useFakeTimers(); sequence = 0; store = {};
  win = { document: { referrer: 'https://google.com/search?q=private-wallet' },
    location: { hostname: 'modernpokerclub.com' }, navigator: { userAgent: 'iPhone Mobile' },
    crypto: { getRandomValues: bytes => { bytes.fill(++sequence); } },
    localStorage: { getItem: key => store[key] || null, setItem: (key, value) => { store[key] = value; } },
    fetch: jest.fn().mockResolvedValue({ ok: true, status: 200 }), setInterval, clearInterval,
    addEventListener: jest.fn(), removeEventListener: jest.fn() };
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const events = () => win.fetch.mock.calls.flatMap(call => JSON.parse(call[1].body).events);
test('sends only page views with anonymous identifiers and fixed categories', async () => {
  const t = createWebsiteTracker(config, win); t.navigate('/'); await settle();
  t.navigate('/wallet/secret-address'); await settle();
  expect(events().map(e => e.path)).toEqual(['/', '/other']);
  expect(events()[0].source).toBe('Google'); expect(events()[0].device).toBe('Mobile');
  expect(JSON.stringify(events())).not.toMatch(/private-wallet|secret-address|google.com/);
  jest.advanceTimersByTime(60000); await settle();
  expect(win.fetch).toHaveBeenCalledTimes(2); t.stop();
});
test('route duplication does not count twice; reload retains visitor and session', async () => {
  const t = createWebsiteTracker(config, win); t.navigate('/legal'); t.navigate('/legal'); await settle(); t.stop();
  const other = createWebsiteTracker(config, win); other.navigate('/'); await settle();
  expect(events()).toHaveLength(2);
  expect(events()[1].visitorId).toBe(events()[0].visitorId);
  expect(events()[1].sessionId).toBe(events()[0].sessionId); other.stop();
});
test('a visit after 30 minutes creates a session but retains the visitor', async () => {
  let now = 1800000000000; jest.spyOn(Date, 'now').mockImplementation(() => now);
  const t = createWebsiteTracker(config, win); t.navigate('/'); await settle();
  now += 1800001; t.navigate('/legal'); await settle();
  expect(events()[1].visitorId).toBe(events()[0].visitorId);
  expect(events()[1].sessionId).not.toBe(events()[0].sessionId); t.stop();
});
test('transient retries keep event IDs; invalid events are not retried', async () => {
  let now = 1800000000000; jest.spyOn(Date, 'now').mockImplementation(() => now);
  win.fetch.mockResolvedValueOnce({ ok: false, status: 503 });
  const t = createWebsiteTracker(config, win); t.navigate('/'); await settle();
  now += 60000; await t.flush(); expect(events()[1].id).toBe(events()[0].id);
  win.fetch.mockResolvedValueOnce({ ok: false, status: 400 }); t.navigate('/mint'); await settle();
  now += 60000; await t.flush(); expect(win.fetch).toHaveBeenCalledTimes(3); t.stop();
});
test('honors privacy preferences and excludes localhost/preview/HTTP endpoints', () => {
  win.navigator.globalPrivacyControl = true; expect(createWebsiteTracker(config, win)).toBeNull();
  win.navigator.globalPrivacyControl = false; win.navigator.doNotTrack = '1'; expect(createWebsiteTracker(config, win)).toBeNull();
  win.navigator.doNotTrack = '0'; store['mpc.website.analytics.optOut'] = '1'; expect(createWebsiteTracker(config, win)).toBeNull();
  store = {}; expect(createWebsiteTracker({ ...config, hosts: [] }, win)).toBeNull();
  expect(createWebsiteTracker({ ...config, endpoint: 'http://localhost' }, win)).toBeNull();
});
test('normalizes public paths and discards arbitrary referrer details', () => {
  expect(publicPage('/privacy-policy')).toBe('/legal'); expect(publicPage('/mpokerclub')).toBe('/');
  expect(trafficSource('https://private.example/user/id', 'modernpokerclub.com')).toBe('Other');
  expect(trafficSource('https://www.modernpokerclub.com/legal', 'modernpokerclub.com')).toBe('Direct');
});
