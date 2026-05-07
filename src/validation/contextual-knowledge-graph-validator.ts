import { GraphUpdatePayload, KnowledgeGraphSchema, GraphValidationReport } from "./types";

export class GraphSchemaValidator {
    private schema: KnowledgeGraphSchema;

    constructor(schema: KnowledgeGraphSchema) {
        this.schema = schema;
    }

    private validateSchemaCompliance(payload: GraphUpdatePayload): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check Nodes
        for (const node of payload.nodes) {
            if (!this.schema.allowedNodeTypes.includes(node.type)) {
                errors.push(`Node type '${node.type}' is not allowed.`);
            }
            // Basic attribute type check (simplified)
            for (const key in node.attributes) {
                const expectedType = this.schema.nodeAttributeTypes[node.type]?.[key];
                if (expectedType && typeof node.attributes[key] !== expectedType) {
                    errors.push(`Node ${node.id}: Attribute '${key}' expected type ${expectedType}, got ${typeof node.attributes[key]}.`);
                }
            }
        }

        // Check Edges
        for (const edge of payload.edges) {
            if (!this.schema.allowedEdgeTypes.includes(edge.sourceType) || !this.schema.allowedEdgeTypes.includes(edge.targetType)) {
                errors.push(`Edge ${edge.id}: Source or target type is invalid.`);
            }
            // Check relationship constraints (e.g., cardinality)
            const relationship = this.schema.relationshipConstraints[edge.type];
            if (relationship && relationship.minCardinality > 0 && payload.edges.filter(e => e.type === edge.type).length < relationship.minCardinality) {
                errors.push(`Edge type '${edge.type}' violates minimum cardinality constraint (${relationship.minCardinality}).`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    private validateConstraints(payload: GraphUpdatePayload): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check Triples (Subject-Predicate-Object)
        for (const triple of payload.triples) {
            // Assuming the predicate must be a defined relationship type
            if (!this.schema.allowedRelationshipTypes.includes(triple.predicate)) {
                errors.push(`Triple: Predicate '${triple.predicate}' is not a defined relationship type.`);
            }
            // Check if subject/object types are valid based on the schema
            // (Skipping complex type resolution for brevity, focusing on structure)
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    private detectConflicts(payload: GraphUpdatePayload): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Conflict Detection Example: Check for duplicate primary keys (IDs)
        const nodeIds = payload.nodes.map(n => n.id);
        if (new Set(nodeIds).size !== nodeIds.length) {
            errors.push("Conflict detected: Duplicate node IDs found in the payload.");
        }

        // Conflict Detection Example: Check for conflicting edge definitions
        const edgeIds = payload.edges.map(e => `${e.sourceId}-${e.targetId}-${e.type}`);
        if (new Set(edgeIds).size !== edgeIds.length) {
            errors.push("Conflict detected: Duplicate edge definitions (Source-Target-Type) found in the payload.");
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    public validate(payload: GraphUpdatePayload): GraphValidationReport {
        const schemaCheck = this.validateSchemaCompliance(payload);
        const constraintCheck = this.validateConstraints(payload);
        const conflictCheck = this.detectConflicts(payload);

        const allErrors: string[] = [
            ...schemaCheck.errors,
            ...constraintCheck.errors,
            ...conflictCheck.errors
        ];

        return {
            isValid: schemaCheck.isValid && constraintCheck.isValid && conflictCheck.isValid,
            errors: allErrors,
            details: {
                schemaCompliance: schemaCheck,
                constraintViolation: constraintCheck,
                conflictDetection: conflictCheck
            }
        };
    }
}

// --- Type Definitions (Mocked for completeness) ---

export type NodeAttributes = Record<string, string | number | boolean>;

export interface Node {
    id: string;
    type: string;
    attributes: NodeAttributes;
}

export interface Edge {
    id: string;
    sourceId: string;
    sourceType: string;
    targetId: string;
    targetType: string;
    type: string;
}

export interface Triple {
    subject: string;
    predicate: string;
    object: string;
}

export interface GraphUpdatePayload {
    nodes: Node[];
    edges: Edge[];
    triples: Triple[];
}

export interface SchemaDetail {
    allowedNodeTypes: string[];
    allowedEdgeTypes: string[];
    allowedRelationshipTypes: string[];
    nodeAttributeTypes: Record<string, Record<string, 'string' | 'number' | 'boolean'>>;
    relationshipConstraints: Record<string, { minCardinality: number }>;
}

export interface KnowledgeGraphSchema extends SchemaDetail {}

export interface GraphValidationReport {
    isValid: boolean;
    errors: string[];
    details: {
        schemaCompliance: { isValid: boolean; errors: string[] };
        constraintViolation: { isValid: boolean; errors: string[] };
        conflictDetection: { isValid: boolean; errors: string[] };
    };
}