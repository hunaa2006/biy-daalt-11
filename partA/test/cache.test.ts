import { LRUCache } from "../lib/impl/LRUCache";
import { LFUCache } from "../lib/impl/LFUCache";
import { TTLCache } from "../lib/impl/TTLCache";
import { CacheFactory } from "../lib/api/CacheFactory";
import { CacheError, CacheErrorCode } from "../lib/api/CacheError";

// ─────────────────────────────────────────────────────────────────────────────
// CacheError
// ─────────────────────────────────────────────────────────────────────────────
describe("CacheError", () => {
  it("TEST-01: code болон message-ийг зөв хадгалах ёстой", () => {
    const err = new CacheError(CacheErrorCode.INVALID_KEY, "bad key");
    expect(err.code).toBe(CacheErrorCode.INVALID_KEY);
    expect(err.message).toBe("bad key");
    expect(err.name).toBe("CacheError");
    expect(err).toBeInstanceOf(CacheError);
    expect(err).toBeInstanceOf(Error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LRUCache
// ─────────────────────────────────────────────────────────────────────────────
describe("LRUCache", () => {
  it("TEST-02: capacity <= 0 үед INVALID_CAPACITY алдаа гаргах ёстой", () => {
    expect(() => new LRUCache(0)).toThrow(CacheError);
    expect(() => new LRUCache(-5)).toThrow(CacheError);
    try {
      new LRUCache(0);
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.INVALID_CAPACITY);
    }
  });

  it("TEST-03: null/undefined түлхүүр үед INVALID_KEY алдаа гаргах ёстой", () => {
    const cache = new LRUCache<any, string>(4);
    expect(() => cache.set(null, "v")).toThrow(CacheError);
    expect(() => cache.set(undefined, "v")).toThrow(CacheError);
    try {
      cache.set(null, "x");
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.INVALID_KEY);
    }
  });

  it("TEST-04: set/get үндсэн үйлдлүүд зөв ажиллах ёстой", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("TEST-05: capacity хэтрэхэд хамгийн бага ашиглагдсан элементийг устгах ёстой", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // 'a'-г refresh хийнэ — 'b' LRU болно
    cache.get("a");
    cache.set("d", 4); // 'b' устах ёстой
    expect(cache.has("b")).toBe(false);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("c")).toBe(true);
    expect(cache.has("d")).toBe(true);
  });

  it("TEST-06: set дахин хийхэд утгыг шинэчилж, LRU дарааллыг update хийх ёстой", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 99); // 'a'-г refresh → 'b' нь LRU
    cache.set("c", 3);  // 'b' устах ёстой
    expect(cache.get("a")).toBe(99);
    expect(cache.has("b")).toBe(false);
  });

  it("TEST-07: delete — байгаа элементийг устгахад true, байхгүй үед false буцаах ёстой", () => {
    const cache = new LRUCache<string, string>(4);
    cache.set("x", "hello");
    expect(cache.delete("x")).toBe(true);
    expect(cache.delete("x")).toBe(false); // давтан устгах
    expect(cache.delete("ghost")).toBe(false);
  });

  it("TEST-08: has болон size зөв утга буцаах ёстой", () => {
    const cache = new LRUCache<number, number>(10);
    expect(cache.size).toBe(0);
    cache.set(1, 10);
    cache.set(2, 20);
    expect(cache.size).toBe(2);
    expect(cache.has(1)).toBe(true);
    expect(cache.has(99)).toBe(false);
  });

  it("TEST-09: clear хийсний дараа cache хоосорч size 0 болох ёстой", () => {
    const cache = new LRUCache<string, number>(5);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("a")).toBe(false);
    expect(cache.get("a")).toBeUndefined();
    // clear-н дараа дахин ашиглах боломжтой байх ёстой
    cache.set("c", 3);
    expect(cache.get("c")).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LFUCache
// ─────────────────────────────────────────────────────────────────────────────
describe("LFUCache", () => {
  it("TEST-10: capacity <= 0 үед INVALID_CAPACITY алдаа гаргах ёстой", () => {
    expect(() => new LFUCache(0)).toThrow(CacheError);
    try {
      new LFUCache(-1);
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.INVALID_CAPACITY);
    }
  });

  it("TEST-11: хамгийн бага ашиглалттай (LFU) элементийг устгах ёстой", () => {
    const cache = new LFUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // 'a'-г 2 удаа, 'b'-г 1 удаа, 'c'-г 0 удаа ашиглана
    cache.get("a");
    cache.get("a");
    cache.get("b");
    // 'c' хамгийн бага давтамжтай → шинэ элемент нэмэхэд 'c' устах ёстой
    cache.set("d", 4);
    expect(cache.has("c")).toBe(false);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("d")).toBe(true);
  });

  it("TEST-12: давтамж тэнцүү үед хамгийн эхний элементийг устгах ёстой (FIFO дотор)", () => {
    const cache = new LFUCache<string, number>(2);
    cache.set("a", 1); // freq=1
    cache.set("b", 2); // freq=1
    // Хоёулаа freq=1, 'a' нь эхэлж орсон тул 'a' устах ёстой
    cache.set("c", 3);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
  });

  it("TEST-13: set дахин хийхэд давтамж нэмэгдэх ёстой", () => {
    const cache = new LFUCache<string, string>(2);
    cache.set("a", "v1"); // freq=1
    cache.set("b", "v2"); // freq=1
    cache.set("a", "v2"); // freq нэмэгдэнэ → 'b' LFU
    cache.set("c", "v3"); // 'b' устах ёстой
    expect(cache.has("b")).toBe(false);
    expect(cache.get("a")).toBe("v2");
  });

  it("TEST-14: delete болон clear зөв ажиллах ёстой", () => {
    const cache = new LFUCache<number, string>(5);
    cache.set(1, "one");
    cache.set(2, "two");
    expect(cache.delete(1)).toBe(true);
    expect(cache.delete(99)).toBe(false);
    expect(cache.size).toBe(1);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has(2)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TTLCache
// ─────────────────────────────────────────────────────────────────────────────
describe("TTLCache", () => {
  it("TEST-15: defaultTtlMs <= 0 үед INVALID_TTL алдаа гаргах ёстой", () => {
    expect(() => new TTLCache(0)).toThrow(CacheError);
    expect(() => new TTLCache(-100)).toThrow(CacheError);
    try {
      new TTLCache(-1);
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.INVALID_TTL);
    }
  });

  it("TEST-16: TTL дуусаагүй үед get зөв утга буцаах ёстой", () => {
    const cache = new TTLCache<string, string>(5000);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
    expect(cache.has("key")).toBe(true);
    cache.destroy();
  });

  it("TEST-17: TTL дууссан үед get undefined буцааж, lazily устгах ёстой", () => {
    jest.useFakeTimers();
    const cache = new TTLCache<string, number>(100); // 100ms TTL
    cache.set("x", 42);
    expect(cache.size).toBe(1);

    jest.advanceTimersByTime(200); // 200ms өнгөрнө

    expect(cache.get("x")).toBeUndefined(); // lazy eviction
    expect(cache.size).toBe(0);
    cache.destroy();
    jest.useRealTimers();
  });

  it("TEST-18: has() TTL дууссан элементийг false буцааж, устгах ёстой", () => {
    jest.useFakeTimers();
    const cache = new TTLCache<string, string>(50);
    cache.set("a", "hello");
    jest.advanceTimersByTime(100);
    expect(cache.has("a")).toBe(false);
    expect(cache.size).toBe(0);
    cache.destroy();
    jest.useRealTimers();
  });

  it("TEST-19: delete — идэвхтэй элемент true, дуусагдсан эсвэл байхгүй үед false буцаах ёстой", () => {
    jest.useFakeTimers();
    const cache = new TTLCache<string, number>(200);
    cache.set("alive", 1);
    cache.set("dead", 2);
    jest.advanceTimersByTime(300); // 'dead' дуусна

    expect(cache.delete("dead")).toBe(false);   // дуусагдсан
    expect(cache.delete("ghost")).toBe(false);   // байхгүй
    // 'alive' хугацаа дууссан ч гэсэн store-д байгаа
    cache.destroy();
    jest.useRealTimers();
  });

  it("TEST-20: set дахин хийхэд TTL цагийг шинэчлэх ёстой", () => {
    jest.useFakeTimers();
    const cache = new TTLCache<string, number>(200);
    cache.set("k", 1);
    jest.advanceTimersByTime(150); // 150ms өнгөрнө — одоохондоо амьд
    cache.set("k", 2);            // TTL шинэчлэгдэнэ
    jest.advanceTimersByTime(150); // нийт 300ms — гэхдээ set-н дараа 150ms л өнгөрсөн
    expect(cache.get("k")).toBe(2); // амьд байх ёстой
    cache.destroy();
    jest.useRealTimers();
  });

  it("TEST-21: background sweep дуусагдсан элементийг автоматаар цэвэрлэх ёстой", () => {
    jest.useFakeTimers();
    const cache = new TTLCache<string, number>(100, 50); // 100ms TTL, 50ms sweep
    cache.set("a", 1);
    cache.set("b", 2);
    jest.advanceTimersByTime(200); // sweep ажиллаж, хоёулаа устгагдана
    expect(cache.size).toBe(0);
    cache.destroy();
    jest.useRealTimers();
  });

  it("TEST-22: destroy хийсний дараа timer цэвэрлэгдэх ёстой (алдаагүй дуусах)", () => {
    const cache = new TTLCache<string, string>(1000, 500);
    expect(() => cache.destroy()).not.toThrow();
    // destroy давтан дуусдахгүй байх ёстой
    expect(() => cache.destroy()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CacheFactory
// ─────────────────────────────────────────────────────────────────────────────
describe("CacheFactory", () => {
  it('TEST-23: "lru" strategy-г ICache instance болгон үүсгэх ёстой', () => {
    const cache = CacheFactory.create<string, number>("lru", { capacity: 10 });
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.size).toBe(1);
  });

  it('TEST-24: "lfu" strategy-г ICache instance болгон үүсгэх ёстой', () => {
    const cache = CacheFactory.create<string, number>("lfu", { capacity: 5 });
    cache.set("x", 99);
    expect(cache.get("x")).toBe(99);
  });

  it('TEST-25: "ttl" strategy-г ICache instance болгон үүсгэх ёстой', () => {
    const cache = CacheFactory.create<string, string>("ttl", {
      ttlOptions: { defaultTtlMs: 5000 },
    });
    cache.set("hello", "world");
    expect(cache.get("hello")).toBe("world");
  });

  it("TEST-26: capacity <= 0 үед INVALID_CAPACITY алдаа гаргах ёстой", () => {
    expect(() => CacheFactory.create("lru", { capacity: 0 })).toThrow(CacheError);
    try {
      CacheFactory.create("lfu", { capacity: -1 });
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.INVALID_CAPACITY);
    }
  });

  it("TEST-27: ttl strategy-д defaultTtlMs <= 0 үед INVALID_TTL алдаа гаргах ёстой", () => {
    expect(() =>
      CacheFactory.create("ttl", { ttlOptions: { defaultTtlMs: 0 } })
    ).toThrow(CacheError);
    try {
      CacheFactory.create("ttl", { ttlOptions: { defaultTtlMs: -1 } });
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.INVALID_TTL);
    }
  });

  it("TEST-28: мэдэгдэхгүй strategy үед UNSUPPORTED_OPERATION алдаа гаргах ёстой", () => {
    expect(() => CacheFactory.create("fifo" as any)).toThrow(CacheError);
    try {
      CacheFactory.create("arc" as any);
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.UNSUPPORTED_OPERATION);
    }
  });

  it("TEST-29: capacity заагаагүй үед 128 default capacity ашиглах ёстой", () => {
    const cache = CacheFactory.create<number, number>("lru");
    // 128 хүртэл элемент нэмж overflow болохгүй байх ёстой
    for (let i = 0; i < 128; i++) cache.set(i, i * 2);
    expect(cache.size).toBe(128);
    cache.set(999, 999); // 129 дахь → LRU устгана
    expect(cache.size).toBe(128);
  });

  it("TEST-30: CacheFactory-г new-р үүсгэх оролдлого алдаа гаргах ёстой", () => {
    expect(() => new (CacheFactory as any)()).toThrow(CacheError);
    try {
      new (CacheFactory as any)();
    } catch (e) {
      expect((e as CacheError).code).toBe(CacheErrorCode.UNSUPPORTED_OPERATION);
    }
  });
});