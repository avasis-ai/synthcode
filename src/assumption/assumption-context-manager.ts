import { EventEmitter } from "node:events";

export interface Assumption {
  id: string;
  source: string;
  confidence: number;
  expiration: Date;
  requiredSteps: string[];
  isVerified: boolean;
  verificationHistory: {
    step: string;
    result: boolean;
    timestamp: Date;
  }[];
}

export interface VerificationResult {
  assumptionId: string;
  stepName: string;
  success: boolean;
  details: string;
}

export class AssumptionContextManager extends EventEmitter {
  private assumptions: Map<string, Assumption> = new Map();

  makeAssumption(assumption: Assumption): void {
    if (this.assumptions.has(assumption.id)) {
      throw new Error(`Assumption with ID ${assumption.id} already exists.`);
    }
    this.assumptions.set(assumption.id, {
      ...assumption,
      isVerified: false,
      verificationHistory: [],
    });
    this.emit("assumptionMade", assumption);
  }

  verifyAssumption(result: VerificationResult): Assumption | null {
    const assumption = this.assumptions.get(result.assumptionId);
    if (!assumption) {
      console.warn(`Attempted to verify non-existent assumption: ${result.assumptionId}`);
      return null;
    }

    const updatedAssumption: Assumption = {
      ...assumption,
      verificationHistory: [
        ...assumption.verificationHistory,
        {
          step: result.stepName,
          result: result.success,
          timestamp: new Date(),
        },
      ],
      isVerified: this.checkVerificationStatus(assumption, result.stepName, result.success),
    };

    this.assumptions.set(result.assumptionId, updatedAssumption);
    this.emit("assumptionVerified", updatedAssumption);
    return updatedAssumption;
  }

  private checkVerificationStatus(
    assumption: Assumption,
    latestStep: string,
    latestSuccess: boolean
  ): boolean {
    if (latestSuccess) {
      // Simple model: if the latest step succeeds, we assume verification is complete.
      // In a real system, this would check if all requiredSteps are covered.
      return assumption.requiredSteps.includes(latestStep);
    }
    return false;
  }

  isAssumptionVerified(assumptionId: string): boolean {
    const assumption = this.assumptions.get(assumptionId);
    return assumption ? assumption.isVerified : false;
  }

  getUnverifiedAssumptions(): Assumption[] {
    return Array.from(this.assumptions.values()).filter(
      (a) => !a.isVerified || a.expiration < new Date()
    );
  }

  getAssumption(assumptionId: string): Assumption | undefined {
    return this.assumptions.get(assumptionId);
  }
}

export { AssumptionContextManager };