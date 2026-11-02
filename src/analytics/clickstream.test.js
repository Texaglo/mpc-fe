import { clickTarget, createWebsiteTracker, publicPage } from './clickstream';

const config = { appId: 'mpc_web', endpoint: 'https://analytics.example.com/collect', hosts: ['localhost'] };
let tracker;
let now;
const events = () => window.fetch.mock.calls.flatMap(([, options]) => JSON.parse(options.body));
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

beforeEach(() => {
  jest.useFakeTimers();
  now = Date.parse('2026-11-02T12:00:00Z');
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  localStorage.clear();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: null });
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => {
    array.forEach((_, index) => { array[index] = Math.floor(Math.random() * 256); }); return array;
  } } });
  window.fetch = jest.fn().mockResolvedValue({ ok: true });
});
afterEach(() => { if (tracker) tracker.stop(); tracker = null; jest.restoreAllMocks(); jest.useRealTimers(); });

test('sends official Clickstream events without wallet URLs, query strings, or authentication', async () => {
  window.history.replaceState({}, '', '/bridge?wallet=PRIVATE_WALLET&token=SECRET#signature');
  tracker = createWebsiteTracker(config);
  tracker.navigate(window.location.pathname);
  await settle();
  expect(events().map(event => event.event_type)).toEqual(['_first_open', '_session_start', '_page_view']);
  expect(events()[2].attributes._page_url).toBe('http://localhost/bridge');
  expect(JSON.stringify(events())).not.toMatch(/PRIVATE_WALLET|SECRET|signature/);
  expect(window.fetch.mock.calls[0][0]).toBe('https://analytics.example.com/collect?appId=mpc_web&platform=Web');
  expect(window.fetch.mock.calls[0][1].credentials).toBe('omit');
  expect(window.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
});

test('deduplicates route changes and keeps visitor/session identity across page reloads', async () => {
  tracker = createWebsiteTracker(config);
  tracker.navigate('/'); await settle();
  tracker.navigate('/'); await settle();
  const first = events()[0];
  tracker.stop(); tracker = createWebsiteTracker(config);
  tracker.navigate('/mint'); await settle();
  expect(events().filter(event => event.event_type === '_first_open')).toHaveLength(1);
  expect(events().filter(event => event.event_type === '_session_start')).toHaveLength(1);
  expect(events().filter(event => event.event_type === '_page_view')).toHaveLength(2);
  expect(events().every(event => event.unique_id === first.unique_id)).toBe(true);
  expect(events().every(event => event.attributes._session_id === first.attributes._session_id)).toBe(true);
});

test('a session expires after 30 minutes of inactivity and does not treat idle time as engagement', async () => {
  tracker = createWebsiteTracker(config);
  tracker.navigate('/'); await settle();
  const firstSession = events()[0].attributes._session_id;
  now += 31 * 60000;
  document.dispatchEvent(new Event('pointerdown'));
  tracker.navigate('/mint'); await settle();
  const sessions = events().filter(event => event.event_type === '_session_start');
  expect(sessions).toHaveLength(2);
  expect(sessions[1].attributes._session_id).not.toBe(firstSession);
  expect(events().filter(event => event.event_type === '_user_engagement')).toHaveLength(0);
});

test('failed delivery retries the same event IDs without blocking navigation', async () => {
  window.fetch.mockRejectedValueOnce(new Error('offline'));
  tracker = createWebsiteTracker(config);
  tracker.navigate('/'); await settle();
  const ids = events().map(event => event.event_id);
  now += 16000; await tracker.flush();
  const retried = JSON.parse(window.fetch.mock.calls[1][1].body);
  expect(retried.map(event => event.event_id)).toEqual(ids);
});

test('tracking stays off for unconfigured/preview hosts and privacy choices', () => {
  expect(createWebsiteTracker({ ...config, hosts: ['www.modernpokerclub.com'] })).toBeNull();
  expect(createWebsiteTracker({ ...config, endpoint: 'http://analytics.example.com' })).toBeNull();
  localStorage.setItem('mpc.website.analytics.optOut', '1');
  expect(createWebsiteTracker(config)).toBeNull();
  localStorage.clear();
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' });
  expect(createWebsiteTracker(config)).toBeNull();
  expect(window.fetch).not.toHaveBeenCalled();
});

test('only public pages and known button destinations are classified', () => {
  expect(publicPage('/some-wallet-address')).toBe('/other');
  expect(publicPage('/terms-and-conditions')).toBe('/legal');
  expect(clickTarget('https://main.du6evc0snv7lm.amplifyapp.com/?token=SECRET', 'https://modernpokerclub.com')).toBe('play_game');
  expect(clickTarget('https://www.youtube.com/stickyrice1?sub_confirmation=1', 'https://modernpokerclub.com')).toBe('youtube');
  expect(clickTarget('https://malicious.example/?wallet=123', 'https://modernpokerclub.com')).toBeNull();
  expect(clickTarget('mailto:private@example.com', 'https://modernpokerclub.com')).toBeNull();
});
