# Website visitor counter

## Design

The user selected a separate, usage-based AWS counter on 2026-11-02. Amazon
Pinpoint analytics retired on 2026-10-30. This replaces the earlier undeployed
Clickstream Guidance/Athena proposal. No Athena, Kinesis, Redshift, QuickSight,
VPC, NAT gateway, or ECS service is required.

Website page view → CloudFront country/region headers → API Gateway HTTP API → collector Lambda → DynamoDB on-demand.
Admin report → report Lambda → current backend admin permission check → aggregate counts.

The game ECS service, backend database, DNS and existing game settings are unchanged.

## Resources and permissions

- Account `566235131124`, region `us-east-2`, stack `mpc-website-counter`.
- Private code bucket `mpc-website-counter-artifacts-566235131124-us-east-2`.
- Two ARM Node 22 functions, 128/256 MB, concurrency limits 5/3.
- Encrypted on-demand metrics table; 100 read/write units per second maximum.
- API throttling: collector 10 requests/second with burst 40; reports 1/second,
  burst 4. These bound throughput, not total monthly spending.
- Collector role can only put/update this table. Report role can only query it.
- Reports validate the current bearer token at `/api/admin/access/me`; full
  admins or sub-admins with `overview.view` are authorized. No JWT signing
  secret, user database access or cloud credentials are sent to the browser.
- CORS is limited to the production website/admin domains. The collector also
  checks the Origin header, payload size, schema and event age. Origin can be
  spoofed outside a browser: this is a public, best-effort analytics counter,
  not an audited billing or fraud-proof system.
- Logs retain seven days and do not include event payloads or credentials.

## Counting

- Visitors = distinct anonymous browsers within the full selected period.
- Visits = distinct sessions; a new session begins after 30 minutes without a
  page view. Page reloads count as page views but retain the same visitor/session.
- Page views = initial page loads and SPA path changes. Query-only changes to a
  legal agreement do not count as new pages. There are no activity heartbeat events.
- Reports cover 7, 30 or 90 calendar days in a selected IANA time zone, including
  the partial current day. The admin defaults to Jamaica (UTC−5); Central/Texas,
  Eastern, Pacific, London and UTC are also available. The API defaults to UTC
  for compatibility. Pass `?days=30&timezone=America%2FChicago` to `/report`.
- Daily visitors/visits, top pages, sources and devices are supplemented by
  countries, regions/states, hour-of-day, weekday and day-of-month charts.
  Patterns use average page views per observed hour slot or calendar day,
  accounting for repeated weekdays and daylight-saving transitions. First and
  current observation days can be partial. A visit spanning hours can appear in
  several hour bins. Peak cards flag ties; they describe observations, not forecasts.
- Collection adds one bounded UTC hour/page counter to each existing session-day
  record, in the same atomic transaction as the total/page counters. Adjacent UTC
  partitions are read for local-time reports and filtered to local calendar dates.
- Country/region comes from CloudFront's IP-derived headers. A private origin
  token authenticates those headers; client-supplied geography on the direct API
  is ignored. No city, GPS coordinates or raw IP is stored. CloudFront access
  logging is disabled. Location is approximate (VPN/mobile networks can differ).
  The first available country/region per session/UTC day is retained. AWS-sourced
  requests may lack region headers. Unknown is displayed explicitly.
- Views collected before hourly tracking remain in totals on their original UTC
  date; their hour cannot be reconstructed and they are excluded from patterns.
  The response `coverage` states timed, legacy and located view counts. A fixed
  `DetailsStartAt` timestamp prevents pre-activation days from diluting averages.
  Preserve this timestamp on future deployments.
- Daily session records expire after 94 days. A transactional event-ID marker
  expires after two days; events older than one day are rejected. Retrying a
  successful request cannot increment counts twice.
- Both event marker and counters commit atomically. Concurrent retries/conflicts
  cause retry responses. Raw events, IP addresses, wallet/account identities,
  full URLs, query strings, referrer paths and text input are not stored.
- Reports query date partitions, paginate, and cache for 60 seconds per time zone/date range per warm
  function. Permissions are checked on every request, including cached reports.
  More than 100,000 session-day records in one report returns an explicit error;
  introduce precomputed rollups if measured traffic approaches this threshold.
- Visitors are browser estimates, not identified individuals. Clearing storage,
  different devices, blockers and privacy settings affect counts. Game logins and
  current websocket presence are separate metrics.
- Historical visits before activation are unavailable.

## Cost expectations

There is no provisioned instance, stream-hour charge or analytics subscription.
API calls, Lambda execution, DynamoDB requests/storage, and small S3/log storage
and CloudFront requests/transfers are billed by usage. CloudFront uses pay-as-you-go
with no fixed subscription. Free allowances depend on the account and other usage.

Ohio DynamoDB pricing checked via the AWS Pricing API on 2026-11-02 is $0.625 per
million write request units. Each page view writes two small items transactionally
(4 units while each item is under 1 KB), approximately $0.25 per 100,000 page views in write charges. HTTP API,
Lambda, report reads, storage and transfers are additional. At 100,000 page views
per month with light admin reporting, roughly $1/month is a planning estimate,
not a cap or guarantee. Hourly fields may increase item size at high per-session activity.
CloudFront adds metered requests/transfers after shared account free allowances. Inspect actual billing after collecting real traffic.

## Deployment

1. `npm ci --omit=dev` in `infrastructure/website-analytics` using Node 22.
2. Package `collector.js`, `index.js`, `model.js`, package files and dependencies.
   Upload a content-hashed ZIP to the private code bucket.
3. Deploy `template.yaml` with CodeBucket, CodeKey and AppId, a new random
   48-byte `EdgeToken` (NoEcho), and the UTC `DetailsStartAt` activation timestamp.
   On updates use previous values for the token and timestamp; never commit the token. A first validation
   uses `mpc_website_test`; production uses `mpc_website`. Test records are isolated
   by app prefix and cannot appear in production reports.
4. Set `REACT_APP_WEBSITE_ANALYTICS_API` to the stack ReportEndpoint on Amplify app
   `d32m7serxcqbdj`, branch **admin**. Preserve all other environment variables.
5. On branch **main**, set `REACT_APP_WEBSITE_ANALYTICS_ENABLED=true`,
   `REACT_APP_WEBSITE_ANALYTICS_APP_ID=mpc_website`,
   `REACT_APP_WEBSITE_ANALYTICS_ENDPOINT` to GeoCollectEndpoint (CloudFront), and
   `REACT_APP_WEBSITE_ANALYTICS_HOSTS=modernpokerclub.com,www.modernpokerclub.com`.
   The old direct CollectEndpoint still accepts cached clients with unknown location.
6. Build/deploy main and admin, then verify production collection and authenticated
   `/home/website-analytics` rendering. Do not modify the game ECS service.

Rollback: disable the website flag and rebuild. AWS counters remain isolated.
Deleting the CloudFormation stack retains the table deliberately; remove stored
analytics separately only if authorized. Private artifact storage is separate.

## Verification

- `node --test infrastructure/website-analytics/*.test.js`
- Admin focused tests: `CI=true npm test -- --watchAll=false --runInBand --watchman=false src/views/WebsiteAnalytics/index.test.js`
- Production builds for main and admin.
- Before first activation only, use an isolated test app prefix for write/deduplication
  checks. Never switch an active production collector to a test prefix.
- Once live, verify actual website page loads reach the CloudFront collector, new
  records contain hourly counts and available coarse geography, and authenticated
  admin reports render the new fields. Anonymous reports must still be rejected.
- Model tests cover forged geo headers, Unicode region names, local midnight,
  DST fall-back, averaging across unequal weekday counts and legacy coverage.
