import { describe, it, expect } from "vitest";
import { TemporalResourceNegotiator } from "../src/negotiation/temporal-resource-negotiator";

describe("TemporalResourceNegotiator", () => {
    it("should successfully negotiate a set of non-conflicting requirements", () => {
        const negotiator = new TemporalResourceNegotiator();
        const requirements = [
            {
                id: "R1",
                resourceType: "CPU",
                amount: 1,
                startTime: 10,
                endTime: 20,
                priorityWeight: 5,
            },
            {
                id: "R2",
                resourceType: "Memory",
                amount: 2,
                startTime: 30,
                endTime: 40,
                priorityWeight: 3,
            },
        ];
        const timeWindowEnd = 100;

        const report = negotiator.negotiate(requirements, timeWindowEnd);

        expect(report.adjustmentsMade).toHaveLength(0);
        expect(report.scheduledSchedule).toHaveLength(2);
        expect(report.scheduledSchedule[0].id).toBe("R1");
        expect(report.scheduledSchedule[0].actualStartTime).toBe(10);
        expect(report.scheduledSchedule[0].actualEndTime).toBe(20);
        expect(report.scheduledSchedule[1].id).toBe("R2");
        expect(report.scheduledSchedule[1].actualStartTime).toBe(30);
        expect(report.scheduledSchedule[1].actualEndTime).toBe(40);
    });

    it("should adjust conflicting requirements by prioritizing higher weight ones", () => {
        const negotiator = new TemporalResourceNegotiator();
        const requirements = [
            {
                id: "R_Low",
                resourceType: "CPU",
                amount: 1,
                startTime: 10,
                endTime: 20,
                priorityWeight: 2,
            },
            {
                id: "R_High",
                resourceType: "CPU",
                amount: 1,
                startTime: 15,
                endTime: 25,
                priorityWeight: 8,
            },
        ];
        const timeWindowEnd = 50;

        const report = negotiator.negotiate(requirements, timeWindowEnd);

        expect(report.adjustmentsMade).toHaveLength(1);
        expect(report.adjustmentsMade[0]).toContain("R_Low");
        expect(report.scheduledSchedule).toHaveLength(2);

        // Check if R_High was scheduled correctly
        const highPrioritySchedule = report.scheduledSchedule.find(r => r.id === "R_High");
        expect(highPrioritySchedule).toBeDefined();
        expect(highPrioritySchedule!.actualStartTime).toBe(15);
        expect(highPrioritySchedule!.actualEndTime).toBe(25);

        // Check if R_Low was rescheduled (or dropped, depending on implementation, but should be adjusted)
        const lowPrioritySchedule = report.scheduledSchedule.find(r => r.id === "R_Low");
        expect(lowPrioritySchedule).toBeDefined();
        // Assuming it shifts to the end or an available slot
        expect(lowPrioritySchedule!.actualStartTime).toBeGreaterThanOrEqual(25);
    });

    it("should handle requirements that fall outside the defined time window", () => {
        const negotiator = new TemporalResourceNegotiator();
        const requirements = [
            {
                id: "R_In",
                resourceType: "CPU",
                amount: 1,
                startTime: 10,
                endTime: 20,
                priorityWeight: 5,
            },
            {
                id: "R_TooEarly",
                resourceType: "CPU",
                amount: 1,
                startTime: -5,
                endTime: 5,
                priorityWeight: 5,
            },
            {
                id: "R_TooLate",
                resourceType: "CPU",
                amount: 1,
                startTime: 150,
                endTime: 160,
                priorityWeight: 5,
            },
        ];
        const timeWindowEnd = 100;

        const report = negotiator.negotiate(requirements, timeWindowEnd);

        expect(report.scheduledSchedule).toHaveLength(1);
        expect(report.scheduledSchedule[0].id).toBe("R_In");
        expect(report.adjustmentsMade).toHaveLength(2);
        expect(report.adjustmentsMade).toContain("R_TooEarly");
        expect(report.adjustmentsMade).toContain("R_TooLate");
    });
});