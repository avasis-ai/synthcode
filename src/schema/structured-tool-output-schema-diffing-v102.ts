import {
  SchemaDiffReport,
  SchemaNode,
  ChangeType,
  SchemaDiffResult,
} from "./types";

type PropertyName = string;

interface SchemaDiffingUtility {
  diffSchemas(
    schemaA: SchemaNode,
    schemaB: SchemaNode,
  ): SchemaDiffReport;
}

const SchemaDiffingUtility: SchemaDiffingUtility = {
  diffSchemas: (schemaA, schemaB) => {
    const report: SchemaDiffReport = {
      diffs: [],
      summary: {
        added: 0,
        removed: 0,
        typeMismatches: 0,
        structuralChanges: 0,
      },
    };

    const traverse = (
      path: string,
      nodeA: SchemaNode,
      nodeB: SchemaNode,
    ): void => {
      // 1. Compare basic properties (type, description, etc.)
      const basicDiff = compareBasicProperties(path, nodeA, nodeB);
      if (basicDiff) {
        report.diffs.push(basicDiff);
        if (basicDiff.changeType === ChangeType.TYPE_MISMATCH) {
          report.summary.typeMismatches++;
        }
      }

      // 2. Compare 'properties' (Object structure)
      const propertiesA = nodeA.properties || {} as Record<PropertyName, SchemaNode>;
      const propertiesB = nodeB.properties || {} as Record<PropertyName, SchemaNode>;

      const allKeys = new Set([...Object.keys(propertiesA), ...Object.keys(propertiesB)]);

      for (const key of allKeys) {
        const currentPath = `${path}.properties.${key}`;
        const propA = propertiesA[key];
        const propB = propertiesB[key];

        if (!propA && propB) {
          report.diffs.push({
            path: currentPath,
            changeType: ChangeType.ADDED,
            details: `Property '${key}' added.`,
          });
          report.summary.added++;
        } else if (propA && !propB) {
          report.diffs.push({
            path: currentPath,
            changeType: ChangeType.REMOVED,
            details: `Property '${key}' removed.`,
          });
          report.summary.removed++;
        } else if (propA && propB) {
          // Recurse for nested object properties
          traverse(currentPath, propA, propB);
        }
      }

      // 3. Compare 'required' array
      const requiredA = nodeA.required || [];
      const requiredB = nodeB.required || [];

      const setA = new Set(requiredA);
      const setB = new Set(requiredB);

      // Check for removed required fields
      requiredA.forEach((key) => {
        if (!setB.has(key)) {
          report.diffs.push({
            path: `${path}.required.${key}`,
            changeType: ChangeType.REMOVED,
            details: `Field '${key}' removed from required list.`,
          });
          report.summary.structuralChanges++;
        }
      });

      // Check for added required fields
      requiredB.forEach((key) => {
        if (!setA.has(key)) {
          report.diffs.push({
            path: `${path}.required.${key}`,
            changeType: ChangeType.ADDED,
            details: `Field '${key}' added to required list.`,
          });
          report.summary.structuralChanges++;
        }
      });

      // 4. Compare 'items' (Array structure)
      if (nodeA.items && nodeB.items) {
        const itemsPath = `${path}.items`;
        traverse(itemsPath, nodeA.items, nodeB.items);
      } else if (nodeA.items && !nodeB.items) {
        report.diffs.push({
          path: `${path}.items`,
          changeType: ChangeType.REMOVED,
          details: "Array item schema removed.",
        });
        report.summary.structuralChanges++;
      } else if (!nodeA.items && nodeB.items) {
        report.diffs.push({
          path: `${path}.items`,
          changeType: ChangeType.ADDED,
          details: "Array item schema added.",
        });
        report.summary.structuralChanges++;
      }
    };

    traverse("root", schemaA, schemaB);

    return {
      diffs: report.diffs,
      summary: report.summary,
    };
  },
};

const compareBasicProperties = (
  path: string,
  nodeA: SchemaNode,
  nodeB: SchemaNode,
): SchemaDiffResult | null => {
  const diff: SchemaDiffResult = {
    path: path,
    changeType: ChangeType.NONE,
    details: [],
  };

  let hasChange = false;

  // Type comparison
  if (nodeA.type !== nodeB.type) {
    diff.changeType = ChangeType.TYPE_MISMATCH;
    diff.details.push(
      `Type mismatch: Changed from '${nodeA.type}' to '${nodeB.type}'.`,
    );
    hasChange = true;
  }

  // Required comparison (handled separately in traversal, but good to check here too)
  if (nodeA.required?.length !== nodeB.required?.length) {
    diff.details.push(
      `Required field count mismatch: ${nodeA.required?.length} vs ${nodeB.required?.length}.`,
    );
    hasChange = true;
  }

  // Example: Comparing 'description' (simple string comparison)
  if (nodeA.description !== nodeB.description) {
    diff.details.push(
      `Description changed: From "${nodeA.description}" to "${nodeB.description}".`,
    );
    hasChange = true;
  }

  if (hasChange) {
    return {
      path: path,
      changeType: diff.changeType,
      details: diff.details,
    };
  }

  return null;
};

export { SchemaDiffingUtility };