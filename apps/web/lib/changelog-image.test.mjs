import assert from 'node:assert/strict';
import test from 'node:test';

import { getChangelogImage } from './changelog-image.mjs';

test('returns null when a changelog has no image', () => {
  assert.equal(getChangelogImage(undefined), null);
  assert.equal(getChangelogImage(null), null);
  assert.equal(getChangelogImage(''), null);
  assert.equal(getChangelogImage('   '), null);
});

test('returns the image URL when one is provided', () => {
  assert.equal(getChangelogImage('https://example.com/release.png'), 'https://example.com/release.png');
});
