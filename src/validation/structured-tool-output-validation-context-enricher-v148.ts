import { ValidationContext } from "./validation-context-v147";

export interface OperationalContext {
  cpuUtilization?: number;
  memoryUsageBytes?: number;
  timestampMs?: number;
  maxExecutionTimeMs?: number;
  isHighPriority?: boolean;
  agentOperationalFlags?: Record<string, boolean>;
}

export interface EnrichedValidationContext extends ValidationContext {
  operationalContext: OperationalContext;
}

export class StructuredToolOutputValidationContextEnricherV148 {
  enrich(
    context: ValidationContext,
    operationalContext: OperationalContext
  ): EnrichedValidationContext {
    return {
      ...context,
      operationalContext: operationalContext,
    } as EnrichedValidationContext;
  }
}