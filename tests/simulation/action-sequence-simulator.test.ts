import { describe, it, expect } from "vitest"
import { ActionSequenceSimulator } from "../src/simulation/action-sequence-simulator.js"

describe("ActionSequenceSimulator", () => {
  it("should initialize with a given initial state", () => {
    const initialState: SystemState = {
      resources: {
        cpu: 10,
        memory: 5,
      },
      data: {
        user: "test",
      },
      status: "IDLE",
    }
    const simulator = new ActionSequenceSimulator(initialState)
    expect(simulator.getCurrentState()).toEqual(initialState)
  })

  it("should successfully execute a sequence of actions", () => {
    const initialState: SystemState = {
      resources: {
        cpu: 10,
        memory: 10,
      },
      data: {
        user: "test",
      },
      status: "IDLE",
    }

    const action1: Action = {
      name: "Action1",
      inputs: {
        paramA: 1,
      },
      requiredResources: {
        cpu: 2,
      },
      stateTransition: (currentState, inputs) => {
        const newState: SystemState = {
          resources: {
            cpu: currentState.resources.cpu - 2,
            memory: currentState.resources.memory,
          },
          data: {
            ...currentState.data,
            paramA_processed: inputs.paramA * 2,
          },
          status: "BUSY",
        }
        const consumedResources = {
          cpu: 2,
          memory: 0,
        }
        return {
          newState,
          consumedResources,
          success: true,
        }
      },
    }

    const action2: Action = {
      name: "Action2",
      inputs: {
        paramB: "data",
      },
      requiredResources: {
        memory: 3,
      },
      stateTransition: (currentState, inputs) => {
        const newState: SystemState = {
          resources: {
            cpu: currentState.resources.cpu,
            memory: currentState.resources.memory - 3,
          },
          data: {
            ...currentState.data,
            paramB_processed: inputs.paramB,
          },
          status: "IDLE",
        }
        const consumedResources = {
          cpu: 0,
          memory: 3,
        }
        return {
          newState,
          consumedResources,
          success: true,
        }
      },
    }

    const simulator = new ActionSequenceSimulator(initialState)
    simulator.executeAction(action1)
    simulator.executeAction(action2)

    expect(simulator.getCurrentState().resources.cpu).toBe(8)
    expect(simulator.getCurrentState().data.paramA_processed).toBe(2)
    expect(simulator.getCurrentState().data.paramB_processed).toBe("data")
  })

  it("should fail execution if required resources are insufficient", () => {
    const initialState: SystemState = {
      resources: {
        cpu: 1,
        memory: 10,
      },
      data: {
        user: "test",
      },
      status: "IDLE",
    }

    const insufficientAction: Action = {
      name: "InsufficientAction",
      inputs: {
        param: 1,
      },
      requiredResources: {
        cpu: 5,
      },
      stateTransition: (currentState, inputs) => {
        // This transition should not be reached if resources are insufficient
        return {
          newState: {
            resources: {
              cpu: currentState.resources.cpu - 5,
              memory: currentState.resources.memory,
            },
            data: currentState.data,
            status: "BUSY",
          },
          consumedResources: {
            cpu: 5,
            memory: 0,
          },
          success: true,
        }
      },
    }

    const simulator = new ActionSequenceSimulator(initialState)
    const result = simulator.executeAction(insufficientAction)

    expect(result.success).toBe(false)
    expect(simulator.getCurrentState().resources.cpu).toBe(1)
    expect(simulator.getCurrentState().status).toBe("IDLE")
  })
})