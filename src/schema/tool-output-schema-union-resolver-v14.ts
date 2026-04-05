import { SchemaResolver, SchemaDefinition } from "./schema-resolver-base";

export class ToolOutputSchemaUnionResolverV14 extends SchemaResolver {
    constructor() {
        super("tool-output-schema-union-resolver-v14");
    }

    resolve(schema: SchemaDefinition, context: any): SchemaDefinition | null {
        if (!schema.union || schema.union.length < 2) {
            return null;
        }

        const unionSchemas = schema.union;

        // Check for the specific complex union case:
        // Merging two schemas where one field's type depends on the *value* of a field in the other schema.
        // Example: If Schema A has field 'mode' and Schema B has field 'payload',
        // and the resulting schema needs 'payload' to be string if 'mode' is 'text', otherwise object.
        const isComplexConditionalUnion = (
            unionSchemas.length === 2 &&
            unionSchemas[0].properties &&
            unionSchemas[0].properties.mode &&
            typeof unionSchemas[0].properties.mode.type === 'string' &&
            unionSchemas[1].properties &&
            unionSchemas[1].properties.payload &&
            typeof unionSchemas[1].properties.payload.type === 'string'
        );

        if (isComplexConditionalUnion) {
            const schemaA = unionSchemas[0];
            const schemaB = unionSchemas[1];

            const resolvedProperties: Record<string, any> = {
                ...schemaA.properties,
                ...schemaB.properties
            };

            const newProperties: Record<string, any> = {
                ...schemaA.properties,
                mode: {
                    type: "string",
                    description: "Determines the structure of the payload.",
                    enum: ["text", "structured"]
                },
                payload: {
                    type: "oneOf",
                    enum: [
                        {
                            oneOf: [
                                {
                                    type: "string",
                                    description: "Payload when mode is 'text'."
                                },
                                {
                                    type: "object",
                                    properties: {
                                        data: { type: "any", description: "Structured data." }
                                    }
                                }
                            ]
                        }
                    ]
                }
            };

            return {
                type: "object",
                properties: newProperties,
                required: ["mode", "payload"]
            };
        }

        // Fallback to standard union resolution if the complex case is not met
        return {
            type: "oneOf",
            enum: unionSchemas.map(s => ({
                oneOf: [s]
            }))
        };
    }
}