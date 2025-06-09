declare module 'mnemonist/critbit-tree-map' {
  export default class CritbitTreeMap<V> {
    constructor(iterable?: Iterable<[string, V]>);
    root: any;
    size: number;
    clear(): void;
    get(key: string): V | undefined;
    set(key: string, value: V): this;
    delete(key: string): boolean;
    has(key: string): boolean;
    keys(): IterableIterator<string>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[string, V]>;
    [Symbol.iterator](): IterableIterator<[string, V]>;
    forEach(callback: (value: V, key: string) => void, scope?: any): void;
  }
}
