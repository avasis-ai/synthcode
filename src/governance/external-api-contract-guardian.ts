import { Message } from "./types.js";

interface ParameterSchema {
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
}

interface HeaderSchema {
  name: string;
  required: boolean;
  type: "string" | "number";
}

interface EndpointSpec {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  parameters: Record<string, ParameterSchema>;
  headers: HeaderSchema[];
  responseSchema: Record<string, any>;
}

export class ExternalApiContractGuardian {
  private spec: EndpointSpec;

  constructor(spec: EndpointSpec) {
    this.spec = spec;
  }

  private validateParameters(input: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = this.spec.parameters;

    for (const [paramName, schema] of Object.entries(params)) {
      if (schema.required && !(paramName in input) || input[paramName] === undefined) {
        errors.push(`Missing required parameter: ${paramName}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateHeaders(headers: Record<string, string>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const header of this.spec.headers) {
      if (header.required && !(header.name in headers)) {
        errors.push(`Missing required header: ${header.name}`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  private validateResponseSchema(response: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schema = this.spec.responseSchema;

    // Simple check: ensure all expected top-level keys exist and match basic types
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in response)) {
        errors.push(`Response missing required field: ${key}`);
        continue;
      }
      const actualValue = response[key];
      const actualType = typeof actualValue;

      if (expectedType === "string" && actualType !== "string") {
        errors.push(`Field ${key} expected type string, got ${actualType}`);
      } else if (expectedType === "number" && actualType !== "number") {
        errors.push(`Field ${key} expected type number, got ${actualType}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  public async preCallValidation(input: Record<string, unknown>, headers: Record<string, string>): Promise<{ success: boolean; message: string }> {
    const paramValidation = this.validateParameters(input);
    const headerValidation = this.validateHeaders(headers);

    if (!paramValidation.isValid) {
      return { success: false, message: `Parameter validation failed: ${paramValidation.errors.join('; ')}` };
    }

    if (!headerValidation.isValid) {
      return { success: false, message: `Header validation failed: ${headerValidation.errors.join('; ')}` };
    }

    return { success: true, message: "Pre-call validation successful." };
  }

  public async postCallValidation(response: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const schemaValidation = this.validateResponseSchema(response);

    if (!schemaValidation.isValid) {
      return { success: false, message: `Response schema validation failed: ${schemaValidation.errors.join('; ')}` };
    }

    return { success: true, message: "Post-call validation successful." };
  }
}