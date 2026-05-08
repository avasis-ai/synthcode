import { describe, it, expect } from "vitest"
import { ServiceContractVersionManager } from "../service/service-contract-version-manager.js"

describe("ServiceContractVersionManager", () => {
    it("should correctly identify compatibility issues when a required field is missing", () => {
        const manager = new ServiceContractVersionManager()
        const currentContract: ServiceContract = {
            version: "v2",
            description: "Updated service contract",
            endpoints: {
                getUser: {
                    name: "getUser",
                    expectedParameters: {
                        userId: "string",
                        includeDetails: "boolean"
                    },
                    requiredFields: ["userId", "includeDetails"],
                    deprecated: false
                }
            }
        }
        const previousContract: ServiceContract = {
            version: "v1",
            description: "Initial service contract",
            endpoints: {
                getUser: {
                    name: "getUser",
                    expectedParameters: {
                        userId: "string"
                    },
                    requiredFields: ["userId"],
                    deprecated: false
                }
            }
        }

        const issues = manager.checkCompatibility(currentContract, previousContract)
        expect(issues).toHaveLength(1)
        expect(issues[0].endpointName).toBe("getUser")
        expect(issues[0].issueType).toBe("MissingField")
    })

    it("should correctly identify compatibility issues when a parameter has changed", () => {
        const manager = new ServiceContractVersionManager()
        const currentContract: ServiceContract = {
            version: "v2",
            description: "Updated service contract",
            endpoints: {
                getPost: {
                    name: "getPost",
                    expectedParameters: {
                        postId: "string",
                        authorId: "string",
                        newFeatureFlag: "boolean"
                    },
                    requiredFields: ["postId", "authorId", "newFeatureFlag"],
                    deprecated: false
                }
            }
        }
        const previousContract: ServiceContract = {
            version: "v1",
            description: "Initial service contract",
            endpoints: {
                getPost: {
                    name: "getPost",
                    expectedParameters: {
                        postId: "string",
                        authorId: "string"
                    },
                    requiredFields: ["postId", "authorId"],
                    deprecated: false
                }
            }
        }

        const issues = manager.checkCompatibility(currentContract, previousContract)
        expect(issues).toHaveLength(1)
        expect(issues[0].endpointName).toBe("getPost")
        expect(issues[0].issueType).toBe("ChangedParameter")
    })

    it("should return an empty array if the service contract is fully compatible", () => {
        const manager = new ServiceContractVersionManager()
        const contract: ServiceContract = {
            version: "v1",
            description: "Stable contract",
            endpoints: {
                getUsers: {
                    name: "getUsers",
                    expectedParameters: {
                        userId: "string"
                    },
                    requiredFields: ["userId"],
                    deprecated: false
                }
            }
        }

        const issues = manager.checkCompatibility(contract, contract)
        expect(issues).toHaveLength(0)
    })
})