import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationChainBuilder } from "../src/validation/structured-tool-output-validation-chain-builder-v132";

describe("StructuredToolOutputValidationChainBuilder", () => {
  it("should correctly build a chain with multiple validation steps", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    builder.addStep({
      validate: (context) => {
        if (typeof context.output.name !== "string") {
          return { isValid: false, errors: ["Name must be a string"] };
        }
        return { isValid: true, errors: [] };
      },
    });
    builder.addStep({
      validate: (context) => {
        if (typeof context.output.age === "number" && context.output.age < 0) {
          return { isValid: false, errors: ["Age cannot be negative"] };
        }
        return { isValid: true, errors: [] };
      },
    });

    const chain = builder.build();
    expect(chain).toBeInstanceOf(Array);
    expect(chain.length).toBe(2);
  });

  it("should correctly add and build with cross-field validators", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    builder.addCrossFieldValidator({
      validate: (output) => {
        if (output.email && !output.email.includes("@")) {
          return { isValid: false, errors: ["Invalid email format"] };
        }
        return { isValid: true, errors: [] };
      },
    });

    const chain = builder.build();
    expect(chain).toBeInstanceOf(Array);
    expect(chain.length).toBe(1);
  });

  it("should build an empty chain if no validators are added", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    const chain = builder.build();
    expect(chain).toEqual([]);
  });
});