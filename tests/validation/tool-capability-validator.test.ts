import { describe, it, expect } from "vitest";
import { ToolCapabilityValidator } from "../src/validation/tool-capability-validator";
import { CapabilityRegistry } from "../src/context/context";
import { ProjectContext } from "../src/context/context";

describe("ToolCapabilityValidator", () => {
  it("should return valid when all tools are present in the registry", () => {
    const mockRegistry: CapabilityRegistry = {
      getCapability: (name: string) => ({ name, description: "desc" }),
      hasCapability: (name: string) => true,
    };
    const mockContext: ProjectContext = {
      projectId: "proj1",
      userRoles: ["admin"],
    };
    const validator = new ToolCapabilityValidator(mockRegistry, mockContext);
    // Assuming a method like validateToolCalls exists and accepts tool calls
    // Since the class structure is incomplete, we'll test the constructor and a hypothetical validation method.
    // For this test, we assume a method that validates a list of tool calls.
    const mockToolCalls = [{ name: "toolA", input: {} }];
    // We need to mock the actual validation method call if it exists.
    // Since it's not provided, we'll assume a simple validation check for demonstration.
    const result = (validator as any).validateToolCalls(mockToolCalls);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid and list errors when a tool is missing from the registry", () => {
    const mockRegistry: CapabilityRegistry = {
      getCapability: (name: string) => {
        if (name === "toolA") return { name, description: "desc" };
        return null;
      },
      hasCapability: (name: string) => name === "toolA",
    };
    const mockContext: ProjectContext = {
      projectId: "proj1",
      userRoles: ["user"],
    };
    const validator = new ToolCapabilityValidator(mockRegistry, mockContext);
    const mockToolCalls = [{ name: "toolB", input: {} }]; // toolB is missing
    const result = (validator as any).validateToolCalls(mockToolCalls);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool 'toolB' is not available or not configured.");
  });

  it("should return invalid if the user lacks necessary permissions for a tool", () => {
    const mockRegistry: CapabilityRegistry = {
      getCapability: (name: string) => ({ name, description: "desc" }),
      hasCapability: (name: string) => true,
    };
    const mockContext: ProjectContext = {
      projectId: "proj1",
      userRoles: ["guest"], // Guest role might not have access to certain tools
    };
    const validator = new ToolCapabilityValidator(mockRegistry, mockContext);
    const mockToolCalls = [{ name: "adminTool", input: {} }];
    const result = (validator as any).validateToolCalls(mockToolCalls);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("User role 'guest' does not have permission to use tool 'adminTool'.");
  });
});