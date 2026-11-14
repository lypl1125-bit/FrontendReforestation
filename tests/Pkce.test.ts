import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPkcePair } from '../src/services/pkce.ts';

test('creates a URL-safe PKCE verifier and matching SHA-256 challenge', async () => {
  const { verifier, challenge } = await createPkcePair();

  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  const expectedChallenge = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assert.equal(challenge, expectedChallenge);
});
