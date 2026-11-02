// Lightweight visitor counter. Only anonymous, allowlisted page-view fields leave the site.
const STORAGE_KEY = 'mpc.website.analytics.v1';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const pages = ['/', '/mint', '/bridge', '/legal', '/about', '/other'];
export function publicPage(pathname) {
  const path = String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/mpokerclub') return '/';
  if (['/privacy-policy', '/terms-and-conditions', '/responsible-social-gameplay-policy', '/customer-acceptance-policy', '/risk-disclaimer'].includes(path)) return '/legal';
  return pages.includes(path) ? path : '/other';
}
export function trafficSource(referrer, hostname) {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === hostname || ['modernpokerclub.com', 'www.modernpokerclub.com'].includes(host)) return 'Direct';
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'Google';
    const domains = { 'bing.com': 'Bing', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube', 'discord.com': 'Discord', 'discord.gg': 'Discord', 'facebook.com': 'Facebook', 'instagram.com': 'Instagram', 'x.com': 'X', 't.co': 'X', 'twitter.com': 'X' };
    return Object.keys(domains).map(domain => host === domain || host.endsWith('.' + domain) ? domains[domain] : null).find(Boolean) || 'Other';
  } catch (_) { return 'Direct'; }
}
export function createWebsiteTracker({ appId, endpoint, hosts }, win = window) {
  let url;
  const doc = win.document;
  try {
    url = new URL(endpoint);
    if (url.protocol !== 'https:' || !/^[a-zA-Z0-9_-]{1,128}$/.test(appId) || !hosts.includes(win.location.hostname)) return null;
    if (win.navigator.globalPrivacyControl || win.navigator.doNotTrack === '1' || win.localStorage.getItem('mpc.website.analytics.optOut') === '1') return null;
  } catch (_) { return null; }
  const uuid = () => {
    const bytes = new Uint8Array(16); win.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
  const validId = value => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value || '');
  let state;
  try { state = JSON.parse(win.localStorage.getItem(STORAGE_KEY)); } catch (_) { /* New visitor. */ }
  if (!state || !validId(state.visitorId)) state = { visitorId: uuid() };
  const save = () => { try { win.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Memory-only if storage unavailable. */ } };
  const source = trafficSource(doc.referrer, win.location.hostname);
  const ua = win.navigator.userAgent || '';
  const device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobile|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop';
  let page = null, queue = [], stopped = false, inFlight = false, failures = 0, retryAt = 0;
  const flush = async () => {
    if (stopped || inFlight || !queue.length || Date.now() < retryAt) return;
    inFlight = true;
    const batch = queue.splice(0, 10);
    try {
      const response = await win.fetch(url.href, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, events: batch }), keepalive: true, credentials: 'omit', mode: 'cors' });
      // Bad/expired events cannot improve on retry. Only retry transient failures.
      if (!response.ok && (response.status === 429 || response.status >= 500)) throw new Error('Retry');
      failures = 0;
    } catch (_) {
      queue = batch.concat(queue).slice(0, 100);
      failures += 1; retryAt = Date.now() + Math.min(60000, 5000 * 2 ** Math.min(failures, 4));
    } finally { inFlight = false; }
  };
  const navigate = pathname => {
    const next = publicPage(pathname);
    if (stopped || next === page) return;
    page = next;
    try {
      const saved = JSON.parse(win.localStorage.getItem(STORAGE_KEY));
      if (saved && saved.visitorId === state.visitorId && saved.lastSeen > (state.lastSeen || 0)) state = saved;
    } catch (_) { /* Reuse memory session. */ }
    if (!validId(state.sessionId) || !Number.isFinite(state.lastSeen) || Date.now() - state.lastSeen >= SESSION_TIMEOUT) state.sessionId = uuid();
    state.lastSeen = Date.now(); save();
    queue.push({ id: uuid(), visitorId: state.visitorId, sessionId: state.sessionId, timestamp: Date.now(), path: page, source, device });
    if (queue.length > 100) queue.shift();
    flush();
  };
  // No activity pings: this timer only retries already queued page views.
  const timer = win.setInterval(flush, 15000);
  const leave = () => { flush(); };
  win.addEventListener('pagehide', leave);
  return { navigate, flush, stop() { stopped = true; queue = []; win.clearInterval(timer); win.removeEventListener('pagehide', leave); } };
}
