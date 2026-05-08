import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types.js";

type Context = Message[];

export interface AdversarialVector {
  description: string;
  // Function that takes the current context and returns a modified context
  inject: (context: Context) => Context;
  // Optional function to modify specific tool inputs
  modifyToolInputs?: (context: Context) => Record<string, unknown>;
}

export class AdversarialContextInjector {
  private readonly baseContext: Context;

  constructor(baseContext: Context) {
    this.baseContext = baseContext;
  }

  private static createNullInjectionVector(description: string): AdversarialVector {
    return {
      description,
      inject: (context) => {
        const malformedContext: Context = [...context];
        // Inject a message with null/undefined content simulation
        malformedContext.push({
          role: "user",
          content: "This message simulates null content injection.",
          // In a real scenario, we might modify the content property itself to null/undefined
        } as unknown as UserMessage);
        return malformedContext;
      },
    };
  }

  private static createTypeMismatchVector(description: string): AdversarialVector {
    return {
      description,
      inject: (context) => {
        const malformedContext: Context = [...context];
        // Simulate injecting a type mismatch (e.g., expecting string, getting number)
        malformedContext.push({
          role: "user",
          content: "Attempting to pass a number where a string is expected.",
        } as unknown as UserMessage);
        return malformedContext;
      },
    };
  }

  private static createTemporalConflictVector(description: string): AdversarialVector {
    return {
      description,
      inject: (context) => {
        const malformedContext: Context = [...context];
        // Simulate a temporal conflict (e.g., referencing an event that hasn't happened yet)
        malformedContext.push({
          role: "user",
          content: "Reference to future state: The result of step 5, which hasn't been executed.",
        } as unknown as UserMessage);
        return malformedContext;
      },
    };
  }

  private static createResourceExhaustionVector(description: string): AdversarialVector {
    return {
      description,
      inject: (context) => {
        const malformedContext: Context = [...context];
        // Simulate resource exhaustion by adding excessive, meaningless context
        for (let i = 0; i < 50; i++) {
          malformedContext.push({
            role: "user",
            content: `Filler context chunk ${i}.`,
          } as unknown as UserMessage);
        }
        return malformedContext;
      },
    };
  }

  /**
   * @param vectors List of adversarial vectors to test against.
   * @returns An array of detected failure reports.
   */
  public runAdversarialTest(vectors: AdversarialVector[]): { vector: AdversarialVector; failures: string[] }[] {
    const results: { vector: AdversarialVector; failures: string[] }[] = [];

    for (const vector of vectors) {
      const modifiedContext = vector.inject(this.baseContext);
      const failures: string[] = [];

      // --- Simulation of Validation/Resolution Pipeline ---
      // In a real system, this would call the actual validation service.
      // Here, we simulate failure detection based on the vector type.

      if (vector.description.includes("null content")) {
        failures.push("Validation Failure: Detected potential null/empty content injection.");
      }
      if (vector.description.includes("type mismatch")) {
        failures.push("Schema Violation: Input type mismatch detected in context payload.");
      }
      if (vector.description.includes("temporal conflict")) {
        failures.push("Logic Error: Temporal dependency violation detected (future state reference).");
      }
      if (vector.description.includes("resource exhaustion")) {
        failures.push("Performance Warning: Context size exceeds recommended limits, potential resource exhaustion.");
      }

      results.push({
        vector: vector,
        failures: failures,
      });
    }

    return results;
  }
}

export { AdversarialContextInjector };