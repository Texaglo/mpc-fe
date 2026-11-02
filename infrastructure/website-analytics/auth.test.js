const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/index.js`, 'utf8');

function harness({ role = 'admin', permissions = [], accessStatus = 200 } = {}) {
  const calls = [];
  const context = {
    exports: {}, process: { env: { CLICKSTREAM_DATABASE: 'mpc_website', CLICKSTREAM_APP_ID: 'mpc_web', ATHENA_WORKGROUP: 'mpc-reports', ALLOWED_ORIGINS: 'https://admin.modernpokerclub.com' } },
    AbortSignal, console: { warn() {} },
    fetch: async (url, options) => {
      calls.push({ type: 'auth', url, options });
      return { status: accessStatus, ok: accessStatus === 200, json: async () => ({ body: { role, permissions } }) };
    },
    require(name) {
      if (name === './report') return require('./report');
      if (name === '@aws-sdk/client-athena') return {
        AthenaClient: class { async send(command) {
          calls.push({ type: 'athena', command });
          return command.kind === 'start' ? { QueryExecutionId: 'test-query' } : { QueryExecution: { Status: { State: 'RUNNING' } } };
        } },
        StartQueryExecutionCommand: class { constructor(input) { this.input = input; this.kind = 'start'; } },
        GetQueryExecutionCommand: class { constructor(input) { this.input = input; this.kind = 'status'; } },
        GetQueryResultsCommand: class {},
      };
      throw new Error('Unexpected dependency');
    },
  };
  vm.runInNewContext(source, context);
  return { calls, handler: context.exports.handler };
}
const request = { requestContext: { http: { method: 'GET' } }, headers: { authorization: 'Bearer fixture-only-test-token-123456', origin: 'https://admin.modernpokerclub.com' } };

test('anonymous, normal players, and unpermitted sub-admins cannot query visitor data', async () => {
  const anonymous = harness();
  assert.equal((await anonymous.handler({ ...request, headers: {} })).statusCode, 401);
  assert.equal(anonymous.calls.length, 0);
  for (const options of [{ role: 'user', permissions: ['overview.view'] }, { role: 'sub_admin', permissions: ['players.view'] }, { accessStatus: 401 }, { accessStatus: 403 }]) {
    const h = harness(options);
    assert.ok([401, 403].includes((await h.handler(request)).statusCode));
    assert.equal(h.calls.filter(call => call.type === 'athena').length, 0);
  }
});

test('admin and Overview delegates are checked against the current backend session', async () => {
  for (const options of [{ role: 'admin' }, { role: 'sub_admin', permissions: ['overview.view'] }]) {
    const h = harness(options);
    const result = await h.handler(request);
    assert.equal(result.statusCode, 202);
    assert.equal(result.headers['Access-Control-Allow-Origin'], request.headers.origin);
    assert.equal(h.calls[0].url, 'https://server.modernpokerclub.com/api/admin/access/me');
    assert.equal(h.calls.filter(call => call.type === 'athena').length, 2);
  }
});

test('invalid periods and unsupported HTTP methods never start a query', async () => {
  const h = harness();
  assert.equal((await h.handler({ ...request, queryStringParameters: { days: '365 OR true' } })).statusCode, 400);
  assert.equal((await h.handler({ ...request, requestContext: { http: { method: 'POST' } } })).statusCode, 405);
  assert.equal(h.calls.length, 0);
});
