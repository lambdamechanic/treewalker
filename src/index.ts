import { createRouter, RadixRouter } from 'radix3';

export type RouterT<V> = RadixRouter<{ value: V }>;

export function create<V>(): RouterT<V> {
  return createRouter<{ value: V }>() as RouterT<V>;
}

// Internal representation of radix3 nodes
export interface RNode<V> {
  s: string;
  c?: Record<string, RNode<V>>;
  data?: { value: V };
}

export function* leaves<V>(n: RNode<V>, path = ''): Generator<[string, V]> {
  const here = path + n.s;
  if (n.data) yield [here, n.data.value];
  if (n.c) for (const k in n.c) yield* leaves(n.c[k], here);
}

export const common = (a: string, b: string) => {
  let i = 0;
  for (; i < a.length && i < b.length && a[i] === b[i]; i++);
  return i;
};

function getTree<V>(router: RouterT<V>): RNode<V> | undefined {
  const root = (router as any).ctx?.rootNode;
  if (!root) return undefined;
  const convert = (node: any, label: string): RNode<V> => {
    const out: RNode<V> = { s: label };
    if (node.data) out.data = node.data as { value: V };
    if (node.children && node.children.size > 0) {
      out.c = {} as Record<string, RNode<V>>;
      for (const [seg, child] of node.children.entries()) {
        out.c[seg] = convert(child, seg);
      }
    }
    return out;
  };
  // root node itself has no label; its children hold first segments
  const wrapper: RNode<V> = { s: '' };
  wrapper.c = {} as Record<string, RNode<V>>;
  for (const [seg, child] of root.children.entries()) {
    wrapper.c[seg] = convert(child, seg);
  }
  return wrapper;
}

export function* keysWithPrefixes<A, B>(
  hay: RouterT<A>,
  pre: RouterT<B>
): Generator<[string, A]> {
  const hRoot = getTree(hay);
  const pRoot = getTree(pre);
  if (!hRoot || !pRoot) return;

  interface Frame { h: RNode<A>; p: RNode<B>; path: string }
  const stack: Frame[] = [];
  const yielded = new Set<string>();
  if (pRoot.data) {
    for (const [k, v] of leaves(hRoot)) {
      if (!yielded.has(k)) {
        yielded.add(k);
        yield [k, v];
      }
    }
  }
  if (hRoot.c && pRoot.c) {
    for (const ph in pRoot.c) {
      for (const qh in hRoot.c) {
        stack.push({ h: hRoot.c[qh], p: pRoot.c[ph], path: '' });
      }
    }
  }

  while (stack.length) {
    const { h, p, path } = stack.pop()!;
    const sH = h.s;
    const sP = p.s;
    const k = common(sH, sP);
    if (k === 0) continue;

    const restH = sH.slice(k);
    const restP = sP.slice(k);
    const newPath = path + sH.slice(0, k);

    if (restP.length === 0 && p.data) {
      for (const [k, v] of leaves(h, path)) {
        if (!yielded.has(k)) {
          yielded.add(k);
          yield [k, v];
        }
      }
    }

    if (restH.length === 0 && restP.length === 0) {
      if (h.c && p.c) {
        for (const ch in p.c) {
          const hh = h.c[ch];
          if (hh) stack.push({ h: hh, p: p.c[ch]!, path: newPath });
        }
      }
    } else if (restH.length === 0 && restP.length > 0) {
      if (p.c) stack.push({ h, p: { s: restP, c: p.c, data: p.data }, path: newPath });
    } else if (restH.length > 0 && restP.length === 0) {
      // hay subtree already yielded above
    }
  }
}
