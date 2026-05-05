import { SchemaRegistry } from "../schema-registry";
import { KnowledgeGraphPayload } from "../knowledge-graph-payload";

export class ContextualKnowledgeGraphLinkValidator {
  private schemaRegistry: SchemaRegistry;

  constructor(schemaRegistry: SchemaRegistry) {
    this.schemaRegistry = schemaRegistry;
  }

  validate(payload: KnowledgeGraphPayload): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.edges || payload.edges.length === 0) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < payload.edges.length; i++) {
      const edge = payload.edges[i];
      const edgeErrors = this.validateEdge(edge, i);
      if (edgeErrors.length > 0) {
        errors.push(...edgeErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateEdge(edge: { source: string; target: string; type: string }, index: number): string[] {
    const errors: string[] = [];

    if (!edge.source) {
      errors.push(`Edge at index ${index} is missing a source node.`);
    }
    if (!edge.target) {
      errors.push(`Edge at index ${index} is missing a target node.`);
    }
    if (!edge.type) {
      errors.push(`Edge at index ${index} is missing a relationship type.`);
    }

    if (errors.length > 0) {
      return errors;
    }

    const schema = this.schemaRegistry.getSchemaForEdge(edge.type);
    if (!schema) {
      errors.push(`Edge at index ${index} uses an unknown relationship type: "${edge.type}".`);
    } else {
      const validSources = schema.allowedSources;
      if (!validSources.includes(edge.source)) {
        errors.push(`Edge at index ${index} source node "${edge.source}" is not permitted by schema type "${edge.type}".`);
      }

      const validTargets = schema.allowedTargets;
      if (!validTargets.includes(edge.target)) {
        errors.push(`Edge at index ${index} target node "${edge.target}" is not permitted by schema type "${edge.type}".`);
      }
    }

    return errors;
  }
}