import { ICache } from "../api/ICache";
import { CacheError, CacheErrorCode } from "../api/CacheError";


interface LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

export class LRUCache<K, V> implements ICache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, LRUNode<K, V>> = new Map();

  private readonly head: LRUNode<K, V>;
  private readonly tail: LRUNode<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new CacheError(
        CacheErrorCode.INVALID_CAPACITY,
        `LRUCache capacity must be > 0, got ${capacity}`
      );
    }
    this.capacity = capacity;
    this.head = {} as LRUNode<K, V>;
    this.tail = {} as LRUNode<K, V>;
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.head.prev = null;
    this.tail.next = null;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.promote(node);
    return node.value;
  }

  set(key: K, value: V): void {
    if (key === null || key === undefined) {
      throw new CacheError(CacheErrorCode.INVALID_KEY, "Cache key must not be null or undefined");
    }
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.promote(existing);
      return;
    }
    if (this.map.size >= this.capacity) {
      this.evictLRU();
    }
    const node: LRUNode<K, V> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.insertFront(node);
  }

  delete(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    this.removeNode(node);
    this.map.delete(key);
    return true;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  clear(): void {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    return this.map.size;
  }

  private insertFront(node: LRUNode<K, V>): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private promote(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.insertFront(node);
  }

  private evictLRU(): void {
    const lru = this.tail.prev!;
    if (lru === this.head) return; // empty list
    this.removeNode(lru);
    this.map.delete(lru.key);
  }
}