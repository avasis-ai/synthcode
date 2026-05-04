import { describe, it, expect, vi } from "vitest";
import {
  structuredThoughtChainingWithExternalStateUpdate,
  ExternalStateUpdateAction,
  StateUpdateResult,
  StateUpdateStep,
} from "../src/thought/structured-thought-chaining-with-external-state-update";

describe("structuredThoughtChainingWithExternalStateUpdate", () => {
  it("should successfully chain thoughts and update external state when all steps succeed", async () => {
    const mockUpdateStep: StateUpdateStep = {
      executeUpdate: async (action: ExternalStateUpdateAction) => {
        if (action.targetSystem === "UserDB" && action.payload.userId === "user123") {
          return {
            success: true,
            message: "User updated successfully",
            updatedState: { userId: "user123", status: "active" },
          };
        }
        return { success: false, message: "Unknown error", updatedState: {} };
      },
    };

    const initialContext = {
      user: "user123",
      initialData: "some data",
    };

    const result = await structuredThoughtChainingWithExternalStateUpdate(
      mockUpdateStep,
      initialContext,
      {
        thought: "Thinking step 1",
        action: {
          targetSystem: "UserDB",
          payload: { userId: "user123" },
          validationSchema: { userId: "string" },
        },
      },
    );

    expect(result.finalState).toEqual({
      user: "user123",
      initialData: "some data",
      externalState: {
        status: "active",
      },
    });
    expect(result.finalThought).toContain("Thinking step 1");
  });

  it("should stop and report failure if any state update step fails", async () => {
    const mockUpdateStep: StateUpdateStep = {
      executeUpdate: async (action: ExternalStateUpdateAction) => {
        if (action.targetSystem === "UserDB" && action.payload.userId === "user123") {
          return {
            success: true,
            message: "User updated successfully",
            updatedState: { userId: "user123", status: "active" },
          };
        }
        return { success: false, message: "Permission denied", updatedState: {} };
      },
    };

    const initialContext = {
      user: "user123",
      initialData: "some data",
    };

    const failingAction = {
      targetSystem: "PaymentGateway",
      payload: { amount: 100 },
      validationSchema: { amount: "number" },
    };

    const result = await structuredThoughtChainingWithExternalStateUpdate(
      mockUpdateStep,
      initialContext,
      {
        thought: "Thinking step 1",
        action: failingAction,
      },
    );

    expect(result.finalState).toEqual({
      user: "user123",
      initialData: "some data",
      externalState: {}, // Should not update state on failure
    });
    expect(result.finalThought).toContain("Thinking step 1");
    expect(result.error).toBe("State update failed for PaymentGateway: Permission denied");
  });

  it("should handle multiple successful state updates sequentially", async () => {
    let callCount = 0;
    const mockUpdateStep: StateUpdateStep = {
      executeUpdate: async (action: ExternalStateUpdateAction) => {
        callCount++;
        if (action.targetSystem === "UserDB" && callCount === 1) {
          return {
            success: true,
            message: "User updated",
            updatedState: { status: "active" },
          };
        }
        if (action.targetSystem === "Inventory" && callCount === 2) {
          return {
            success: true,
            message: "Item reserved",
            updatedState: { reserved: true },
          };
        }
        return { success: false, message: "Unknown", updatedState: {} };
      },
    };

    const initialContext = { user: "u1" };

    const result = await structuredThoughtChainingWithExternalStateUpdate(
      mockUpdateStep,
      initialContext,
      [
        {
          thought: "Step 1: Update User",
          action: {
            targetSystem: "UserDB",
            payload: { userId: "u1" },
            validationSchema: { userId: "string" },
          },
        },
        {
          thought: "Step 2: Update Inventory",
          action: {
            targetSystem: "Inventory",
            payload: { itemId: "i1" },
            validationSchema: { itemId: "string" },
          },
        },
      ],
    );

    expect(callCount).toBe(2);
    expect(result.finalState.externalState).toEqual({
      status: "active",
      reserved: true,
    });
    expect(result.finalThought).toContain("Step 2: Update Inventory");
  });
});