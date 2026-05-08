import { describe, it, expect, vi } from "vitest";
import { checkPrerequisites } from "../src/validation/runtime-environment-validator";

describe("checkPrerequisites", () => {
  it("should successfully check multiple types of prerequisites", async () => {
    const mockChecks = [
      {
        type: "os_package",
        description: "Check for 'curl' package",
        details: { package: "curl", manager: "apt" },
      },
      {
        type: "env_variable",
        description: "Check for API Key environment variable",
        details: { key: "API_KEY", required: true },
      },
      {
        type: "network_endpoint",
        description: "Check connectivity to database",
        details: { host: "localhost", port: 5432, protocol: "tcp" },
      },
    ];

    // Mock the internal functions used by checkPrerequisites
    vi.spyOn(require("node:child_process"), "exec").mockResolvedValue("Success");
    vi.spyOn(require("node:net"), "createConnection").mockImplementation(() => ({
      on: vi.fn(),
      end: vi.fn(),
    }));

    const result = await checkPrerequisites(mockChecks);

    expect(result).toEqual({
      success: true,
      details: [
        {
          type: "os_package",
          description: "Check for 'curl' package",
          details: { package: "curl", manager: "apt" },
          passed: true,
          message: "Package 'curl' found.",
        },
        {
          type: "env_variable",
          description: "Check for API Key environment variable",
          details: { key: "API_KEY", required: true },
          passed: true,
          message: "Environment variable API_KEY is set.",
        },
        {
          type: "network_endpoint",
          description: "Check connectivity to database",
          details: { host: "localhost", port: 5432, protocol: "tcp" },
          passed: true,
          message: "Successfully connected to localhost:5432.",
        },
      ],
    });
  });

  it("should fail when an environment variable is missing and required", async () => {
    const mockChecks = [
      {
        type: "env_variable",
        description: "Check for required database URL",
        details: { key: "DATABASE_URL", required: true },
      },
    ];

    // Mock process.env to simulate missing variable
    const originalEnv = process.env;
    process.env = { ...originalEnv, DATABASE_URL: undefined };

    // Mock child_process.exec to ensure it doesn't interfere
    vi.spyOn(require("node:child_process"), "exec").mockResolvedValue("Success");

    const result = await checkPrerequisites(mockChecks);

    expect(result.success).toBe(false);
    expect(result.details[0].passed).toBe(false);
    expect(result.details[0].message).toContain("DATABASE_URL is not set and is required.");

    // Restore environment variables
    process.env = originalEnv;
  });

  it("should fail when an OS package is missing", async () => {
    const mockChecks = [
      {
        type: "os_package",
        description: "Check for non-existent package",
        details: { package: "nonexistent-package-xyz", manager: "apt" },
      },
    ];

    // Mock child_process.exec to simulate package manager failure
    vi.spyOn(require("node:child_process"), "exec").mockResolvedValue("Error: Package not found");

    const result = await checkPrerequisites(mockChecks);

    expect(result.success).toBe(false);
    expect(result.details[0].passed).toBe(false);
    expect(result.details[0].message).toContain("Failed to check package 'nonexistent-package-xyz'.");
  });
});