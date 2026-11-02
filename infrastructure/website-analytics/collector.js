'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { validate, transaction, geography } = require('./model');
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
exports.handler = async event => {
  const respond = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  if (event.requestContext?.http?.method !== 'POST') return respond(405, { message: 'Method not allowed' });
  if (!(process.env.SITE_ORIGINS || '').split(',').includes(event.headers?.origin)) return respond(403, { message: 'Origin not allowed' });
  if (!String(event.headers?.['content-type']).startsWith('application/json')) return respond(415, { message: 'JSON required' });
  let events;
  try {
    const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
    if (Buffer.byteLength(body) > 16000) return respond(413, { message: 'Batch too large' });
    events = validate(JSON.parse(body), process.env.APP_ID);
  } catch (_) { return respond(400, { message: 'Invalid visitor event' }); }
  try {
    const geo = geography(event.headers, process.env.EDGE_TOKEN);
    // Two writes commit together: retry marker and session/page counters.
    for (const item of events) {
      try { await db.send(new TransactWriteCommand(transaction(item, process.env.APP_ID, process.env.TABLE_NAME, Date.now(), geo))); }
      catch (error) {
        const reasons = error.CancellationReasons;
        if (error.name === 'TransactionCanceledException' && reasons?.[0]?.Code === 'ConditionalCheckFailed'
          && reasons.slice(1).every(reason => !reason.Code || reason.Code === 'None')) continue;
        throw error;
      }
    }
    return respond(200, { accepted: events.length });
  } catch (error) {
    console.warn(JSON.stringify({ event: 'website_counter_write_failed', code: error.name, requestId: error.$metadata?.requestId }));
    return respond(503, { message: 'Please retry' });
  }
};
