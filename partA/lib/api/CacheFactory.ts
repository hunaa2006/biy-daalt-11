import { ICache } from "./ICache";
import { LRUCache } from "../impl/LRUCache";
import { LFUCache } from "../impl/LFUCache";
import { TTLCache } from "../impl/TTLCache";
import { CacheError, CacheErrorCode } from "./CacheError";

/** Identifies which eviction / expiry strategy to use */
export type CacheStrategy = "lru" | "lfu" | "ttl";

/**
 * Options specific to the TTL cache strategy.
 */
export interface TTLCacheOptions {
  /**
   * Default time-to-live in milliseconds for every entry.
   * Must be a positive integer.
   */
  defaultTtlMs: number;
  /**
   * How often (in ms) the background sweep removes expired entries.
   * Omit to disable automatic cleanup (entries are still lazily evicted on access).
   */
  cleanupIntervalMs?: number;
}

/**
 * Options accepted by {@link CacheFactory.create}.
 */
export interface CacheFactoryOptions {
  /**
   * Maximum number of entries the cache may hold.
   * Defaults to 128 when omitted.
   * Must be a positive integer.
   */
  capacity?: number;
  /** TTL-specific options — only used when `strategy` is `"ttl"`. */
  ttlOptions?: TTLCacheOptions;
}

/**
 * Static factory that creates {@link ICache} instances.
 *
 * Consumers reference only the `ICache` interface; concrete classes are never
 * exposed outside this package.
 *
 * @example
 * ```ts
 * const cache = CacheFactory.create<string, number>("lru", { capacity: 64 });
 * cache.set("hits", 0);
 * ```
 */
export class CacheFactory {
  /** Prevent instantiation — this class is a static utility. */
  private constructor() {
    throw new CacheError(
      CacheErrorCode.UNSUPPORTED_OPERATION,
      "CacheFactory is a static utility class and cannot be instantiated"
    );
  }

  /**
   * Creates a new cache using the requested eviction strategy.
   *
   * @param strategy - `"lru"` (Least Recently Used), `"lfu"` (Least Frequently Used),
   *                   or `"ttl"` (Time-To-Live)
   * @param options  - Optional configuration; see {@link CacheFactoryOptions}
   * @returns An {@link ICache} instance — the concrete type is intentionally hidden
   * @throws {CacheError} with code INVALID_CAPACITY if `capacity` is <= 0
   * @throws {CacheError} with code INVALID_TTL if `ttlOptions.defaultTtlMs` is <= 0
   * @throws {CacheError} with code UNSUPPORTED_OPERATION if an unknown strategy is given
   */
  static create<K, V>(
    strategy: CacheStrategy,
    options: CacheFactoryOptions = {}
  ): ICache<K, V> {
    const capacity = options.capacity ?? 128;

    if (capacity <= 0) {
      throw new CacheError(
        CacheErrorCode.INVALID_CAPACITY,
        `capacity must be a positive integer, got ${capacity}`
      );
    }

    switch (strategy) {
      case "lru":
        return new LRUCache<K, V>(capacity);

      case "lfu":
        return new LFUCache<K, V>(capacity);

      case "ttl": {
        const o = options.ttlOptions ?? { defaultTtlMs: 60_000 };
        if (o.defaultTtlMs <= 0) {
          throw new CacheError(
            CacheErrorCode.INVALID_TTL,
            `defaultTtlMs must be a positive integer, got ${o.defaultTtlMs}`
          );
        }
        return new TTLCache<K, V>(o.defaultTtlMs, o.cleanupIntervalMs);
      }

      default:
        throw new CacheError(
          CacheErrorCode.UNSUPPORTED_OPERATION,
          `CacheFactory: unknown strategy "${strategy as string}"`
        );
    }
  }
}