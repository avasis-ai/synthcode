import { describe, it, expect, vi } from "vitest";
import { ExternalDataFusionManager } from "../src/fusion/external-data-fusion-manager";

describe("ExternalDataFusionManager", () => {
  it("should initialize correctly and handle basic fusion logic", async () => {
    const manager = new ExternalDataFusionManager();
    expect(manager).toBeDefined();

    const data1 = { id: "d1", value: "A" };
    const data2 = { id: "d2", value: "B" };

    const fusedData = await manager.fuseData([data1, data2]);
    expect(fusedData).toEqual([
      { id: "d1", value: "A", source: "data1" },
      { id: "d2", value: "B", source: "data2" },
    ]);
  });

  it("should handle empty input array gracefully", async () => {
    const manager = new ExternalDataFusionManager();
    const fusedData = await manager.fuseData([]);
    expect(fusedData).toEqual([]);
  });

  it("should correctly identify and merge overlapping data points", async () => {
    const manager = new ExternalDataFusionManager();
    const overlappingData = [
      { id: "item1", value: "Initial", source: "A" },
      { id: "item2", value: "Unique", source: "B" },
      { id: "item1", value: "Updated", source: "C" },
    ];

    const fusedData = await manager.fuseData(overlappingData);
    expect(fusedData.length).toBe(2);
    expect(fusedData).toEqual(
      expect.arrayContaining([
        { id: "item1", value: "Updated", source: "C" },
        { id: "item2", value: "Unique", source: "B" },
      ])
    );
  });
});