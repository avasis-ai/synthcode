import {
  ResourceConstraintValidator,
  TemporalDependencyResolver,
  ContextualConstraintPropagator,
} from "../validators/index.js";

export type ValidationResult = {
  isValid: boolean;
  issues: string[];
  suggestedFixes: string[];
};

export interface HypothesisStep {
  toolName: string;
  inputs: Record<string, unknown>;
  assumptions: string[];
}

export interface Hypothesis {
  steps: HypothesisStep[];
  initialContext: Record<string, unknown>;
}

export interface ValidationReport {
  overallSuccess: boolean;
  resourceValidation: ValidationResult;
  temporalValidation: ValidationResult;
  contextualValidation: ValidationResult;
  aggregatedIssues: string[];
}

export interface GoalRefinementStrategy {
  (report: ValidationReport, hypothesis: Hypothesis): Hypothesis;
}

export class HypothesisValidationEngine {
  private resourceValidator: ResourceConstraintValidator;
  private temporalResolver: TemporalDependencyResolver;
  private contextualPropagator: ContextualConstraintPropagator;

  constructor(
    resourceValidator: ResourceConstraintValidator,
    temporalResolver: TemporalDependencyResolver,
    contextualPropagator: ContextualConstraintPropagator,
  ) {
    this.resourceValidator = resourceValidator;
    this.temporalResolver = temporalResolver;
    this.contextualPropagator = contextualPropagator;
  }

  validateHypothesis(hypothesis: Hypothesis): ValidationReport {
    const resourceValidation = this.resourceValidator.validate(hypothesis);
    const temporalValidation = this.temporalResolver.validate(hypothesis);
    const contextualValidation = this.contextualPropagator.validate(hypothesis);

    const overallSuccess =
      resourceValidation.isValid && temporalValidation.isValid && contextualValidation.isValid;

    const aggregatedIssues = [
      ...resourceValidation.issues,
      ...temporalValidation.issues,
      ...contextualValidation.issues,
    ];

    return {
      overallSuccess,
      resourceValidation,
      temporalValidation,
      contextualValidation,
      aggregatedIssues,
    };
  }

  refineHypothesis(
    report: ValidationReport,
    originalHypothesis: Hypothesis,
    strategy: GoalRefinementStrategy,
  ): Hypothesis {
    if (!report.overallSuccess) {
      return strategy(report, originalHypothesis);
    }
    return originalHypothesis;
  }
}