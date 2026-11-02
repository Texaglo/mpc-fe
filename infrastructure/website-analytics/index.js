'use strict';

const { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } = require('@aws-sdk/client-athena');
const { queryFor, reportFromRows, queryToken } = require('./report');
const client = new AthenaClient({});

exports.handler = async event => {
  const origin = event.headers?.origin || '';
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',');
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (origins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  const method = event.requestContext?.http?.method;
  if (method !== 'GET') return respond(405, { message: 'Method not allowed' });
  const days = Number(event.queryStringParameters?.days || 30);
  if (![7, 30, 90].includes(days)) return respond(400, { message: 'Choose a 7, 30, or 90 day reporting period.' });
  const authorization = event.headers?.authorization || '';
  if (!/^bearer [A-Za-z0-9._-]{20,4096}$/i.test(authorization)) return respond(401, { message: 'Sign in to the admin panel.' });
  try {
    // Validate the existing session and current permissions against the authoritative
    // backend. No JWT signing secret or AWS credentials are exposed to the browser.
    const access = await fetch('https://server.modernpokerclub.com/api/admin/access/me', {
      headers: { Authorization: authorization }, signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (access.status === 401 || access.status === 403) return respond(access.status, { message: 'Admin analytics access is required.' });
    if (!access.ok) return respond(503, { message: 'Unable to verify admin access. Please try again.' });
    const data = await access.json();
    const user = data.body;
    if (!user || !(user.role === 'admin' || (user.role === 'sub_admin' && Array.isArray(user.permissions) && user.permissions.includes('overview.view')))) {
      return respond(403, { message: 'Overview permission is required to view website analytics.' });
    }
    const period = queryFor({ database: process.env.CLICKSTREAM_DATABASE, appId: process.env.CLICKSTREAM_APP_ID, days });
    const result = await client.send(new StartQueryExecutionCommand({
      QueryString: period.sql, WorkGroup: process.env.ATHENA_WORKGROUP,
      ClientRequestToken: queryToken(period.sql),
      ResultReuseConfiguration: { ResultReuseByAgeConfiguration: { Enabled: true, MaxAgeInMinutes: 15 } },
    }));
    const query = await client.send(new GetQueryExecutionCommand({ QueryExecutionId: result.QueryExecutionId }));
    const status = query.QueryExecution.Status;
    if (['QUEUED', 'RUNNING'].includes(status.State)) return respond(202, { status: 'processing', retryAfterSeconds: 3 });
    if (status.State !== 'SUCCEEDED') {
      console.warn(JSON.stringify({ event: 'analytics_query_failed', queryId: result.QueryExecutionId, state: status.State }));
      return respond(503, { message: 'Website analytics is temporarily unavailable. Please try again after the next data refresh.' });
    }
    const output = await client.send(new GetQueryResultsCommand({ QueryExecutionId: result.QueryExecutionId, MaxResults: 1000 }));
    const columns = output.ResultSet.ResultSetMetadata.ColumnInfo.map(column => column.Name);
    const rows = output.ResultSet.Rows.slice(1).map(row => Object.fromEntries(columns.map((name, index) => [name, row.Data[index]?.VarCharValue || ''])));
    return respond(200, reportFromRows(rows, period, status.CompletionDateTime.toISOString()));
  } catch (_) {
    // Avoid logging authorization headers, visitor identifiers, or query results.
    console.warn(JSON.stringify({ event: 'analytics_request_failed' }));
    return respond(503, { message: 'Unable to load website analytics. Please try again.' });
  }
};
