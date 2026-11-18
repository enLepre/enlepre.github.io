import test from 'node:test';
import assert from 'node:assert/strict';
import { newestFirst } from '../src/lib/sort.mjs';
test('sorts publication dates descending, preserves input, and breaks ties by id', () => {
  const entry = (id, date) => ({ id, data: { date: new Date(date) } });
  const input = [entry('old', '2020-01-01'), entry('b', '2026-10-01'), entry('new', '2026-10-07'), entry('a', '2026-10-01')];
  assert.deepEqual(newestFirst(input).map(e => e.id), ['new', 'a', 'b', 'old']);
  assert.equal(input[0].id, 'old');
  assert.deepEqual(newestFirst([]), []);
});

test('Markdown order preserves same-date ordering independently of filenames', () => {
  const entry = (id, order, date = '2026-10-11') => ({ id, data: { date: new Date(date), order } });
  const input = [entry('a', 3), entry('z', 1), entry('m', 2), entry('without-order'), entry('newer', 9, '2026-10-12')];
  assert.deepEqual(newestFirst(input).map(e => e.id), ['newer', 'z', 'm', 'a', 'without-order']);
  assert.equal(input[0].id, 'a');
});
