import { EventEmitter } from "node:events";

interface ServiceDefinition {
  name: string;
  endpoint: string;
  schema?: Record<string, any>;
  healthCheckEndpoint: string;
  isRateLimited: boolean;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, string>;
}

interface Validator {
  validateService(serviceName: string): ValidationResult;
}

export class ExternalServiceAvailabilityValidator implements Validator {
  private serviceRegistry: Map<string, ServiceDefinition>;

  constructor() {
    this.serviceRegistry = new Map();
  }

  registerService(definition: ServiceDefinition): void {
    this.serviceRegistry.set(definition.name, definition);
  }

  private checkConnectivity(service: ServiceDefinition): boolean {
    // Simulate connectivity check (e.g., ping or HEAD request)
    // In a real scenario, this would use fetch/http client.
    if (service.endpoint.includes("fail")) {
      return false;
    }
    return true;
  }

  private validateSchema(service: ServiceDefinition, schema: Record<string, any>): boolean {
    // Simulate schema validation logic
    if (!schema || Object.keys(schema).length === 0) {
      return true;
    }
    // Placeholder for complex schema validation logic
    return true;
  }

  private checkRateLimit(service: ServiceDefinition): boolean {
    return !service.isRateLimited;
  }

  validateService(serviceName: string): ValidationResult {
    const service = this.serviceRegistry.get(serviceName);

    if (!service) {
      return {
        isValid: false,
        message: `Service ${serviceName} is not registered.`,
      };
    }

    const checks: {
      check: (service: ServiceDefinition) => boolean;
      failureMessage: string;
    }[] = [
      {
        check: this.checkConnectivity,
        failureMessage: "Connectivity check failed.",
      },
      {
        check: (s) => this.validateSchema(s, s.schema),
        failureMessage: "Schema validation failed.",
      },
      {
        check: this.checkRateLimit,
        failureMessage: "Service is currently rate limited.",
      },
    ];

    const failedChecks: { checkName: string; message: string }[] = [];

    for (const { check, failureMessage } of checks) {
      if (!check(service)) {
        failedChecks.push({
          checkName: failureMessage.split(" ")[0],
          message: failureMessage,
        });
      }
    }

    const overallValid = failedChecks.length === 0;

    if (overallValid) {
      return {
        isValid: true,
        message: `Service ${serviceName} is fully available and operational.`,
      };
    } else {
      return {
        isValid: false,
        message: `Service ${serviceName} failed ${failedChecks.length} critical checks.`,
        details: failedChecks.reduce((acc, failure) => {
          acc[failure.checkName] = failure.message;
          return acc;
        }, {}),
      };
    }
  }
}

export { ExternalServiceAvailabilityValidator };