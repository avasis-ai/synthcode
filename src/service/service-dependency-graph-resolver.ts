import { EventEmitter } from "node:events"

interface ServiceDescriptor {
    name: string
    url: string
    version: string
    healthCheckEndpoint: string
    requiredCapabilities: string[]
}

interface ServiceInstance {
    descriptor: ServiceDescriptor
    url: string
    isAvailable: boolean
    lastChecked: Date
}

interface ServiceStatus {
    isHealthy: boolean
    lastChecked: Date
    message: string
}

export class ServiceDependencyGraphResolver extends EventEmitter {
    private services: Map<string, ServiceInstance> = new Map()

    constructor() {
        super()
    }

    addService(descriptor: ServiceDescriptor): void {
        this.services.set(descriptor.name, {
            descriptor: descriptor,
            url: descriptor.url,
            isAvailable: false,
            lastChecked: new Date(0)
        })
    }

    private async performHealthCheck(descriptor: ServiceDescriptor): Promise<ServiceStatus> {
        const checkUrl = `${descriptor.url}/health`;
        try {
            // Simulate an HTTP request check
            // In a real scenario, this would use fetch or node:http/https
            await new Promise(resolve => setTimeout(resolve, 50)); 
            
            // Simulate success based on basic criteria
            const isHealthy = descriptor.version.includes("v") && descriptor.name !== "deprecated-service";

            return {
                isHealthy: isHealthy,
                lastChecked: new Date(),
                message: isHealthy ? `Service ${descriptor.name} is operational.` : `Service ${descriptor.name} reported failure.`
            }
        } catch (error) {
            return {
                isHealthy: false,
                lastChecked: new Date(),
                message: `Health check failed for ${descriptor.name}: ${error instanceof Error ? error.message : "Unknown error"}`
            }
        }
    }

    async checkAllServiceHealths(): Promise<Map<string, ServiceStatus>> {
        const statusMap = new Map<string, ServiceStatus>()
        const checkPromises = Array.from(this.services.values()).map(async (instance) => {
            const status = await this.performHealthCheck(instance.descriptor)
            statusMap.set(instance.descriptor.name, status)
        })
        await Promise.all(checkPromises)
        return statusMap
    }

    async resolveService(requiredCapabilities: string[]): Promise<ServiceInstance | null> {
        const allStatuses = await this.checkAllServiceHealths()

        let bestMatch: ServiceInstance | null = null
        let bestScore = -1

        for (const [name, instance] of this.services.entries()) {
            const descriptor = instance.descriptor
            const status = allStatuses.get(name)!

            if (!status.isHealthy) {
                continue
            }

            const capabilitiesMatch = requiredCapabilities.every(cap => 
                descriptor.requiredCapabilities.includes(cap)
            )

            if (capabilitiesMatch) {
                // Simple scoring: prioritize services with fewer required capabilities 
                // or services that match all required capabilities.
                const score = descriptor.requiredCapabilities.length
                
                if (score > bestScore) {
                    bestScore = score
                    bestMatch = instance
                }
            }
        }

        return bestMatch
    }
}

export { ServiceDependencyGraphResolver }