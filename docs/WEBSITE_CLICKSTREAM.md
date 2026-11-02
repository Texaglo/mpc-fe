# Website visitor tracking

A lightweight, anonymous page-view counter backed by separate AWS serverless
resources. This supersedes the earlier undeployed AWS Clickstream Guidance
proposal. No Pinpoint, Athena or Kinesis is used.

## Production configuration

Amplify app `d32m7serxcqbdj`, branch **main**:

- `REACT_APP_WEBSITE_ANALYTICS_ENABLED=true`
- `REACT_APP_WEBSITE_ANALYTICS_APP_ID=mpc_website`
- `REACT_APP_WEBSITE_ANALYTICS_ENDPOINT`: stack `mpc-website-counter` GeoCollectEndpoint (CloudFront)
- `REACT_APP_WEBSITE_ANALYTICS_HOSTS=modernpokerclub.com,www.modernpokerclub.com`

Preserve other environment values and rebuild after changing these. Localhost and
preview domains are excluded. The matching admin branch uses
`REACT_APP_WEBSITE_ANALYTICS_API` for its authenticated reporting endpoint.

## Behavior and privacy

Each page load/SPA path change sends one event. No scroll/click/engagement
heartbeats are collected. A session expires after 30 minutes without a page view.
Anonymous visitor/session identifiers are stored locally; clearing storage creates
a new visitor. Other browser tabs share these identifiers where possible.

Only fixed public paths, broad source categories, device category, event time and
random identifiers are sent. The collector hashes visitor/session identifiers and
stores daily session counters with UTC hour/page buckets. CloudFront supplies
approximate country and state/region; the collector accepts those headers only
from its authenticated distribution. Raw IPs, city/GPS coordinates and precise
location are not stored. Older cached builds using the original collector URL
continue to count, with unknown geography. No full URLs, query strings, wallet addresses,
account IDs, tokens, form values or referrer details are stored. HTTPS requests
necessarily expose connection metadata to AWS, but the application does not log it.

The tracker respects Global Privacy Control, Do Not Track and local storage
`mpc.website.analytics.optOut=1` on initialization. Reload after changing an opt-out.
Delivery is best effort, uses a bounded in-memory queue and retries transient
errors with the original event ID. The server atomically deduplicates retries.

The admin displays visitors, visits and page views for 7/30/90 days, plus daily
trends, top pages, source categories, devices, countries and regions. Hourly,
weekday and day-of-month patterns show average page views per observed hour/day
so repeated weekdays do not distort comparisons. The reporting time zone is
selectable (Jamaica by default, plus Central/Texas, Eastern, Pacific, London, UTC).
Geography and hourly detail start at deployment; historical hours/locations
cannot be recovered, and coverage is disclosed in the dashboard. These are anonymous browser
counts, not verified people, game logins, or websocket presence. Reports can be
up to a minute behind. Tracking starts at activation; historical visits cannot
be reconstructed.

## Verification and rollback

- `CI=true npm test -- --watchAll=false --runInBand --watchman=false src/analytics/clickstream.test.js`
- `npm run build`
- Test a page load, SPA navigation, and reload against the isolated test app.
- Verify duplicate deliveries do not inflate counts and admin reports require auth.

To stop collection, set the enabled flag to false and rebuild. Resource billing
is separate; there is no fixed analytics subscription, but usage and storage are
billable. Full infrastructure and deployment instructions live on the admin branch
in `docs/WEBSITE_ANALYTICS_DEPLOYMENT.md`.
