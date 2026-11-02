// AWS Clickstream Guidance HTTP API. Only this allowlisted payload leaves the site.
// https://docs.aws.amazon.com/solutions/latest/clickstream-analytics-on-aws/http-api.html
const STORAGE_KEY = 'mpc.website.analytics.v1';
const OPT_OUT_KEY = 'mpc.website.analytics.optOut';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const IDLE_TIMEOUT = 60 * 1000;
const pageTitles = {
  '/': 'The Club', '/mint': 'NFT Membership', '/bridge': 'NFT Migration',
  '/legal': 'Rules and Legal', '/about': 'About', '/other': 'Other page',
};

export function publicPage(pathname) {
  const path = String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/mpokerclub') return '/';
  if (['/privacy-policy', '/terms-and-conditions', '/responsible-social-gameplay-policy',
    '/customer-acceptance-policy', '/risk-disclaimer'].includes(path)) return '/legal';
  return pageTitles[path] ? path : '/other';
}

export function clickTarget(href, origin) {
  try {
    const url = new URL(href, origin);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.hostname === 'main.du6evc0snv7lm.amplifyapp.com') return 'play_game';
    if (['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) return 'youtube';
    if (['discord.gg', 'discord.com'].includes(url.hostname)) return 'discord';
    if (url.hostname === 'magiceden.io') return 'marketplace';
    if (url.origin === origin) {
      return ({ '/mint': 'nft_membership', '/bridge': 'nft_migration', '/legal': 'legal' })[publicPage(url.pathname)] || null;
    }
  } catch (_) { /* Ignore malformed and non-web destinations. */ }
  return null;
}

export function createWebsiteTracker({ appId, endpoint, hosts }, win = window) {
  const doc = win.document;
  let collectionUrl;
  try {
    collectionUrl = new URL(endpoint);
    if (collectionUrl.protocol !== 'https:' || !/^[a-zA-Z0-9_-]{1,128}$/.test(appId)
      || !hosts.includes(win.location.hostname)) return null;
    if (win.navigator.globalPrivacyControl || win.navigator.doNotTrack === '1'
      || win.localStorage.getItem(OPT_OUT_KEY) === '1') return null;
  } catch (_) { return null; }
  collectionUrl.search = new URLSearchParams({ appId, platform: 'Web' }).toString();
  collectionUrl.hash = '';

  const uuid = () => {
    const bytes = new Uint8Array(16);
    win.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
  let state;
  try { state = JSON.parse(win.localStorage.getItem(STORAGE_KEY)); } catch (_) { /* Start fresh. */ }
  if (!state || !/^[a-f0-9-]{36}$/.test(state.visitorId || '')) {
    state = { visitorId: uuid(), firstSeen: Date.now(), sessionNumber: 0 };
  }
  const save = () => { try { win.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Memory-only tracking still works. */ } };
  let referrer = '';
  try { const host = new URL(doc.referrer).hostname; if (host !== win.location.hostname) referrer = host; } catch (_) { /* Direct visit. */ }
  let queue = [];
  let inFlight = false;
  let stopped = false;
  let retryAt = 0;
  let failures = 0;
  let page = null;
  let previousPage = '';
  let lastActivity = Date.now();
  let engagementAt = Date.now();

  const append = (name, attributes = {}) => {
    if (stopped) return;
    queue.push({
      event_type: name, event_id: uuid(), timestamp: Date.now(), app_id: appId,
      unique_id: state.visitorId, device_id: state.visitorId, platform: 'Web',
      host_name: win.location.hostname, sdk_name: 'mpc-clickstream-http', sdk_version: '1.0.0',
      viewport_width: win.innerWidth, viewport_height: win.innerHeight,
      screen_width: win.screen.width, screen_height: win.screen.height,
      system_language: String(win.navigator.language || '').slice(0, 16),
      user: { _user_first_touch_timestamp: { value: state.firstSeen, set_timestamp: state.firstSeen } },
      attributes: {
        _session_id: state.sessionId, _session_number: state.sessionNumber,
        _session_start_timestamp: state.sessionStart, _session_duration: Date.now() - state.sessionStart,
        _page_url: `${win.location.origin}${page || '/'}`, _page_title: pageTitles[page || '/'],
        _latest_referrer: referrer ? `https://${referrer}/` : '', _latest_referrer_host: referrer,
        site: 'mpc_website', ...attributes,
      },
    });
    if (queue.length > 100) queue.shift();
  };
  const touchSession = () => {
    // Read again so separate tabs share the same visitor/session where possible.
    try {
      const stored = JSON.parse(win.localStorage.getItem(STORAGE_KEY));
      if (stored && stored.visitorId === state.visitorId && stored.lastSeen > (state.lastSeen || 0)) state = stored;
    } catch (_) { /* Use the in-memory session. */ }
    if (!state.sessionId || Date.now() - state.lastSeen >= SESSION_TIMEOUT) {
      state.sessionId = uuid(); state.sessionStart = Date.now(); state.sessionNumber += 1;
      if (!state.firstOpenRecorded) { append('_first_open'); state.firstOpenRecorded = true; }
      append('_session_start');
    }
    state.lastSeen = Date.now(); save();
  };
  const engage = () => {
    const now = Date.now();
    const duration = Math.max(0, Math.min(now, lastActivity + IDLE_TIMEOUT) - engagementAt);
    engagementAt = now;
    if (page && duration >= 1000) { touchSession(); append('_user_engagement', { _engagement_time_msec: duration }); }
  };
  const flush = async () => {
    if (stopped || inFlight || !queue.length || Date.now() < retryAt) return;
    inFlight = true;
    const batch = queue.splice(0, 10);
    try {
      const response = await win.fetch(collectionUrl.href, {
        method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(batch), keepalive: true, credentials: 'omit', mode: 'cors',
      });
      if (!response.ok) throw new Error('Collection unavailable');
      failures = 0;
    } catch (_) {
      // Reuse event IDs on retry so the pipeline can deduplicate deliveries.
      queue = batch.concat(queue).slice(0, 100);
      failures += 1; retryAt = Date.now() + Math.min(60000, 5000 * 2 ** Math.min(failures, 4));
    } finally { inFlight = false; }
  };
  const navigate = pathname => {
    const next = publicPage(pathname);
    if (stopped || next === page) return;
    if (doc.visibilityState !== 'hidden') engage();
    previousPage = page || ''; page = next; lastActivity = Date.now(); engagementAt = Date.now();
    touchSession();
    append('_page_view', { _page_referrer: previousPage ? `${win.location.origin}${previousPage}` : '', _entrances: previousPage ? 0 : 1 });
    flush();
  };
  const active = () => {
    if (Date.now() - lastActivity >= IDLE_TIMEOUT) engagementAt = Date.now();
    lastActivity = Date.now();
  };
  const click = event => {
    active();
    const element = event.target && event.target.closest && event.target.closest('a[href]');
    const target = element && clickTarget(element.getAttribute('href'), win.location.origin);
    if (target) { touchSession(); append('mpc_cta_click', { target }); flush(); }
  };
  const visibility = () => {
    if (doc.visibilityState === 'hidden') { engage(); flush(); }
    else { active(); engagementAt = Date.now(); }
  };
  const leave = () => { if (doc.visibilityState !== 'hidden') engage(); flush(); };
  doc.addEventListener('click', click);
  doc.addEventListener('pointerdown', active, { passive: true });
  doc.addEventListener('keydown', active);
  doc.addEventListener('scroll', active, { passive: true });
  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('pagehide', leave);
  const timer = win.setInterval(() => { if (doc.visibilityState !== 'hidden') engage(); flush(); }, 15000);
  return {
    navigate, flush,
    stop() {
      stopped = true; queue = []; win.clearInterval(timer);
      doc.removeEventListener('click', click); doc.removeEventListener('pointerdown', active);
      doc.removeEventListener('keydown', active); doc.removeEventListener('scroll', active);
      doc.removeEventListener('visibilitychange', visibility); win.removeEventListener('pagehide', leave);
    },
  };
}
