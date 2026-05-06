import { describe, it, expect } from "vitest"
import { LatestWinsStrategy } from "../src/conflict-resolver"

describe("LatestWinsStrategy", () => {
  it("should resolve conflicts by selecting the value from the latest source", () => {
    const strategy = new LatestWinsStrategy()
    const conflicts: Conflict[] = [
      {
        key: "user_name",
        conflictingValues: {
          "sourceA": "Alice",
          "sourceB": "Bob",
        },
        sources: ["sourceA", "sourceB"],
        metadata: {
          timestamp: 1678886400,
          trustScore: 0.5,
        },
      },
      {
        key: "email",
        conflictingValues: {
          "sourceC": "alice@example.com",
          "sourceD": "alice.new@example.com",
        },
        sources: ["sourceC", "sourceD"],
        metadata: {
          timestamp: 1678886500,
          trustScore: 0.8,
        },
      },
    ]
    const resolved = strategy.resolve(conflicts)
    expect(Object.keys(resolved)).toHaveLength(2)
    expect(resolved).toEqual({
      user_name: "Bob",
      email: "alice.new@example.com",
    })
  })

  it("should handle conflicts with only one source (no conflict)", () => {
    const strategy = new LatestWinsStrategy()
    const conflicts: Conflict[] = [
      {
        key: "single_value",
        conflictingValues: {
          "sourceE": "SingleValue",
        },
        sources: ["sourceE"],
        metadata: {
          timestamp: 12345,
          trustScore: 1.0,
        },
      },
    ]
    const resolved = strategy.resolve(conflicts)
    expect(Object.keys(resolved)).toHaveLength(1)
    expect(resolved).toEqual({
      single_value: "SingleValue",
    })
  })

  it("should return an empty object if no conflicts are provided", () => {
    const strategy = new LatestWinsStrategy()
    const conflicts: Conflict[] = []
    const resolved = strategy.resolve(conflicts)
    expect(resolved).toEqual({})
  })
})