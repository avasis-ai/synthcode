type CheckStatus = "PASS" | "FAIL" | "SKIPPED";

export interface CheckResult {
  status: CheckStatus;
  serviceId: string;
  details: string;
  isCritical: boolean;
}

export interface OperationalCheck {
  serviceId: string;
  check: () => Promise<CheckResult>;
}

export interface ValidationResult {
  overallStatus: "READY" | "DEGRADED" | "UNAVAILABLE";
  passedChecks: CheckResult[];
  failedChecks: CheckResult[];
  isReady: boolean;
}

export class OperationalReadinessValidator {
  constructor() {}

  async validate(checks: OperationalCheck[]): Promise<ValidationResult> {
    const checkPromises = checks.map(check => check.check());

    const results = await Promise.allSettled(checkPromises);

    const passedChecks: CheckResult[] = [];
    const failedChecks: CheckResult[] = [];

    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      const result = results[i].status === "fulfilled" ? results[i].value : {
        status: "FAIL",
        serviceId: check.serviceId,
        details: `Check failed due to execution error: ${(results[i] as PromiseSettledResult<any>).reason}`,
        isCritical: true,
      };

      if (result.status === "PASS") {
        passedChecks.push(result);
      } else {
        failedChecks.push(result);
      }
    }

    const hasCriticalFailure = failedChecks.some(check => check.isCritical);
    
    let overallStatus: "READY" | "DEGRADED" | "UNAVAILABLE";
    let isReady: boolean;

    if (hasCriticalFailure) {
      overallStatus = "UNAVAILABLE";
      isReady = false;
    } else if (failedChecks.length > 0) {
      overallStatus = "DEGRADED";
      isReady = false;
    } else {
      overallStatus = "READY";
      isReady = true;
    }

    return {
      overallStatus,
      passedChecks,
      failedChecks,
      isReady,
    };
  }
}

export { OperationalReadinessValidator }