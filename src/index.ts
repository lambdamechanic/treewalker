import CritbitTreeMap from 'mnemonist/critbit-tree-map';

// Traverse every leaf in the critbit node
export function* descendCritbit(node: any): IterableIterator<string> {
  if (!node) return;
  if (node.key !== undefined) {
    yield node.key as string;
  } else {
    if (node.left) yield* descendCritbit(node.left);
    if (node.right) yield* descendCritbit(node.right);
  }
}

// Walk two critbit tries in lockstep and yield every key of `qTrie` that matches
// any prefix stored in `iTrie`.
export function* intersectTries<V1, V2>(
  qTrie: CritbitTreeMap<V1>,
  iTrie: CritbitTreeMap<V2>
): IterableIterator<string> {
  const yielded = new Set<string>();
  for (const prefix of descendCritbit((iTrie as any).root)) {
    for (const key of searchPrefix((qTrie as any).root, prefix as string)) {
      if (!yielded.has(key)) {
        yielded.add(key);
        yield key;
      }
    }
  }
}

function* searchPrefix(node: any, prefix: string): IterableIterator<string> {
  if (!node) return;

  if (node.key !== undefined) {
    if (node.key.startsWith(prefix)) yield node.key as string;
    return;
  }

  const index = node.critbit >> 8;
  const mask = node.critbit & 0xff;

  if (index >= prefix.length) {
    if (node.left) yield* searchPrefix(node.left, prefix);
    if (node.right) yield* searchPrefix(node.right, prefix);
  } else {
    const byte = prefix.charCodeAt(index);
    const dir = (1 + (byte | mask)) >> 8;
    if (dir === 0) {
      if (node.left) yield* searchPrefix(node.left, prefix);
    } else {
      if (node.right) yield* searchPrefix(node.right, prefix);
    }
  }
}
