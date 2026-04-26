export interface ICache<K, V> {
  get(key: K): V | undefined;

  set(key: K, value: V): void;

  delete(key: K): boolean;

  has(key: K): boolean;

  clear(): void;

  readonly size: number;
}