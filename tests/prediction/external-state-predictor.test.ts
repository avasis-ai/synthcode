import { describe, it, expect } from "vitest"
import { predictExternalState } from "../src/prediction/external-state-predictor.js"

describe("predictExternalState", () => {
    it("should predict a simple state change correctly", async () => {
        const currentState = {
            user: "Alice",
            cart: {
                items: [{
                    id: "A1",
                    name: "Apple",
                    quantity: 2,
                }],
                total: 10.0,
            },
        }
        const plan = {
            action: "add_item_to_cart",
            parameters: {
                itemId: "B2",
                quantity: 1,
                price: 5.0,
            },
        }

        const result = await predictExternalState(currentState, plan)

        expect(result.predictedState).toEqual({
            user: "Alice",
            cart: {
                items: [{
                    id: "A1",
                    name: "Apple",
                    quantity: 2,
                }, {
                    id: "B2",
                    name: "Banana",
                    quantity: 1,
                }],
                total: 15.0,
            },
        })
        expect(result.confidenceScore).toBeGreaterThan(0.8)
        expect(result.deltas).toHaveLength(1)
        expect(result.deltas[0].key).toBe("cart")
        expect(result.deltas[0].delta).toEqual({
            items: expect.arrayContaining([
                {
                    id: "A1",
                    name: "Apple",
                    quantity: 2,
                },
                {
                    id: "B2",
                    name: "Banana",
                    quantity: 1,
                },
            ]),
            total: 15.0,
        })
    })

    it("should predict no significant state change if the plan is irrelevant", async () => {
        const currentState = {
            user: "Bob",
            profile: {
                theme: "dark",
                notifications_enabled: true,
            },
        }
        const plan = {
            action: "view_settings",
            parameters: {
                section: "general",
            },
        }

        const result = await predictExternalState(currentState, plan)

        expect(result.predictedState).toEqual(currentState)
        expect(result.confidenceScore).toBeCloseTo(0.5, 0.1)
        expect(result.deltas).toHaveLength(0)
    })

    it("should handle complex state updates involving multiple keys", async () => {
        const currentState = {
            user: "Charlie",
            settings: {
                timezone: "UTC",
                language: "en",
            },
            notifications: {
                email: true,
                sms: false,
            },
        }
        const plan = {
            action: "update_user_preferences",
            parameters: {
                timezone: "PST",
                notifications_enabled: false,
            },
        }

        const result = await predictExternalState(currentState, plan)

        expect(result.predictedState).toEqual({
            user: "Charlie",
            settings: {
                timezone: "PST",
                language: "en",
            },
            notifications: {
                email: true,
                sms: false,
                notifications_enabled: false,
            },
        })
        expect(result.confidenceScore).toBeGreaterThan(0.9)
        expect(result.deltas).toHaveLength(2)
        expect(result.deltas.map(d => d.key)).toEqual(expect.arrayContaining(["settings", "notifications"]))
    })
})