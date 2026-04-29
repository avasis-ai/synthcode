import {
  SchemaDiff,
  SchemaDiffResult,
  SchemaNode,
} from "./schema-diffing-types";

export function calculateSchemaDiff(
  schemaV1: SchemaNode,
  schemaV2: SchemaNode
): SchemaDiffResult {
  const diff: SchemaDiff = {
    properties: {},
    required: [],
    type: null,
    description: null,
    // Add other relevant top-level properties if necessary for comprehensive diffing
  };

  const diffProperties = compareObjectProperties(
    schemaV1.properties || {} as Record<string, SchemaNode>,
    schemaV2.properties || {} as Record<string, SchemaNode>
  );

  diff.properties = diffProperties;

  const diffRequired = compareRequiredArrays(
    schemaV1.required || [],
    schemaV2.required || []
  );

  diff.required = diffRequired;

  // Type comparison is usually a simple check, but we'll capture it for completeness
  if (schemaV1.type !== schemaV2.type) {
    diff.type = {
      diff: "type_changed",
      v1: schemaV1.type,
      v2: schemaV2.type,
    };
  }

  // Description comparison
  if (schemaV1.description !== schemaV2.description) {
    diff.description = {
      diff: "description_changed",
      v1: schemaV1.description,
      v2: schemaV2.description,
    };
  }

  return {
    diff: diff,
    isDifferent: Object.keys(diff).some(key => (diff[key] as any)?.diff),
  };
}

function compareObjectProperties(
  propsV1: Record<string, SchemaNode>,
  propsV2: Record<string, SchemaNode>
): Record<string, SchemaDiff> {
  const allKeys = new Set<string>([
    ...Object.keys(propsV1),
    ...Object.keys(propsV2),
  ]);

  const propertyDiffs: Record<string, SchemaDiff> = {};

  for (const key of allKeys) {
    const propV1 = propsV1[key];
    const propV2 = propsV2[key];

    if (!propV1 && propV2) {
      propertyDiffs[key] = {
        diff: "property_added",
        v2: propV2,
      };
    } else if (propV1 && !propV2) {
      propertyDiffs[key] = {
        diff: "property_removed",
        v1: propV1,
      };
    } else if (propV1 && propV2) {
      const nestedDiff = compareSchemaNodes(propV1, propV2);
      if (nestedDiff.isDifferent) {
        propertyDiffs[key] = {
          diff: "structural_change",
          nestedDiff: nestedDiff.diff,
        };
      } else {
        propertyDiffs[key] = {
          diff: "no_change",
          value: true,
        };
      }
    }
  }

  return propertyDiffs;
}

function compareRequiredArrays(
  requiredV1: string[],
  requiredV2: string[]
): {
  diff: "required_fields_changed";
  removed: string[];
  added: string[];
  changed: string[];
} {
  const setV1 = new Set(requiredV1);
  const setV2 = new Set(requiredV2);

  const removed = [...setV1].filter(key => !setV2.has(key));
  const added = [...setV2].filter(key => !setV1.has(key));

  // For simplicity, we treat any change in required list as a structural change,
  // but we can refine this to check if the *type* of the required field changed,
  // which would require looking up the full schema for that key.
  // Here, we just report the set difference.
  const changed = []; // Placeholder for more complex change detection

  return {
    diff: "required_fields_changed",
    removed,
    added,
    changed,
  };
}

function compareSchemaNodes(
  schemaV1: SchemaNode,
  schemaV2: SchemaNode
): SchemaDiffResult {
  const diff: SchemaDiff = {
    properties: {},
    required: [],
    type: null,
    description: null,
  };

  // 1. Compare Properties (Object structure)
  const propDiffs = compareObjectProperties(
    schemaV1.properties || {} as Record<string, SchemaNode>,
    schemaV2.properties || {} as Record<string, SchemaNode>
  );
  diff.properties = propDiffs;

  // 2. Compare Required Fields
  const requiredDiff = compareRequiredArrays(
    schemaV1.required || [],
    schemaV2.required || []
  );
  diff.required = requiredDiff;

  // 3. Compare Type
  if (schemaV1.type !== schemaV2.type) {
    diff.type = {
      diff: "type_changed",
      v1: schemaV1.type,
      v2: schemaV2.type,
    };
  }

  // 4. Compare Description
  if (schemaV1.description !== schemaV2.description) {
    diff.description = {
      diff: "description_changed",
      v1: schemaV1.description,
      v2: schemaV2.description,
    };
  }

  // Add recursive comparison for other potential fields (e.g., items for arrays)
  if (schemaV1.items && schemaV2.items) {
    const itemDiff = compareSchemaNodes(schemaV1.items, schemaV2.items);
    if (itemDiff.isDifferent) {
      diff.items = {
        diff: "array_item_schema_changed",
        nestedDiff: itemDiff.diff,
      };
    }
  }

  return {
    diff: diff,
    isDifferent: Object.keys(diff).some(key => (diff[key] as any)?.diff),
  };
}