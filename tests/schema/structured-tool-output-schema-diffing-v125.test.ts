import { describe, it, expect } from "vitest";
import { SchemaDiffingService } from "../src/schema/structured-tool-output-schema-diffing-v125";

describe("SchemaDiffingService", () => {
  it("should correctly identify a field mismatch", () => {
    const service = new SchemaDiffingService();
    const schema1 = { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } };
    const schema2 = { type: "object", properties: { name: { type: "string" }, age: { type: "string" } } };
    const diffReport = service.diffSchemas(schema1, schema2);

    expect(diffReport).toHaveLength(1);
    expect(diffReport[0].diffType).toBe("TYPE_CHANGE");
    expect(diffReport[0].path).toContain("age");
  });

  it("should identify a missing field", () => {
    const service = new SchemaDiffingService();
    const schema1 = { type: "object", properties: { id: { type: "string" }, email: { type: "string" } } };
    const schema2 = { type: "object", properties: { id: { type: "string" } } };
    const diffReport = service.diffSchemas(schema1, schema2);

    expect(diffReport).toHaveLength(1);
    expect(diffReport[0].diffType).toBe("MISSING_FIELD");
    expect(diffReport[0].path).toContain("email");
  });

  it("should identify an extra field", () => {
    const service = new SchemaDiffingService();
    const schema1 = { type: "object", properties: { id: { type: "string" } } };
    const schema2 = { type: "object", properties: { id: { type: "string" }, extraField: { type: "boolean" } } };
    const diffReport = service.diffSchemas(schema1, schema2);

    expect(diffReport).toHaveLength(1);
    expect(diffReport[0].diffType).toBe("EXTRA_FIELD");
    expect(diffReport[0].path).toContain("extraField");
  });
});