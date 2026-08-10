import assert from 'node:assert/strict';
import test from 'node:test';

import { createRewriteOptions } from './hub-routing.mjs';

test('forwards hub routing metadata as request headers and keeps response headers separate', () => {
  const originalHeaders = new Headers({ host: 'demo.example.com' });
  const options = createRewriteOptions(
    originalHeaders,
    {
      'x-pathname': '/privacy',
      'x-search': '?source=footer',
      'x-project': 'demo',
    },
    { 'x-powered-by': 'Feedbase' }
  );

  assert.equal(options.request.headers.get('host'), 'demo.example.com');
  assert.equal(options.request.headers.get('x-pathname'), '/privacy');
  assert.equal(options.request.headers.get('x-search'), '?source=footer');
  assert.equal(options.request.headers.get('x-project'), 'demo');
  assert.equal(options.headers.get('x-powered-by'), 'Feedbase');
  assert.equal(options.headers.get('x-search'), null);
  assert.equal(originalHeaders.get('x-search'), null);
});
