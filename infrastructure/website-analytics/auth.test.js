'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function load(file, { send = async () => ({ Items: [] }), access = async () => ({ ok: true, json: async () => ({ body: { role: 'admin' } }) }) } = {}) {
  const sandbox = { exports: {}, process: { env: { APP_ID: 'mpc_test', TABLE_NAME: 'test', SITE_ORIGINS: 'https://www.modernpokerclub.com' } }, Buffer, AbortSignal, console: { warn() {} }, fetch: access,
    require: name => name === '@aws-sdk/client-dynamodb' ? { DynamoDBClient: class {} }
      : name === '@aws-sdk/lib-dynamodb' ? { DynamoDBDocumentClient: { from: () => ({ send }) }, QueryCommand: class { constructor(input) { this.input = input; } }, TransactWriteCommand: class { constructor(input) { this.input = input; } } }
        : require(name === './model' ? './model' : name) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), sandbox);
  return sandbox.exports.handler;
}
const request = { requestContext: { http: { method: 'GET' } }, headers: { authorization: 'Bearer valid-test-session-token' }, queryStringParameters: { days: '7' } };
test('reports require a current admin session and never query on auth failure', async () => {
  let reads = 0;
  let h = load('index.js', { send: async () => { reads++; }, access: async () => ({ ok: false, status: 401 }) });
  assert.equal((await h({ ...request, headers: {} })).statusCode, 401);
  assert.equal((await h(request)).statusCode, 401); assert.equal(reads, 0);
  h = load('index.js', { send: async () => { reads++; }, access: async () => ({ ok: true, json: async () => ({ body: { role: 'player', permissions: ['overview.view'] } }) }) });
  assert.equal((await h(request)).statusCode, 403); assert.equal(reads, 0);
});
test('sub-admin permissions are rechecked even when report is cached', async () => {
  let allowed = true, reads = 0;
  const h = load('index.js', { send: async () => { reads++; return { Items: [] }; }, access: async () => ({ ok: true, json: async () => ({ body: { role: 'sub_admin', permissions: allowed ? ['overview.view'] : [] } }) }) });
  assert.equal((await h(request)).statusCode, 200); assert.equal(reads, 7);
  assert.equal((await h(request)).statusCode, 200); assert.equal(reads, 7);
  allowed = false; assert.equal((await h(request)).statusCode, 403); assert.equal(reads, 7);
});
test('reports paginate daily data and return errors instead of misleading zeros', async () => {
  let reads = 0;
  const h = load('index.js', { send: async cmd => { reads++; return cmd.input.ExclusiveStartKey ? { Items: [] } : { Items: [], LastEvaluatedKey: { pk: 'test' } }; } });
  assert.equal((await h(request)).statusCode, 200); assert.equal(reads, 14);
  assert.equal((await h({ ...request, queryStringParameters: { days: '999' } })).statusCode, 400);
  assert.equal((await load('index.js', { access: async () => { throw Error('offline'); } })(request)).statusCode, 503);
});
const sample = () => ({ appId: 'mpc_test', events: [{ id: '11111111-1111-4111-8111-111111111111', visitorId: '22222222-2222-4222-8222-222222222222', sessionId: '33333333-3333-4333-8333-333333333333', timestamp: Date.now(), path: '/', source: 'Direct', device: 'Desktop' }] });
const collect = body => ({ requestContext: { http: { method: 'POST' } }, headers: { origin: 'https://www.modernpokerclub.com', 'content-type': 'application/json' }, body: JSON.stringify(body) });
test('collector rejects unauthorized origins, expired events and unsafe paths before writes', async () => {
  let writes = 0; const h = load('collector.js', { send: async () => { writes++; } });
  assert.equal((await h({ ...collect(sample()), headers: { origin: 'https://evil.test' } })).statusCode, 403);
  const bad = sample(); bad.events[0].path = '/wallet/address'; assert.equal((await h(collect(bad))).statusCode, 400);
  const old = sample(); old.events[0].timestamp = 1; assert.equal((await h(collect(old))).statusCode, 400); assert.equal(writes, 0);
});
test('collector treats only a dedupe conflict as success and permits retry after a failed write', async () => {
  const duplicate = Object.assign(Error('duplicate'), { name: 'TransactionCanceledException', CancellationReasons: [{ Code: 'ConditionalCheckFailed' }, { Code: 'None' }] });
  assert.equal((await load('collector.js', { send: async () => { throw duplicate; } })(collect(sample()))).statusCode, 200);
  const conflict = Object.assign(Error('retry'), { name: 'TransactionCanceledException', CancellationReasons: [{ Code: 'None' }, { Code: 'TransactionConflict' }] });
  assert.equal((await load('collector.js', { send: async () => { throw conflict; } })(collect(sample()))).statusCode, 503);
});

test('report caches are isolated by time zone and unsupported zones are rejected', async () => {
  let reads = 0;
  const h = load('index.js', { send: async () => { reads++; return { Items: [] }; } });
  assert.equal((await h(request)).statusCode, 200);
  const local = { ...request, queryStringParameters: { days: '7', timezone: 'America/Jamaica' } };
  assert.equal(JSON.parse((await h(local)).body).timezone, 'America/Jamaica');
  assert.equal(reads, 16);
  await h(local); assert.equal(reads, 16);
  assert.equal((await h({ ...request, queryStringParameters: { timezone: 'Invalid' } })).statusCode, 400);
});
