import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v36";
import { Message } from "../src/validation/types";

describe("StructuredToolInputValidationPipeline", () => {
  it("should correctly validate inputs when all steps pass", async () => {
    const mockSteps: any[] = [
      {
        name: "step1",
        validate: async (context: any, inputs: any) => {
          if (!inputs.requiredField) {
            throw new Error("Missing requiredField");
          }
        },
      },
      {
        name: "step2",
        validate: async (context: any, inputs: any) => {
          if (typeof inputs.numberField !== 'number') {
            throw new Error("numberField must be a number");
          }
        },
      },
    ];
    const pipeline = new StructuredToolInputValidationPipeline(mockSteps);
    const context: { messages: Message[]; toolInputs: Record<string, unknown> } = {
      messages: [],
      toolInputs: { toolA: {} },
    };
    const inputs: Record<string, unknown> = {
      requiredField: "some value",
      numberField: 123,
    };

    await expect(async () => {
      await pipeline.validate(context, inputs);
    }).resolves.not.toThrow();
  });

  it("should throw an error if any validation step fails", async () => {
    const mockSteps: any[] = [
      {
        name: "step1",
        validate: async (context: any, inputs: any) => {
          if (!inputs.requiredField) {
            throw new Error("Missing requiredField");
          }
        },
      },
      {
        name: "step2",
        validate: async (context: any, inputs: any) => {
          // This step will fail if we pass inputs without numberField
          if (typeof inputs.numberField !== 'number') {
            throw new Error("numberField must be a number");
          }
        },
      },
    ];
    const pipeline = new StructuredToolInputValidationPipeline(mockSteps);
    const context: { messages: Message[]; toolInputs: Record<string, unknown> } = {
      messages: [],
      toolInputs: { toolA: {} },
    };
    const inputs: Record<string, unknown> = {
      requiredField: "some value",
      // numberField is missing intentionally
    };

    await expect(async () => {
      await pipeline.validate(context, inputs);
    }).rejects.toThrow("numberField must be a number");
  });

  it("should handle an empty set of validation steps gracefully", async () => {
    const mockSteps: any[] = [];
    const pipeline = new StructuredToolInputValidationPipeline(mockSteps);
    const context: { messages: Message[]; toolInputs: Record<string, unknown> } = {
      messages: [],
      toolInputs: {},
    };
    const inputs: Record<string, unknown> = {};

    await expect(async () => {
      await pipeline.validate(context, inputs);
    }).resolves.not.toThrow();
  });
});