import { describe, expect, it, beforeEach } from "vitest";
import { cache } from "./cache";

describe("SimpleCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("set and get returns cached value", () => {
    cache.set("test-key", { foo: "bar" }, 10_000);
    expect(cache.get("test-key")).toEqual({ foo: "bar" });
  });

  it("get returns null for missing key", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("delete removes a key", () => {
    cache.set("key1", "value1");
    cache.delete("key1");
    expect(cache.get("key1")).toBeNull();
  });

  it("clear removes all keys", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.clear();
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeNull();
    expect(cache.get("c")).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });

  it("expired entries return null", async () => {
    cache.set("short-lived", "data", 1); // 1ms TTL
    await new Promise((r) => setTimeout(r, 10));
    expect(cache.get("short-lived")).toBeNull();
  });

  it("cleanup removes expired entries", async () => {
    cache.set("expires", "data", 1);
    cache.set("stays", "data", 60_000);
    await new Promise((r) => setTimeout(r, 10));
    cache.cleanup();
    expect(cache.get("expires")).toBeNull();
    expect(cache.get("stays")).toBe("data");
  });

  it("LRU eviction removes oldest entry when full", () => {
    const smallCache = cache;
    const maxSize = 200;
    for (let i = 0; i < maxSize + 5; i++) {
      smallCache.set(`key-${i}`, `value-${i}`);
    }
    expect(smallCache.getStats().size).toBeLessThanOrEqual(maxSize);
  });

  it("getStats returns correct size", () => {
    cache.set("x", 1);
    cache.set("y", 2);
    expect(cache.getStats().size).toBe(2);
  });
});

describe("cache invalidation patterns", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("metricTrends:all key can be set and deleted", () => {
    cache.set("metricTrends:all", { test: "data" });
    expect(cache.get("metricTrends:all")).toEqual({ test: "data" });
    cache.delete("metricTrends:all");
    expect(cache.get("metricTrends:all")).toBeNull();
  });

  it("metric:key pattern works", () => {
    cache.set("metric:real_gdp_growth", { value: "2.0" });
    expect(cache.get("metric:real_gdp_growth")).toEqual({ value: "2.0" });
    cache.delete("metric:real_gdp_growth");
    expect(cache.get("metric:real_gdp_growth")).toBeNull();
  });

  it("metricHistory pattern with different limits", () => {
    cache.set("metricHistory:gdp:50", []);
    cache.set("metricHistory:gdp:100", []);
    cache.set("metricHistory:gdp:500", []);
    cache.delete("metricHistory:gdp:50");
    expect(cache.get("metricHistory:gdp:50")).toBeNull();
    expect(cache.get("metricHistory:gdp:100")).toEqual([]);
  });

  it("deleteByPrefix removes all matching keys", () => {
    cache.set("metricHistory:gdp:50", [1]);
    cache.set("metricHistory:gdp:100", [2]);
    cache.set("metricHistory:gdp:500", [3]);
    cache.set("metricHistory:cpi:50", [4]);
    cache.set("metrics:list:all", "keep");
    cache.deleteByPrefix("metricHistory:gdp:");
    expect(cache.get("metricHistory:gdp:50")).toBeNull();
    expect(cache.get("metricHistory:gdp:100")).toBeNull();
    expect(cache.get("metricHistory:gdp:500")).toBeNull();
    expect(cache.get("metricHistory:cpi:50")).toEqual([4]);
    expect(cache.get("metrics:list:all")).toBe("keep");
  });

  it("clear() wipes all metric caches at once", () => {
    cache.set("metric:a", "x");
    cache.set("metricHistory:a:50", []);
    cache.set("metricTrends:all", {});
    cache.clear();
    expect(cache.get("metric:a")).toBeNull();
    expect(cache.get("metricHistory:a:50")).toBeNull();
    expect(cache.get("metricTrends:all")).toBeNull();
  });
});
