import { ICache } from "../api/ICache";
import { CacheError, CacheErrorCode } from "../api/CacheError";

interface TTLEntry<V> {
  value: V;
  expiresAt: number; // Date.now() + ttlMs
}

/**
 * Time-To-Live (TTL) cache implementation.
 *
 * Every entry expires after `defaultTtlMs` milliseconds from the time it was last `set`.
 * Expired entries are lazily evicted on `get`/`has` and optionally swept in the
 * background by an interval timer.
 *
 * **Memory management:** Call {@link destroy} to stop the background timer when the
 * cache is no longer needed, otherwise the timer will keep the object alive.
 *
 * @template K - Key type
 * @template V - Value type
 * @internal — do not import directly; use {@link CacheFactory} instead.
 */
export class TTLCache<K, V> implements ICache<K, V> {
  private readonly defaultTtlMs: number;
  private readonly store: Map<K, TTLEntry<V>> = new Map();
  private readonly timer: ReturnType<typeof setInterval> | null = null;
  // ReturnType<typeof setInterval> works in both Node and browser environments

  /**
   * @param defaultTtlMs     - Milliseconds before an entry expires. Must be > 0.
   * @param cleanupIntervalMs - If provided, a background sweep runs every this many ms.
   * @throws {CacheError} INVALID_TTL if defaultTtlMs <= 0
   */
  constructor(defaultTtlMs: number, cleanupIntervalMs?: number) {
    if (defaultTtlMs <= 0) {
      throw new CacheError(
        CacheErrorCode.INVALID_TTL,
        `TTLCache defaultTtlMs must be > 0, got ${defaultTtlMs}`
      );
    }
    this.defaultTtlMs = defaultTtlMs;
    if (cleanupIntervalMs && cleanupIntervalMs > 0) {
      this.timer = setInterval(() => this.sweep(), cleanupIntervalMs);
      // Allow Node process to exit even if timer is still active
      const t = this.timer as unknown as { unref?: () => void };
      if (typeof t?.unref === "function") t.unref();
    }
  }

  /**
   * Retrieves the value for `key`, returning `undefined` if absent or expired.
   * Expired entries are lazily removed on access.
   *
   * @param key - The key to look up
   * @returns The cached value, or `undefined` if absent or expired
   */
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Inserts or refreshes an entry, resetting its TTL clock.
   *
   * @param key   - Must not be null or undefined
   * @param value - The value to cache
   * @throws {CacheError} INVALID_KEY if key is null or undefined
   */
  set(key: K, value: V): void {
    if (key === null || key === undefined) {
      throw new CacheError(CacheErrorCode.INVALID_KEY, "Cache key must not be null or undefined");
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.defaultTtlMs });
  }

  /**
   * Removes the entry for `key`.
   *
   * @param key - The key to remove
   * @returns `true` if the entry existed (and had not yet expired) and was removed
   */
  delete(key: K): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    this.store.delete(key);
    // Return false if already expired (semantically the entry wasn't "present")
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Returns `true` if the cache holds a non-expired entry for `key`.
   * Lazily removes the entry if it has expired.
   *
   * @param key - The key to check
   */
  has(key: K): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Removes all entries (expired or not) from the cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Number of entries currently tracked — includes entries that have expired
   * but not yet been swept. Use {@link has} for accurate existence checks.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Stops the background cleanup timer.
   * Call this when the cache is no longer needed to avoid memory leaks.
   */
  destroy(): void {
    if (this.timer !== null) clearInterval(this.timer);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Removes all entries whose TTL has elapsed. */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}