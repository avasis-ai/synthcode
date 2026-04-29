import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaDiffReport = {
  path: string;
  diffType: 'added' | 'removed' | 'type_change' | 'structural_drift' | 'value_mismatch';
  details: any;
};

type Schema = Record<string, unknown>;

export class SchemaDiffer {
  private readonly report: SchemaDiffReport[] = [];

  private addDiff(path: string, diffType: SchemaDiffReport['diffType'], details: any) {
    this.report.push({ path, diffType, details });
  }

  private isObject(item: unknown): item is Record<string, unknown> {
    return typeof item === 'object' && item !== null && !Array.isArray(item);
  }

  private isArray(item: unknown): item is unknown[] {
    return Array.isArray(item);
  }

  public diff(oldSchema: Schema, newSchema: Schema): SchemaDiffReport[] {
    this.report.length = 0;
    this.compareSchemas(oldSchema, newSchema, "");
    return this.report;
  }

  private compareSchemas(oldSchema: unknown, newSchema: unknown, path: string) {
    if (!this.isObject(oldSchema) || !this.isObject(newSchema)) {
      return;
    }

    const oldKeys = Object.keys(oldSchema);
    const newKeys = Object.keys(newSchema);
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldVal = oldSchema[key];
      const newVal = newSchema[key];

      if (oldVal === undefined && newVal === undefined) continue;

      if (oldVal === undefined) {
        this.addDiff(currentPath, 'added', { old: undefined, new: newVal });
      } else if (newVal === undefined) {
        this.addDiff(currentPath, 'removed', { old: oldVal, new: undefined });
      } else {
        if (this.isObject(oldVal) && this.isObject(newVal)) {
          this.compareSchemas(oldVal, newVal, currentPath);
        } else if (this.isArray(oldVal) && this.isArray(newVal)) {
          this.compareArrays(oldVal, newVal, currentPath);
        } else {
          this.comparePrimitives(oldVal, newVal, currentPath);
        }
      }
    }
  }

  private compareArrays(oldArray: unknown[], newArray: unknown[], path: string) {
    if (oldArray.length !== newArray.length) {
      this.addDiff(path, 'structural_drift', {
        message: 'Array length mismatch',
        oldLength: oldArray.length,
        newLength: newArray.length,
      });
    }

    const minLength = Math.min(oldArray.length, newArray.length);
    for (let i = 0; i < minLength; i++) {
      const currentPath = `${path}[${i}]`;
      this.compareSchemas(oldArray[i], newArray[i], currentPath);
    }

    if (oldArray.length > newArray.length) {
      for (let i = newArray.length; i < oldArray.length; i++) {
        this.addDiff(`${path}[${i}]`, 'removed', { old: oldArray[i], new: undefined });
      }
    } else if (newArray.length > oldArray.length) {
      for (let i = oldArray.length; i < newArray.length; i++) {
        this.addDiff(`${path}[${i}]`, 'added', { old: undefined, new: newArray[i] });
      }
    }
  }

  private comparePrimitives(oldVal: unknown, newVal: unknown, path: string) {
    const oldType = typeof oldVal;
    const newType = typeof newVal;

    if (oldType !== newType) {
      this.addDiff(path, 'type_change', {
        oldType: oldType,
        newType: newType,
        oldValue: oldVal,
        newValue: newVal,
      });
      return;
    }

    if (oldType === 'object' && oldVal !== null && newVal !== null) {
      if (Array.isArray(oldVal) || Array.isArray(newVal)) {
        this.compareArrays(oldVal as unknown[], newVal as unknown[], path);
      } else if (this.isObject(oldVal) && this.isObject(newVal)) {
        this.compareSchemas(oldVal, newVal, path);
      } else {
        this.addDiff(path, 'structural_drift', {
          message: 'Unexpected object/array structure',
          old: oldVal,
          new: newVal,
        });
      }
    } else if (oldVal !== newVal) {
      this.addDiff(path, 'value_mismatch', {
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }
}