import assert from 'node:assert/strict';
import test from 'node:test';

import { isTrustedMutationRequest } from './csrf.mjs';

function request(headers = {}) {
  return new Request('https://dash.example.com/api/v1/projects/demo/pages', { headers });
}

test('accepts same-origin mutation requests using Origin or Referer', () => {
  assert.equal(isTrustedMutationRequest(request({ origin: 'https://dash.example.com' })), true);
  assert.equal(
    isTrustedMutationRequest(request({ referer: 'https://dash.example.com/demo/settings/hub?tab=pages' })),
    true
  );
});

test('rejects cross-origin, malformed, null, and missing browser origins', () => {
  for (const headers of [
    { origin: 'https://evil.example' },
    { origin: 'null' },
    { origin: 'not a url' },
    { referer: 'https://evil.example/attack' },
    {},
  ]) {
    assert.equal(isTrustedMutationRequest(request(headers)), false);
  }
});

test('allows authorization-header API clients to rely on API-key authentication', () => {
  assert.equal(isTrustedMutationRequest(request({ authorization: 'Bearer project-api-key' })), true);
});
