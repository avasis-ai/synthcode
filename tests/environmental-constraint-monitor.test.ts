import { describe, it, expect } from "vitest"
import { EnvironmentalConstraintMonitor } from "../src/environmental-constraint-monitor"

describe("EnvironmentalConstraintMonitor", () => {
    it("should initialize correctly with defined thresholds", () => {
        const thresholds = {
            "Temperature": { threshold: 30, severity: "medium", guidance: "Consider cooling." },
            "Humidity": { threshold: 80, severity: "high", guidance: "Dehumidify immediately." },
        }
        const monitor = new EnvironmentalConstraintMonitor(thresholds)

        // We can't directly test private properties, but we can test its functionality
        // by checking if it processes the thresholds without error.
        expect(monitor).toBeInstanceOf(EnvironmentalConstraintMonitor)
    })

    it("should detect a constraint when a metric exceeds a medium threshold", () => {
        const thresholds = {
            "Temperature": { threshold: 25, severity: "medium", guidance: "Monitor temperature." },
        }
        const monitor = new EnvironmentalConstraintMonitor(thresholds)

        const metric = { name: "Temperature", value: 26, unit: "C" }
        const constraints = monitor.checkMetric(metric)

        expect(constraints).toHaveLength(1)
        expect(constraints[0].name).toBe("Temperature")
        expect(constraints[0].severity).toBe("medium")
        expect(constraints[0].guidance).toBe("Monitor temperature.")
    })

    it("should detect multiple constraints and handle high severity correctly", () => {
        const thresholds = {
            "Temperature": { threshold: 20, severity: "medium", guidance: "Check cooling." },
            "Pressure": { threshold: 100, severity: "high", guidance: "System pressure critical." },
        }
        const monitor = new EnvironmentalConstraintMonitor(thresholds)

        const metrics = [
            { name: "Temperature", value: 21, unit: "C" },
            { name: "Pressure", value: 105, unit: "kPa" },
        ]
        const constraints = monitor.checkMetrics(metrics)

        expect(constraints).toHaveLength(2)
        
        // Check for the high severity constraint
        const highConstraint = constraints.find(c => c.name === "Pressure")
        expect(highConstraint).toBeDefined()
        expect(highConstraint!.severity).toBe("high")
        expect(highConstraint!.guidance).toBe("System pressure critical.")
    })
})