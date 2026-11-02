import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createWebsiteTracker } from './clickstream';

export default function WebsiteAnalytics() {
  const location = useLocation();
  const tracker = useRef(null);
  useEffect(() => {
    if (process.env.REACT_APP_WEBSITE_ANALYTICS_ENABLED !== 'true') return;
    try {
      tracker.current = createWebsiteTracker({
        appId: process.env.REACT_APP_WEBSITE_ANALYTICS_APP_ID,
        endpoint: process.env.REACT_APP_WEBSITE_ANALYTICS_ENDPOINT,
        hosts: (process.env.REACT_APP_WEBSITE_ANALYTICS_HOSTS || 'modernpokerclub.com,www.modernpokerclub.com').split(',').map(value => value.trim()),
      });
    } catch (_) { /* Analytics must never prevent the site from loading. */ }
    return () => { if (tracker.current) tracker.current.stop(); tracker.current = null; };
  }, []);
  useEffect(() => {
    try { if (tracker.current) tracker.current.navigate(location.pathname); } catch (_) { /* Best effort. */ }
  }, [location.pathname]);
  return null;
}
