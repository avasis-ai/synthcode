import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Schema = Record<string, any>;

interface DiffResult {
  diff: Record<string, any>;
  riskScore: number;
  mitigationSteps: string[];
}

class SemanticImpactAnalyzer {
  private schemaA: Schema;
  private schemaB: Schema;
  private examples: Record<string, unknown>[];

  constructor(schemaA: Schema, schemaB: Schema, examples: Record<string, unknown>[] = []) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
    this.examples = examples;
  }

  private calculateRisk(field: string, typeA: any, typeB: any): { score: number; description: string } {
    if (typeA === undefined || typeB === undefined) {
      return { score: 0, description: "" };
    }

    if (typeA !== typeB) {
      return { score: 5, description: `Type change detected for field '${field}': ${typeA.constructor.name} -> ${typeB.constructor.name}. Requires review.` };
    }

    return { score: 0, description: "" };
  }

  private analyzeField(path: string, fieldA: any, fieldB: any): { score: number; description: string } {
    let score = 0;
    let description = "";

    if (fieldA === undefined && fieldB !== undefined) {
      return { score: 1, description: `New optional field '${path}' added. Low risk.` };
    }

    if (fieldA !== undefined && fieldB === undefined) {
      return { score: 10, description: `Field '${path}' removed. High risk. Check if this field was critical for tool calling.` };
    }

    if (typeof fieldA === 'object' && fieldA !== null && typeof fieldB === 'object' && fieldB !== null) {
      const typeDiff = this.calculateRisk(path, fieldA, fieldB);
      score += typeDiff.score;
      description += typeDiff.description;
    }

    return { score: score, description: description };
  }

  analyze(): { riskScore: number; mitigationSteps: string[] } {
    let totalRiskScore = 0;
    const mitigationSteps: string[] = [];

    const analyzeSchemaDiff = (schemaA: Schema, schemaB: Schema, currentPath: string = ""): { score: number; steps: string[] } => {
      let localScore = 0;
      const localSteps: string[] = [];

      const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)]);

      for (const key of allKeys) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        const fieldA = schemaA[key];
        const fieldB = schemaB[key];

        if (typeof fieldA === 'object' && fieldA !== null && typeof fieldB === 'object' && fieldB !== null) {
          const subAnalysis = analyzeSchemaDiff(fieldA, fieldB, path);
          localScore += subAnalysis.score;
          localSteps.push(...subAnalysis.steps);
        } else {
          const { score, description } = this.analyzeField(path, fieldA, fieldB);
          localScore += score;
          if (description) {
            localSteps.push(description);
          }
        }
      }
      return { score: localScore, steps: localSteps };
    };

    const { score: schemaScore, steps: schemaSteps } = analyzeSchemaDiff(this.schemaA, this.schemaB);
    totalRiskScore += schemaScore;

    // Incorporate example payload analysis (simplified)
    if (this.examples.length > 0) {
      // In a real scenario, we'd check if examples fail validation against schemaB
      totalRiskScore += 5; // Placeholder for example validation risk
      mitigationSteps.push("Review example payloads against the new schema structure for runtime validation failures.");
    }

    const finalMitigationSteps: string[] = [
      ...schemaSteps,
      "Thoroughly test all existing tool calls with the new schema definition.",
      "Consider adding runtime validation checks for fields marked as high risk."
    ];

    return {
      riskScore: Math.min(100, totalRiskScore),
      mitigationSteps: [...new Set(finalMitigationSteps)]
    };
  }
}

export class SchemaDiffingService {
  static diffSchemas(
    schemaA: Schema,
    schemaB: Schema,
    examples: Record<string, unknown>[] = []
  ): DiffResult {
    const analyzer = new SemanticImpactAnalyzer(schemaA, schemaB, examples);
    const { riskScore, mitigationSteps } = analyzer.analyze();

    // Placeholder for actual structural diff calculation (e.g., JSON Schema comparison)
    const structuralDiff: Record<string, any> = {
      changedFields: ["user_id", "output_format"],
      removedFields: ["legacy_field"],
      addedFields: ["new_metadata"],
    };

    return {
      diff: structuralDiff,
      riskScore: riskScore,
      mitigationSteps: mitigationSteps,
    };
  }
}