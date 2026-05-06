import { describe, it, expect } from "vitest"
import { PredictiveConstraintValidator } from "../src/validation/predictive-constraint-validator.js"
import {
  PlannedStep,
  ValidationContext,
  TimeWindow,
  PredictiveConstraintViolation,
  ResourceSchedule,
} from "../src/validation/types.js"

describe("PredictiveConstraintValidator", () => {
  it("should return no violations when all steps are valid", () => {
    const mockResourceSchedules = new Map<string, ResourceSchedule>()
    mockResourceSchedules.set("ResourceA", {
      schedule: [
        {
          resourceId: "ResourceA",
          start: 0,
          end: 10,
        },
      ],
    })

    const validator = new PredictiveConstraintValidator(mockResourceSchedules)

    const plannedSteps: PlannedStep[] = [
      {
        resourceId: "ResourceA",
        stepId: "Step1",
        startTime: 10,
        duration: 5,
      },
    ]
    const context: ValidationContext = {
      // Assuming context is not strictly needed for this test case
    }
    const timeWindow: TimeWindow = {
      start: 0,
      end: 100,
    }

    const result = validator.validate(plannedSteps, context, timeWindow)

    expect(result.violations).toEqual([])
  })

  it("should detect a violation when a step overlaps with an existing resource schedule", () => {
    const mockResourceSchedules = new Map<string, ResourceSchedule>()
    mockResourceSchedules.set("ResourceB", {
      schedule: [
        {
          resourceId: "ResourceB",
          start: 10,
          end: 20,
        },
      ],
    })

    const validator = new PredictiveConstraintValidator(mockResourceSchedules)

    const plannedSteps: PlannedStep[] = [
      {
        resourceId: "ResourceB",
        stepId: "StepOverlap",
        startTime: 15,
        duration: 5,
      },
    ]
    const context: ValidationContext = {
      // Assuming context is not strictly needed for this test case
    }
    const timeWindow: TimeWindow = {
      start: 0,
      end: 100,
    }

    const result = validator.validate(plannedSteps, context, timeWindow)

    expect(result.violations.length).toBe(1)
    expect(result.violations[0].violationType).toBe(
      "ResourceConflict"
    )
  })

  it("should detect a violation when a step starts outside the defined time window", () => {
    const mockResourceSchedules = new Map<string, ResourceSchedule>()
    mockResourceSchedules.set("ResourceC", {
      schedule: [],
    })

    const validator = new PredictiveConstraintValidator(mockResourceSchedules)

    const plannedSteps: PlannedStep[] = [
      {
        resourceId: "ResourceC",
        stepId: "StepTooEarly",
        startTime: -5,
        duration: 5,
      },
    ]
    const context: ValidationContext = {
      // Assuming context is not strictly needed for this test case
    }
    const timeWindow: TimeWindow = {
      start: 0,
      end: 100,
    }

    const result = validator.validate(plannedSteps, context, timeWindow)

    expect(result.violations.length).toBe(1)
    expect(result.violations[0].violationType).toBe(
      "TimeWindowViolation"
    )
  })
})