import { describe, it, expect, vi } from "vitest";
import { ContextualDataFusionCoordinator } from "../src/fusion/contextual-data-fusion-coordinator";

describe("ContextualDataFusionCoordinator", () => {
  it("should initialize correctly and manage sources", async () => {
    const coordinator = new ContextualDataFusionCoordinator();
    expect(coordinator).toBeInstanceOf(ContextualDataFusionCoordinator);
    expect(coordinator.getSources()).toEqual([]);
  });

  it("should add and retrieve sources correctly", async () => {
    const coordinator = new ContextualDataFusionCoordinator();
    const source1 = {
      sourceId: "source1",
      requiredCriteria: {
        keyA: "valueA",
      },
    };
    const source2 = {
      sourceId: "source2",
      requiredCriteria: {
        keyB: "valueB",
      },
    };

    await coordinator.addSource(source1);
    await coordinator.addSource(source2);

    const sources = coordinator.getSources();
    expect(sources).toHaveLength(2);
    expect(sources).toContainEqual(source1);
    expect(sources).toContainEqual(source2);
  });

  it("should validate data against all registered sources and return a combined result", async () => {
    const coordinator = new ContextualDataFusionCoordinator();
    const source1 = {
      sourceId: "source1",
      requiredCriteria: {
        user: "admin",
      },
    };
    const source2 = {
      sourceId: "source2",
      requiredCriteria: {
        department: "IT",
      },
      validator: (data) => data.department === "IT" && data.role === "engineer",
    };

    await coordinator.addSource(source1);
    await coordinator.addSource(source2);

    const inputData = {
      user: "admin",
      department: "IT",
      role: "engineer",
      timestamp: Date.now(),
    };

    const result = await coordinator.coordinateFusion(inputData);

    expect(result.isSuccessful).toBe(true);
    expect(result.fusedData).toEqual(expect.objectContaining({
      source1: expect.any(Object),
      source2: expect.any(Object),
    }));
  });
});