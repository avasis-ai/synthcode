export type Payload = Record<string, unknown>;

export interface ConsistencyReport {
  isConsistent: boolean;
  details: ValidationResult[];
  summary: string;
}

export interface ValidationResult {
  validatorName: string;
  isValid: boolean;
  message: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  remediationSteps: string[];
}

export interface ExternalValidator<T extends Payload> {
  name: string;
  validate: (payload: T) => Promise<ValidationResult>;
}

export class ExternalStateConsistencyValidator<T extends Payload> {
  private validators: ExternalValidator<T>[];
  private context: Record<string, unknown>;

  constructor(validators: ExternalValidator<T>[], context: Record<string, unknown> = {}) {
    if (!validators || validators.length === 0) {
      throw new Error("Validator array cannot be empty.");
    }
    this.validators = validators;
    this.context = context;
  }

  public async validate(payload: T): Promise<ConsistencyReport> {
    const validationPromises = this.validators.map(validator => {
      return validator.validate(payload).then(result => ({
        name: validator.name,
        result: result
      }));
    });

    const results = await Promise.all(validationPromises);

    const details: ValidationResult[] = results.map(r => r.result);
    
    const isConsistent = details.every(d => d.severity !== 'CRITICAL' && d.severity !== 'ERROR');

    let summary = "State is consistent.";
    if (!isConsistent) {
      summary = "State inconsistency detected. Review critical and error reports.";
    }

    return {
      isConsistent: isConsistent,
      details: details,
      summary: summary
    };
  }
}