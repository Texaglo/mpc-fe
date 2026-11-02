# Website analytics — deployment handoff

## Current status (2026-11-02)

Website tracker, admin view, authenticated report Lambda, and CloudFormation
template are implemented locally. **No Clickstream AWS resources have been
created, and no production website/admin deployment has occurred.** AWS CLI login
works for account `566235131124`, profile `mpc-admin`, region `us-east-2`.

The admin displays an explicit connection-pending state until configured. The
separate local design preview uses labeled sample data; it is not a production
metrics source and must never be included in the deployed application.

## Proposed architecture

1. Official [AWS Clickstream Guidance](https://github.com/aws-solutions-library-samples/guidance-for-clickstream-analytics-on-aws),
   inspected version `0be7644` / 1.1.15.
2. Separate ingestion service and HTTPS hostname, dedicated S3 data storage.
3. Guidance data processing to `event_v2`, with UA enrichment and Athena modeling.
4. This repository's small Lambda/API Gateway reporting layer queries that table.
5. `/home/website-analytics` draws native admin charts from aggregate results.

QuickSight and Redshift are optional and are not required by this implementation.
The report service revalidates the existing admin JWT with
`https://server.modernpokerclub.com/api/admin/access/me` on every request. Only full
admins and sub-admins with `overview.view` may retrieve reports. The browser never
receives AWS credentials or the backend JWT signing key.

**Do not update or restart the poker ECS service for this feature.** Its
stop-before-start deployment configuration and process-local game ownership need
separate work before overlapping game tasks are safe. Analytics is independent.

## Information still needed

- Monthly analytics budget (required before provisioning recurring resources).
- Email for the Guidance Cognito console owner and budget alerts.

The [AWS cost guide](https://docs.aws.amazon.com/solutions/latest/clickstream-analytics-on-aws/cost.html)
has a 10 RPS direct-to-S3 ingestion example of $153.80/month, plus processing,
networking, logging, and query costs. Its optional six-hour processing example
lists $22.20/month for EMR. These are illustrative us-east-1 figures, not a quote
for the Ohio account. A planning allowance of $200–$300/month for an Athena-only,
low-traffic setup needs validation against the selected instance sizes, NAT,
retention, processing interval, and real usage. Full Redshift/QuickSight reporting
costs more. Budgets alert; they do not impose a hard spending cap.

Existing Ohio VPC `vpc-073b2998cde079cce` has three public subnets and no NAT gateway.
The Guidance prerequisites include private processing subnets and network egress;
prepare a separate network/stack or deliberately add analytics-only private
subnets. Do not change the poker ALB, target group, DNS, or security groups.

## Deployment steps after budget/email selection

1. Follow the official Guidance deployment instructions. Use separate named
   artifact/data buckets with public access blocked and encryption enabled.
   Build and publish the Guidance artifacts/images; do not point its deployment
   script at the existing `mpc/backend` ECR repository. Use the official control
   plane with Cognito, register the MPC website project/application, and deploy
   a direct-to-S3 pipeline with Athena modeling. Enable HTTPS and constrain CORS
   to the production website hosts. Use a separate test app for validation.
2. Confirm the processed `event_v2` table and its Glue database, app ID, data
   bucket, and project-specific processed-data prefix. This API expects the
   Guidance v2 table schema: custom parameters are a map of `{value,type}` structs.
3. Package `infrastructure/website-analytics/index.js` and `report.js` in a ZIP.
   Node.js 22 Lambda includes AWS SDK v3; for dependency pinning, package a pinned
   `@aws-sdk/client-athena` alongside these files. Upload the ZIP to the private
   artifact bucket, then deploy `template.yaml` as `mpc-website-analytics-api`.
   Supply CodeBucket, CodeKey, DataBucket, DataPrefix (trailing slash), Database,
   and AppId. The template assumes SSE-S3; add scoped KMS decrypt permissions if
   the data bucket uses a customer-managed KMS key.
4. The template enforces a 1 GiB Athena scan limit per query, result reuse for
   15 minutes, API throttling, aggregate-only output, private query results, and
   seven-day result expiration. Configure a budget and alerts for the full stack.
5. Set `REACT_APP_WEBSITE_ANALYTICS_API` to the `ReportEndpoint` stack output on
   Amplify app `d32m7serxcqbdj`, branch **admin**. Preserve existing environment
   variables. Deploy the website integration to the **main** branch with its
   Clickstream variables. Do not swap these branches.
6. Verify a full event delivery in the test app, including Athena processing and
   authenticated rendering. Verify 401/403 for anonymous/unpermitted viewers.
   Enable production tracking only after the collector is healthy. Confirm actual
   production events, deployment success, and browser errors before reporting live.

## Metrics and limitations

- Distinct anonymous browsers, sessions, page views, game CTA clicks.
- Average active engagement per session and sessions with a game click / sessions.
- Daily visitors/sessions, top pages, external referrers, device categories, CTAs.
- Fixed 7/30/90-day reports in UTC; the current day is partial.
- Ingestion and processing latency plus up to 15-minute query reuse. No live-online
  claim. Existing game login/socket statistics remain independent.
- Retry deliveries are deduplicated by event ID. Distinct visitors are computed
  across the whole date range, never summed from daily counts.
- These statistics start when enabled; historical website activity is unavailable.

## Validation completed locally

- Website and admin production builds pass (existing unrelated lint warnings).
- Six website session/privacy/retry tests pass.
- Six report/query/auth tests pass.
- Three admin filter/empty/error-state tests pass.
- AWS `validate-template` accepts the report API template without creating resources.
- Local UI preview inspected; live event ingestion/query validation is still pending.
