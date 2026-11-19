import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Vercel security headers and immutable cache target only hashed bundles', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const rules = config.headers as { source: string; headers: { key: string; value: string }[] }[];
  const headers = new Map(rules[0].headers.map(({ key, value }) => [key.toLowerCase(), value]));
  for (const key of ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) assert.ok(headers.get(key), key);
  assert.match(headers.get('content-security-policy')!, /frame-ancestors 'none'/);
  assert.notEqual(headers.get('access-control-allow-origin'), '*');
  for (const rule of rules.slice(1)) {
    const pattern = new RegExp('^' + rule.source.replace(':file(', '(') + '$');
    assert.ok(!pattern.test('/assets/archive/gasilhane.jpg'));
    assert.ok(!pattern.test('/assets/index.js'));
    assert.match(rule.headers[0].value, /immutable/);
  }
  assert.ok(new RegExp('^' + rules[1].source.replace(':file(', '(') + '$').test('/assets/index-DLICMV5S.js'));
  assert.ok(new RegExp('^' + rules[2].source.replace(':file(', '(') + '$').test('/assets/index-BodYdkWm.css'));
});
