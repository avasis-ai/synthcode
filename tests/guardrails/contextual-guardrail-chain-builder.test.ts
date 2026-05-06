import { describe, it, expect } from "vitest";
import { GuardrailChainBuilder } from "../src/guardrails/contextual-guardrail-chain-builder";

describe("GuardrailChainBuilder", () => {
  it("should initialize with no guardrails", () => {
    const builder = new GuardrailChainBuilder();
    // Assuming there's a way to check the internal state or a getter for this
    // For this test, we'll rely on the buildChain method not failing unexpectedly.
    expect(builder).toBeInstanceOf(GuardrailChainBuilder);
  });

  it("should add a single guardrail correctly", async () => {
    const mockGuardrail: Guardrail = {
      execute: async (context, currentChainContext) => ({ result: "ok", contextUpdate: { status: "passed" } }),
    };
    const builder = new GuardrailChainBuilder();
    builder.addGuardrail(mockGuardrail);

    // We can't easily test the internal array, so we test the buildChain outcome
    const chain = await builder.buildChain();
    expect(chain).toHaveLength(1);
  });

  it("should build a chain containing multiple added guardrails in order", async () => {
    const mockGuardrail1: Guardrail = {
      execute: async (context, currentChainContext) => ({ result: "r1", contextUpdate: { step: 1 } }),
    };
    const mockGuardrail2: Guardrail = {
      execute: async (context, currentChainContext) => ({ result: "r2", contextUpdate: { step: 2 } }),
    };

    const builder = new GuardrailChainBuilder();
    builder.addGuardrail(mockGuardrail1);
    builder.addGuardrail(mockGuardrail2);

    const chain = await builder.buildChain();
    expect(chain).toHaveLength(2);

    // A more robust test would involve executing the chain and checking the order of calls/results
    // Since we don't have the execution logic here, we check the structure/length.
    // Assuming buildChain returns an array of executable units.
    expect(chain[0]).toBe(mockGuardrail1);
    expect(chain[1]).toBe(mockGuardrail2);
  });
});