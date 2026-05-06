import { describe, it, expect } from "vitest";
import { IdempotencyManager } from "../src/idempotency/idempotency-manager";

describe("IdempotencyManager", () => {
  it("should correctly store and retrieve a result for a given key", async () => {
    const manager = new IdempotencyManager();
    const key = "test-key-123";
    const result = "successful operation result";

    await manager.set(key, result);
    const retrievedResult = await manager.get(key);

    expect(retrievedResult).toBe(result);
  });

  it("should return null for a key that has never been set", async () => {
    const manager = new IdempotencyManager();
    const key = "non-existent-key";
    const result = await manager.get(key);

    expect(result).toBeNull();
  });

  it("should overwrite the result if the same key is set again", async () => {
    const manager = new IdempotencyManager();
    const key = "overwritable-key";
    const initialResult = "first result";
    const updatedResult = "second result";

    await manager.set(key, initialResult);
    await manager.set(key, updatedResult);
    const retrievedResult = await manager.get(key);

    expect(retrievedResult).toBe(updatedResult);
  });
});