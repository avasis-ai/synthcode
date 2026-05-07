type State = Record<string, any>;
type Context = Record<string, any>;
type Payload = Record<string, any>;

export interface TransitionReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, any>;
}

export class TransitionError extends Error {
  readonly report: TransitionReport;
  constructor(message: string, report: TransitionReport) {
    super(message);
    this.name = "TransitionError";
    this.report = report;
  }
}

interface Validator<T extends State, R extends State> {
  validate(currentState: T, proposedState: R, context: Context, payload: Payload): TransitionReport;
}

class BaseValidator<T extends State, R extends State> implements Validator<T, R> {
  validate(currentState: T, proposedState: R, context: Context, payload: Payload): TransitionReport {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      details: {},
    };
  }
}

class TemporalValidator<T extends State, R extends State> extends BaseValidator<T, R> {
  validate(currentState: T, proposedState: R, context: Context, payload: Payload): TransitionReport {
    const report: TransitionReport = super.validate(currentState, proposedState, context, payload);
    
    if (currentState.lastUpdated && proposedState.requiresFutureDate) {
      const lastDate = new Date(currentState.lastUpdated).getTime();
      const proposedDate = new Date(payload.targetDate).getTime();
      
      if (proposedDate < lastDate) {
        report.isValid = false;
        report.errors.push("Temporal constraint violated: Proposed date must be after the last updated date.");
      }
    }
    
    return report;
  }
}

class ResourceValidator<T extends State, R extends State> extends BaseValidator<T, R> {
  validate(currentState: T, proposedState: R, context: Context, payload: Payload): TransitionReport {
    const report: TransitionReport = super.validate(currentState, proposedState, context, payload);
    
    if (proposedState.requiresResourceCheck && context.userRole !== "admin") {
      report.isValid = false;
      report.errors.push("Resource constraint violated: Only administrators can initiate this transition.");
    }
    
    return report;
  }
}

class BusinessRuleValidator<T extends State, R extends State> extends BaseValidator<T, R> {
  validate(currentState: T, proposedState: R, context: Context, payload: Payload): TransitionReport {
    const report: TransitionReport = super.validate(currentState, proposedState, context, payload);
    
    if (currentState.status === "PENDING" && proposedState.status === "COMPLETED" && payload.reason === undefined) {
      report.isValid = false;
      report.errors.push("Business rule violation: Cannot transition to COMPLETED without providing a completion reason.");
    }
    
    return report;
  }
}

export class StateTransitionValidator {
  private validators: Validator<any, any>[];

  constructor() {
    this.validators = [
      new TemporalValidator<any, any>(),
      new ResourceValidator<any, any>(),
      new BusinessRuleValidator<any, any>(),
    ];
  }

  validateTransition(
    currentState: State,
    proposedState: State,
    context: Context,
    payload: Payload
  ): TransitionReport {
    let aggregatedReport: TransitionReport = {
      isValid: true,
      errors: [],
      warnings: [],
      details: {},
    };

    for (const validator of this.validators) {
      const report = validator.validate(currentState, proposedState, context, payload);
      
      if (!report.isValid) {
        aggregatedReport.isValid = false;
      }
      
      aggregatedReport.errors.push(...report.errors);
      aggregatedReport.warnings.push(...report.warnings);
      Object.assign(aggregatedReport.details, report.details);
    }

    return aggregatedReport;
  }

  /**
   * Validates the transition and throws a structured error if validation fails.
   */
  public validateTransitionAndThrow(
    currentState: State,
    proposedState: State,
    context: Context,
    payload: Payload
  ): void {
    const report = this.validateTransition(currentState, proposedState, context, payload);

    if (!report.isValid) {
      throw new TransitionError(
        "State transition failed validation. Please check the detailed report for actionable errors.",
        report
      );
    }
  }
}