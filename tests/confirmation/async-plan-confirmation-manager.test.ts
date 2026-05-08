import { describe, it, expect, vi } from "vitest"
import { AsyncPlanConfirmationManager } from "../src/confirmation/async-plan-confirmation-manager"

describe("AsyncPlanConfirmationManager", () => {
    it("should initialize with a plan and correctly set the initial status", () => {
        const plan: any = {
            id: "plan-123",
            goal: "Complete the task",
            initialStatus: "PENDING",
        }
        const manager = new AsyncPlanConfirmationManager(plan)
        expect(manager.plan).toBe(plan)
        expect(manager.plan.initialStatus).toBe("PENDING")
    })

    it("should update the plan status to CONFIRMED when all conditions are met", () => {
        const plan: any = {
            id: "plan-123",
            goal: "Complete the task",
            initialStatus: "PENDING",
        }
        const manager = new AsyncPlanConfirmationManager(plan)
        
        // Mock the internal state update mechanism if necessary, or simulate the successful confirmation call
        // Assuming a method like confirmPlan exists or the internal state is mutable/observable
        manager.confirmPlan(true) 
        
        expect(manager.plan.initialStatus).toBe("CONFIRMED")
    })

    it("should update the plan status to FAILED if any validation condition fails", () => {
        const plan: any = {
            id: "plan-123",
            goal: "Complete the task",
            initialStatus: "PENDING",
        }
        const manager = new AsyncPlanConfirmationManager(plan)

        // Simulate failure by calling a method that handles failure
        manager.failPlan(false) 
        
        expect(manager.plan.initialStatus).toBe("FAILED")
    })
})