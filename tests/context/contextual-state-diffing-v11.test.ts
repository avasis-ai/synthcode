import { describe, it, expect } from "vitest";
import { BaseStateDiffingService } from "../src/context/contextual-state-diffing-v11";

describe("BaseStateDiffingService", () => {
  it("should correctly calculate structural difference when state changes significantly", async () => {
    const service = new class extends BaseStateDiffingService {
      diff(oldState: any, newState: any, context?: any): Promise<any> {
        return Promise.resolve({
          structural_diff: {
            changed_field: "some_value",
            removed_field: "old_value",
          },
          semantic_score: 0.1,
          weighted_difference: {
            changed_field: 1,
          },
        });
      }
    }();
    const oldState = { a: 1, b: "old" };
    const newState = { a: 2, c: "new" };
    const context = { user_focus_area: "test" };
    const diffReport = await service.diff(oldState, newState, context);

    expect(diffReport).toHaveProperty("structural_diff");
    expect(diffReport.structural_diff).toEqual({
      changed_field: "some_value",
      removed_field: "old_value",
    });
    expect(diffReport.semantic_score).toBe(0.1);
  });

  it("should return minimal difference when state is nearly identical", async () => {
    const service = new class extends BaseStateDiffingService {
      diff(oldState: any, newState: any, context?: any): Promise<any> {
        return Promise.resolve({
          structural_diff: {},
          semantic_score: 0.95,
          weighted_difference: {},
        });
      }
    }();
    const oldState = { id: 1, data: "stable" };
    const newState = { id: 1, data: "stable" };
    const context = {};
    const diffReport = await service.diff(oldState, newState, context);

    expect(diffReport).toHaveProperty("structural_diff");
    expect(diffReport.structural_diff).toEqual({});
    expect(diffReport.semantic_score).toBe(0.95);
  });

  it("should incorporate context when calculating weighted difference", async () => {
    const service = new class extends BaseStateDiffingService {
      diff(oldState: any, newState: any, context?: any): Promise<any> {
        if (context?.user_focus_area === "critical") {
          return Promise.resolve({
            structural_diff: {
              critical_change: true,
            },
            semantic_score: 0.5,
            weighted_difference: {
              critical_change: 5,
            },
          });
        }
        return Promise.resolve({
          structural_diff: {},
          semantic_score: 1.0,
          weighted_difference: {},
        });
      }
    }();
    const oldState = { data: "low" };
    const newState = { data: "high" };
    const context = { user_focus_area: "critical" };
    const diffReport = await service.diff(oldState, newState, context);

    expect(diffReport.weighted_difference).toEqual({
      critical_change: 5,
    });
    expect(diffReport.structural_diff).toEqual({
      critical_change: true,
    });
  });
});