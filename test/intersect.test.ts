import assert from 'assert';
import { runTest, TestCase, lists, integers } from 'minitsis';
import { NodeDataStore } from 'minitsis-node';
import { create, keysWithPrefixes, RouterT } from '../src/index';

// generator for short lowercase words
const letters = integers(97, 102).map((n: number) => String.fromCharCode(n));
const wordGen = lists(letters, 1, 4).map((chars: string[]) => chars.join(''));
const wordListGen = lists(wordGen, 0, 6);

function buildTrie(words: Iterable<string>): RouterT<boolean> {
  const trie = create<boolean>();
  for (const w of words) trie.insert(w, { value: true });
  return trie;
}

function naiveIntersect(qWords: string[], iWords: string[]): string[] {
  const result = new Set<string>();
  for (const q of qWords) {
    for (const i of iWords) {
      if (q.startsWith(i)) {
        result.add(q);
        break;
      }
    }
  }
  return Array.from(result).sort();
}

async function property(tc: TestCase) {
  const qWords = tc.any(wordListGen);
  const iWords = tc.any(wordListGen);

  const qTrie = buildTrie(qWords);
  const iTrie = buildTrie(iWords);

  const fast = Array.from(keysWithPrefixes(qTrie, iTrie)).map(([k]) => k).sort();
  const slow = naiveIntersect(qWords, iWords);

  assert.deepStrictEqual(fast, slow);
}
(property as any).testName = 'intersect property';

runTest(50, 1, new NodeDataStore<Uint8Array>('test.db'))(property).then(() => {
  console.log('ok');
});
