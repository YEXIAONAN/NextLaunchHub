import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCookies } from '../src/utils/cookies.js';

test('parseCookies decodes values and ignores malformed entries', () => {
  assert.deepEqual(parseCookies('session=abc%20123; theme=dark; malformed'), {
    session: 'abc 123',
    theme: 'dark'
  });
});

test('parseCookies tolerates invalid URI encoding', () => {
  assert.deepEqual(parseCookies('value=%E0%A4%A'), { value: '%E0%A4%A' });
});
