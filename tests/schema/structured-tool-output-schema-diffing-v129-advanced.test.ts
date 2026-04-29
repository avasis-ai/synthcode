import { describe, it, expect } from "vitest";
import { SchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v129-advanced";

describe("SchemaDiffer", () => {
  it("should report a difference when a field is added", () => {
    const differ = new SchemaDiffer();
    const originalSchema: any = {
      user: {
        id: "user123",
      },
    };
    const newSchema: any = {
      user: {
        id: "user123",
        newField: "value",
      },
    };
    differ.diff(originalSchema, newSchema);
    expect(differ.getReport()).toHaveLength(1);
    expect(differ.getReport()[0].diffType).toBe("added");
    expect(differ.getReport()[0].path).toContain("user.newField");
  });

  it("should report a difference when a field is removed", () => {
    const differ = new SchemaDiffer();
    const originalSchema: any = {
      user: {
        id: "user123",
        oldField: "value",
      },
    };
    const newSchema: any = {
      user: {
        id: "user123",
      },
    };
    differ.diff(originalSchema, newSchema);
    expect(differ.getReport()).toHaveLength(1);
    expect(differ.getReport()[0].diffType).toBe("removed");
    expect(differ.getReport()[0].path).toContain("user.oldField");
  });

  it("should report a type change when a field type changes", () => {
    const differ = new SchemaDiffer();
    const originalSchema: any = {
      data: {
        count: 10,
      },
    };
    const newSchema: any = {
      data: {
        count: "ten",
      },
    };
    differ.diff(originalSchema, newSchema);
    expect(differ.getReport()).toHaveLength(1);
    expect(differ.getReport()[0].diffType).toBe("type_change");
    expect(differ.getReport()[0].path).toContain("data.count");
  });
});