import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createInitialAutopsyCases } from '../src/game/autopsy';
import { readWatch, storeWatch, type WatchStep } from '../src/game/firstWatch';
import { filterDialogueOptions, VILLAGE_NPCS } from '../src/game/npcs';
import { readControls, readMuted, storeControls, storeMuted } from '../src/game/preferences';
import { DELIVERY_FILES, validDelivery } from '../src/game/registry';
import {
  DEFAULT_CONTROL_SETTINGS,
  INITIAL_CLUES,
  INITIAL_INVENTORY,
  type AutopsyCaseId,
} from '../src/game/types';

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  values.clear();
  storeWatch(null);
  storeControls(DEFAULT_CONTROL_SETTINGS);
  storeMuted(false);
});

test('both telephone choices and each earlier watch checkpoint can be resumed', () => {
  for (const step of ['arrival', 'ledger', 'telephone', 'answered', 'waited'] as WatchStep[]) {
    storeWatch(step);
    assert.equal(readWatch(), step);
  }
  storage.setItem('son_vazife_save_v2', 'existing village save');
  storeWatch(null);
  assert.equal(readWatch(), null);
  assert.equal(storage.getItem('son_vazife_save_v2'), 'existing village save');
});

test('an unknown watch checkpoint cannot open a blank scene', () => {
  storage.setItem('son_vazife_first_watch_v1', 'unknown');
  assert.equal(readWatch(), null);
});

test('title and village share validated preferences', () => {
  storeMuted(true);
  assert.equal(readMuted(), true);
  storeControls({ ...DEFAULT_CONTROL_SETTINGS, graphicsQuality: 'low', invertY: true });
  assert.equal(readControls().graphicsQuality, 'low');
  assert.equal(readControls().invertY, true);
  storage.setItem('son_vazife_controls_v1', '{"graphicsQuality":"invalid","mouseSensitivity":25}');
  assert.equal(readControls().graphicsQuality, 'auto');
  assert.equal(readControls().mouseSensitivity, 2.4);
});

test('blocked storage does not break play or turn sound back on during this session', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage denied');
    },
  });
  storeMuted(true);
  storeWatch('telephone');
  storeControls({ ...DEFAULT_CONTROL_SETTINGS, mouseSensitivity: 0.7 });
  assert.equal(readMuted(), true);
  assert.equal(readWatch(), 'telephone');
  assert.equal(readControls().mouseSensitivity, 0.7);
});

test('only a filed first-watch clue unlocks Hasan’s question about the earlier funeral', () => {
  const clues = INITIAL_CLUES.map((c) => ({ ...c }));
  const options = () =>
    filterDialogueOptions(
      VILLAGE_NPCS.bekci.nodes.root.options,
      clues,
      createInitialAutopsyCases(),
      INITIAL_INVENTORY,
    );
  assert.ok(!options().some((o) => o.id === 'ask_first_register'));
  clues.find((c) => c.id === 'clue_first_ledger')!.discovered = true;
  const question = options().find((o) => o.id === 'ask_first_register');
  assert.ok(question?.nextNodeId && VILLAGE_NPCS.bekci.nodes[question.nextNodeId]);
});

for (const id of Object.keys(DELIVERY_FILES) as AutopsyCaseId[]) {
  test(`delivery ${id} requires a corroborated answer in both fields`, () => {
    const [a, b] = DELIVERY_FILES[id].fields;
    assert.ok(a.options.includes(a.answer) && b.options.includes(b.answer));
    assert.ok(validDelivery(id, [a.answer, b.answer]));
    for (const answers of [
      [],
      [a.answer],
      ['', b.answer],
      [a.answer, b.options.find((x) => x !== b.answer)!],
    ]) {
      assert.equal(validDelivery(id, answers), false);
    }
  });
}
