import test from 'node:test';
import { strict as assert } from 'node:assert';
import { createHorrorFigures, disposeHorrorFigures } from '../src/game/horrorFigures';

test('new scare figures are distinct and have animated head and arms', () => {
  const figures = createHorrorFigures();
  assert.equal(figures.length, 2);
  assert.notEqual(figures[0].name, figures[1].name);
  for (const f of figures) for (const part of ['scare-head', 'scare-left', 'scare-right']) assert.ok(f.getObjectByName(part));
  disposeHorrorFigures(figures);
});
