import { describe, it, expect } from "vitest";
import { AblationTestCoordinator } from "../src/orchestration/ablation-test-coordinator";

describe("AblationTestCoordinator", () => {
  it("should initialize correctly and run a basic ablation test", async () => {
    const coordinator = new AblationTestCoordinator();
    const mockPlan = {
      context: "Test context",
      messages: [{ role: "user", content: "Hello" }],
    };
    const mockConfig = {
      testConfigurations: [
        { name: "ConfigA", toolsToExclude: [], promptOverrides: {} },
        { name: "ConfigB", toolsToExclude: ["tool1"], promptOverrides: {} },
      ],
      // Mock the internal simulation engine call
      simulatePlan: async (plan: any, config: any) => ({
        results: [
          { configurationName: "ConfigA", finalMessage: { role: "model", content: "Result A" }, metrics: { score: 0.9 }, executionLog: ["log a"] },
          { configurationName: "ConfigB", finalMessage: { role: "model", content: "Result B" }, metrics: { score: 0.8 }, executionLog: ["log b"] },
        ],
      }),
    };

    // @ts-ignore - Mocking the class structure for testing
    const coordinatorInstance = new AblationTestCoordinator(mockPlan, mockConfig);

    const results = await coordinatorInstance.runAblationTests();

    expect(results).toHaveLength(2);
    expect(results[0].configurationName).toBe("ConfigA");
    expect(results[1].configurationName).toBe("ConfigB");
  });

  it("should handle an empty list of test configurations gracefully", async () => {
    const coordinator = new AblationTestCoordinator();
    const mockPlan = {
      context: "Test context",
      messages: [{ role: "user", content: "Hello" }],
    };
    const mockConfig = {
      testConfigurations: [],
      simulatePlan: async (plan: any, config: any) => ({
        results: [],
      }),
    };

    // @ts-ignore - Mocking the class structure for testing
    const coordinatorInstance = new AblationTestCoordinator(mockPlan, mockConfig);

    const results = await coordinatorInstance.runAblationTests();

    expect(results).toEqual([]);
  });

  it("should correctly pass the plan and configuration to the simulation engine", async () => {
    const coordinator = new AblationTestCoordinator();
    const mockPlan = {
      context: "Test context",
      messages: [{ role: "user", content: "Hello" }],
    };
    const mockConfig = {
      testConfigurations: [{ name: "TestConfig", toolsToExclude: [], promptOverrides: {} }],
      simulatePlan: vi.fn().mockResolvedValue({
        results: [{ configurationName: "TestConfig", finalMessage: { role: "model", content: "Success" }, metrics: { score: 1.0 }, executionLog: [] }],
      }),
    };

    // @ts-ignore - Mocking the class structure for testing
    const coordinatorInstance = new AblationTestCoordinator(mockPlan, mockConfig);

    await coordinatorInstance.runAblationTests();

    // Check if simulatePlan was called with the correct arguments
    expect(mockConfig.simulatePlan).toHaveBeenCalledTimes(1);
    const callArgs = mockConfig.simulatePlan.mock.calls[0];
    
    // Check the plan argument
    expect(callArgs[0]).toEqual(mockPlan);
    
    // Check the configuration argument (should be the first test configuration)
    expect(callArgs[1].testConfigurations[0].name).toBe("TestConfig");
  });
});