import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { DERMANLI_EVENTS, DERMANLI_RECORDS, nearbyStoryEvent } from '../src/game/dermanli';

test('Dermanlı records and events have unique identifiers', () => {
  assert.equal(new Set(DERMANLI_RECORDS.map(r => r.id)).size, DERMANLI_RECORDS.length);
  assert.equal(new Set(DERMANLI_EVENTS.map(r => r.id)).size, DERMANLI_EVENTS.length);
});
test('events require night, proximity and their minimum night; seen events do not repeat that night', () => {
  const school = DERMANLI_EVENTS.find(e => e.id === 'okul')!;
  assert.equal(nearbyStoryEvent(0, school.x, school.z, new Set()), null);
  assert.equal(nearbyStoryEvent(300, school.x, school.z, new Set()), null);
  assert.equal(nearbyStoryEvent(2100, school.x + 100, school.z, new Set()), null);
  const found = nearbyStoryEvent(2100, school.x, school.z, new Set());
  assert.equal(found?.event.id, 'okul');
  assert.equal(nearbyStoryEvent(2100, school.x, school.z, new Set([found!.key])), null);
});
