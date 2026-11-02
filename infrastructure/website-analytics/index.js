'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { datesFor, summarize } = require('./model');
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cache = new Map();
exports.handler = async event => {
  const respond = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  if (event.requestContext?.http?.method !== 'GET') return respond(405, { message: 'Method not allowed' });
  const days = Number(event.queryStringParameters?.days || 30);
  if (![7, 30, 90].includes(days)) return respond(400, { message: 'Choose a 7, 30, or 90 day reporting period.' });
  const authorization = event.headers?.authorization || '';
  if (!/^bearer [A-Za-z0-9._-]{20,4096}$/i.test(authorization)) return respond(401, { message: 'Sign in to the admin panel.' });
  try {
    // Validate permissions online; never copy the game backend's JWT signing key.
    const access = await fetch('https://server.modernpokerclub.com/api/admin/access/me', {
      headers: { Authorization: authorization }, signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (access.status === 401 || access.status === 403) return respond(access.status, { message: 'Admin analytics access is required.' });
    if (!access.ok) return respond(503, { message: 'Unable to verify admin access. Please try again.' });
    const user = (await access.json()).body;
    if (!user || !(user.role === 'admin' || (user.role === 'sub_admin' && Array.isArray(user.permissions) && user.permissions.includes('overview.view')))) {
      return respond(403, { message: 'Overview permission is required to view website analytics.' });
    }
    const dates = datesFor(days), key = dates[0] + dates[dates.length - 1];
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < 60000) return respond(200, cached.report);
    const byDay = dates.map(date => ({ date, items: [] }));
    let next = 0, count = 0;
    await Promise.all(Array.from({ length: 5 }, async () => {
      while (next < byDay.length) {
        const day = byDay[next++];
        let cursor;
        do {
          const data = await db.send(new QueryCommand({ TableName: process.env.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': `${process.env.APP_ID}#day#${day.date}` },
            ExclusiveStartKey: cursor, ConsistentRead: false }));
          day.items.push(...(data.Items || [])); count += data.Items?.length || 0;
          if (count > 100000) throw new Error('Report exceeds interactive limit');
          cursor = data.LastEvaluatedKey;
        } while (cursor);
      }
    }));
    const report = summarize(byDay);
    if (cache.size > 6) cache.clear();
    cache.set(key, { at: Date.now(), report });
    return respond(200, report);
  } catch (_) {
    console.warn('website_counter_report_failed');
    return respond(503, { message: 'Unable to load website analytics. Please try a shorter reporting period or refresh in a moment.' });
  }
};
