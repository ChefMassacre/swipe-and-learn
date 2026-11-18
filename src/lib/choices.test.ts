import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickChoices } from './choices.ts';

test('easy mode gives four different options including the answer', () => {
  for (let i = 0; i < 50; i++) {
    const c = pickChoices('Wii', ['Wii', 'Xbox', 'GameCube', 'Game Boy', 'PlayStation 2', 'Nintendo 64']);
    assert.equal(c.length, 4);
    assert.ok(c.includes('Wii'));
    assert.equal(new Set(c).size, 4);
  }
});

test('wrong answers come from the same topic first', () => {
  const c = pickChoices('Japan', ['Japan', 'Canada', 'Brazil', 'Nepal'], ['Pug', 'Beagle']);
  assert.deepEqual([...c].sort(), ['Brazil', 'Canada', 'Japan', 'Nepal']);
});

test('small topics borrow from the backup pool, without duplicates', () => {
  const c = pickChoices('Silk', ['Silk', 'silk', 'Wool'], ['Wool', 'Brick', 'Slate', 'Marble']);
  assert.equal(c.length, 4);
  assert.equal(new Set(c.map((x) => x.toLowerCase())).size, 4);
  assert.ok(c.includes('Wool'));
});
