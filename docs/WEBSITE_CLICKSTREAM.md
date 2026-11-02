# Website Clickstream integration

## Status — 2026-11-02

Implemented and locally tested. **Not collecting production visits yet.** The AWS
Guidance pipeline has not been provisioned; monthly budget and the console owner's
email are still needed. Website tracking is off unless explicitly enabled below.

## Deployment configuration

Add these build-time values to the **main** branch of Amplify app `d32m7serxcqbdj`
after the Clickstream application and HTTPS collection endpoint are healthy:

- `REACT_APP_CLICKSTREAM_ENABLED=true`
- `REACT_APP_CLICKSTREAM_APP_ID`: the registered website application ID
- `REACT_APP_CLICKSTREAM_ENDPOINT`: the pipeline's HTTPS `/collect` URL
- `REACT_APP_CLICKSTREAM_HOSTS=modernpokerclub.com,www.modernpokerclub.com`

Preserve all other branch environment variables. Rebuild the main branch after
setting these values. Preview hosts and localhost are excluded unless explicitly
listed. Use a separate Clickstream test application for test traffic.

## Collection behavior

Uses the official [Clickstream HTTP API](https://docs.aws.amazon.com/solutions/latest/clickstream-analytics-on-aws/http-api.html)
instead of automatic DOM capture, so the payload can be strictly allowlisted.
Compatible with AWS Guidance `event_v2` processing.

Events: `_first_open`, `_session_start`, `_page_view`, `_user_engagement`, and
`mpc_cta_click`. Public CTA targets are game, YouTube, Discord, Magic Eden, NFT
membership, migration, and legal pages. Event IDs remain unchanged on delivery
retry. No application credentials are attached to requests.

Anonymous browser and session identifiers are saved in local storage. A session
expires after 30 minutes of inactivity. Engagement excludes hidden tabs and time
after 60 seconds of inactivity. Clearing browser storage creates a new visitor.
Delivery is best effort; ad blockers, privacy choices, and network loss can reduce
counts. A game CTA click is not a game login or a completed registration.

Only known public paths, fixed page titles, referrer hostnames, basic device data,
and fixed CTA categories are sent. Query strings, fragments, unknown URL paths,
wallet addresses, login tokens, input values, and account identities are excluded.
Standard ingestion infrastructure can still observe IP and User-Agent headers.
The tracker respects Global Privacy Control, Do Not Track, and the local setting
`mpc.website.analytics.optOut=1` on initialization. Stop/reload the page after
changing this setting. No historical visits can be recovered by this integration.

## Verification

- Focused tracking tests: `CI=true npm test -- --watchAll=false --runInBand --watchman=false src/analytics/clickstream.test.js`
- Production build: `npm run build`
- After provisioning, verify one test visit, an SPA route change, and one game CTA
  against the test application's raw S3 events and processed Athena rows. Then
  enable the production application, and verify the admin's processed report.

Rollback: set `REACT_APP_CLICKSTREAM_ENABLED=false` and rebuild the website. This
does not stop billing for AWS resources; infrastructure lifecycle is separate.
