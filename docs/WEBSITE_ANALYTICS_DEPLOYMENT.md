# Website visitor counter

## Design

The user selected a separate, usage-based AWS counter on 2026-11-02. Amazon
Pinpoint analytics retired on 2026-10-30. This replaces the earlier undeployed
Clickstream Guidance/Athena proposal. No Athena, Kinesis, Redshift, QuickSight,
VPC, NAT gateway, or ECS service is required.

Website page view → API Gateway HTTP API → collector Lambda → DynamoDB on-demand.
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
- Reports cover 7, 30 or 90 UTC calendar days, including the partial current day.
  They show daily visitors/visits, top pages, broad source categories and devices.
- Daily session records expire after 94 days. A transactional event-ID marker
  expires after two days; events older than one day are rejected. Retrying a
  successful request cannot increment counts twice.
- Both event marker and counters commit atomically. Concurrent retries/conflicts
  cause retry responses. Raw events, IP addresses, wallet/account identities,
  full URLs, query strings, referrer paths and text input are not stored.
- Reports query date partitions, paginate, and cache for 60 seconds per warm
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
are billed by usage. Free allowances depend on the account and other usage.

Ohio DynamoDB pricing checked via the AWS Pricing API on 2026-11-02 is $0.625 per
million write request units. Each page view writes two small items transactionally
(4 units), approximately $0.25 per 100,000 page views in write charges. HTTP API,
Lambda, report reads, storage and transfers are additional. At 100,000 page views
per month with light admin reporting, roughly $1/month is a planning estimate,
not a cap or guarantee. Inspect actual billing after collecting real traffic.

## Deployment

1. `npm ci --omit=dev` in `infrastructure/website-analytics` using Node 22.
2. Package `collector.js`, `index.js`, `model.js`, package files and dependencies.
   Upload a content-hashed ZIP to the private code bucket.
3. Deploy `template.yaml` with CodeBucket, CodeKey and AppId. A first validation
   uses `mpc_website_test`; production uses `mpc_website`. Test records are isolated
   by app prefix and cannot appear in production reports.
4. Set `REACT_APP_WEBSITE_ANALYTICS_API` to the stack ReportEndpoint on Amplify app
   `d32m7serxcqbdj`, branch **admin**. Preserve all other environment variables.
5. On branch **main**, set `REACT_APP_WEBSITE_ANALYTICS_ENABLED=true`,
   `REACT_APP_WEBSITE_ANALYTICS_APP_ID=mpc_website`,
   `REACT_APP_WEBSITE_ANALYTICS_ENDPOINT` to CollectEndpoint, and
   `REACT_APP_WEBSITE_ANALYTICS_HOSTS=modernpokerclub.com,www.modernpokerclub.com`.
6. Build/deploy main and admin, then verify production collection and authenticated
   `/home/website-analytics` rendering. Do not modify the game ECS service.

Rollback: disable the website flag and rebuild. AWS counters remain isolated.
Deleting the CloudFormation stack retains the table deliberately; remove stored
analytics separately only if authorized. Private artifact storage is separate.

## Verification

- `node --test infrastructure/website-analytics/*.test.js`
- Admin focused tests: `CI=true npm test -- --watchAll=false --runInBand --watchman=false src/views/WebsiteAnalytics/index.test.js`
- Production builds for main and admin.
- Live test app: submit the same events twice, query stored session counts, verify
  anonymous report access is rejected, then switch AppId to production.
