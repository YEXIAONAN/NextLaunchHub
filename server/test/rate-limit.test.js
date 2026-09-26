import assert from 'node:assert/strict';
import test from 'node:test';
import { createRateLimit } from '../src/middleware/rate-limit.js';

test('rate limit rejects requests after the configured maximum', () => {
  const middleware = createRateLimit({ windowMs: 60_000, max: 2 });
  const req = { ip: 'test-1', baseUrl: '/api/public', path: '/test' };
  const errors = [];
  const next = (error) => errors.push(error || null);

  middleware(req, {}, next);
  middleware(req, {}, next);
  middleware(req, {}, next);

  assert.equal(errors[0], null);
  assert.equal(errors[1], null);
  assert.equal(errors[2].status, 429);
});

test('rate limit keeps different clients in separate buckets', () => {
  const middleware = createRateLimit({ windowMs: 60_000, max: 1 });
  const errors = [];
  const next = (error) => errors.push(error || null);

  middleware({ ip: 'test-2', baseUrl: '/api/public', path: '/test' }, {}, next);
  middleware({ ip: 'test-3', baseUrl: '/api/public', path: '/test' }, {}, next);

  assert.deepEqual(errors, [null, null]);
});
