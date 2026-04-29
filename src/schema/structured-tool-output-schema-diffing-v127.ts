import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaDiffReport {
  diffs: {
    path: string;
    changeType: "ADDED" | "REMOVED" | "MODIFIED" | "TYPE_CHANGED";
    details: any;
  }[];
  summary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    typeChangeCount: number;
  };
}

export interface DiffChange {
  path: string;
  changeType: "ADDED" | "REMOVED" | "MODIFIED" | "TYPE_CHANGED";
  details: any;
}

export class SchemaDiffingService {
  private diffs: DiffChange[] = [];
  private summary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    typeChangeCount: number;
  } = {
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
    typeChangeCount: 0,
  };

  private constructor() {}

  public static getInstance(): SchemaDiffingService {
    if (!SchemaDiffingService.instance) {
      SchemaDiffingService.instance = new SchemaDiffingService();
    }
    return SchemaDiffingService.instance;
  }

  private static instance: SchemaDiffingService;

  private recordDiff(change: DiffChange) {
    this.diffs.push(change);
    switch (change.changeType) {
      case "ADDED":
        this.summary.addedCount++;
        break;
      case "REMOVED":
        this.summary.removedCount++;
        break;
      case "MODIFIED":
        this.summary.modifiedCount++;
        break;
      case "TYPE_CHANGED":
        this.summary.typeChangeCount++;
        break;
    }
  }

  private compareValues(
    path: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    const typeChanged = typeof oldValue !== typeof newValue || (
      typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null && Object.keys(oldValue).length !== Object.keys(newValue).length
    );

    if (typeChanged) {
      this.recordDiff({
        path,
        changeType: "TYPE_CHANGED",
        details: {
          oldType: typeof oldValue,
          newType: typeof newValue,
        },
      });
      return;
    }

    if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        this.compareArrays(path, oldValue, newValue);
      } else if (!Array.isArray(oldValue) && !Array.isArray(newValue)) {
        this.compareObjects(path, oldValue, newValue);
      }
    } else if (oldValue !== newValue) {
      this.recordDiff({
        path,
        changeType: "MODIFIED",
        details: {
          oldValue: oldValue,
          newValue: newValue,
        },
      });
    }
  }

  private compareObjects(
    path: string,
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>
  ): void {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const newPath = `${path}.${key}`;
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (oldValue === undefined && newValue !== undefined) {
        this.recordDiff({
          path: newPath,
          changeType: "ADDED",
          details: { newValue },
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        this.recordDiff({
          path: newPath,
          changeType: "REMOVED",
          details: { oldValue },
        });
      } else if (oldValue !== undefined && newValue !== undefined) {
        this.compareValues(newPath, oldValue, newValue);
      }
    }
  }

  private compareArrays(
    path: string,
    oldArr: unknown[],
    newArr: unknown[]
  ): void {
    const minLength = Math.min(oldArr.length, newArr.length);

    // Compare common elements
    for (let i = 0; i < minLength; i++) {
      const newPath = `${path}[${i}]`;
      this.compareValues(newPath, oldArr[i], newArr[i]);
    }

    // Check for length changes (addition/removal)
    if (oldArr.length < newArr.length) {
      for (let i = oldArr.length; i < newArr.length; i++) {
        const newPath = `${path}[${i}]`;
        this.recordDiff({
          path: newPath,
          changeType: "ADDED",
          details: { newValue: newArr[i] },
        });
      }
    } else if (oldArr.length > newArr.length) {
      for (let i = newArr.length; i < oldArr.length; i++) {
        const newPath = `${path}[${i}]`;
        this.recordDiff({
          path: newPath,
          changeType: "REMOVED",
          details: { oldValue: oldArr[i] },
        });
      }
    }
  }

  public diff(
    oldSchema: unknown,
    newSchema: unknown
  ): SchemaDiffReport {
    this.diffs = [];
    this.summary = {
      addedCount: 0,
      removedCount: 0,
      modifiedCount: 0,
      typeChangeCount: 0,
    };

    this.compareValues("root", oldSchema, newSchema);

    return {
      diffs: this.diffs,
      summary: this.summary,
    };
  }
}

export const createSchemaDiffingService = (): SchemaDiffingService => {
  return SchemaDiffingService.getInstance();
};