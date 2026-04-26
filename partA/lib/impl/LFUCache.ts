import { ICache } from "../api/ICache";
import { CacheError, CacheErrorCode } from "../api/CacheError";

interface LFUNode<K, V> {
  key: K;
  value: V;
  freq: number;
}
export class LFUCache<K, V> implements ICache<K, V> {
  private readonly capacity: number;
  private readonly keyMap: Map<K, LFUNode<K, V>> = new Map();
  private readonly freqMap: Map<number, Set<K>> = new Map();
  private minFreq = 0;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new CacheError(
        CacheErrorCode.INVALID_CAPACITY,
        `LFUCache capacity must be > 0, got ${capacity}`
      );
    }
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    const node = this.keyMap.get(key);
    if (!node) return undefined;
    this.incrementFreq(node);
    return node.value;
  }

  set(key: K, value: V): void {
    if (key === null || key === undefined) {
      throw new CacheError(CacheErrorCode.INVALID_KEY, "Cache key must not be null or undefined");
    }
    const existing = this.keyMap.get(key);
    if (existing) {
      existing.value = value;
      this.incrementFreq(existing);
      return;
    }
    if (this.keyMap.size >= this.capacity) {
      this.evictLFU();
    }
    const node: LFUNode<K, V> = { key, value, freq: 1 };
    this.keyMap.set(key, node);
    this.addToFreq(1, key);
    this.minFreq = 1;
  }

  delete(key: K): boolean {
    const node = this.keyMap.get(key);
    if (!node) return false;
    this.removeFromFreq(node.freq, key);
    this.keyMap.delete(key);
    return true;
  }

  has(key: K): boolean {
    return this.keyMap.has(key);
  }

  clear(): void {
    this.keyMap.clear();
    this.freqMap.clear();
    this.minFreq = 0;
  }

  get size(): number {
    return this.keyMap.size;
  }

  private incrementFreq(node: LFUNode<K, V>): void {
    const oldFreq = node.freq;
    this.removeFromFreq(oldFreq, node.key);
    node.freq += 1;
    this.addToFreq(node.freq, node.key);
    if (this.minFreq === oldFreq && this.freqMap.get(oldFreq)?.size === 0) {
      this.minFreq = node.freq;
    }
  }

  private addToFreq(freq: number, key: K): void {
    if (!this.freqMap.has(freq)) {
      this.freqMap.set(freq, new Set());
    }
    this.freqMap.get(freq)!.add(key);
  }

  private removeFromFreq(freq: number, key: K): void {
    const bucket = this.freqMap.get(freq);
    if (!bucket) return;
    bucket.delete(key);
    if (bucket.size === 0) this.freqMap.delete(freq);
  }

  private evictLFU(): void {
    const bucket = this.freqMap.get(this.minFreq);
    if (!bucket || bucket.size === 0) return;
    const evictKey = bucket.keys().next().value as K;
    bucket.delete(evictKey);
    if (bucket.size === 0) this.freqMap.delete(this.minFreq);
    this.keyMap.delete(evictKey);
  }
}