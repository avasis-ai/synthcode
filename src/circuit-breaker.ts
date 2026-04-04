// src/circuit-breaker.ts
// TypeScript implementation of a circuit breaker pattern
// for SynthCode.

// Import necessary libraries
import { z } from 'zod';

// Define the circuit breaker class
class CircuitBreaker {
  // Configuration options
  private readonly maxFailures: number;
  private readonly resetTimeout: number;
  private readonly name: string;

  // Internal state
  private failureCount: number;
  private isOpen: boolean;
  private lastFailureTime: number | null;

  constructor(name: string, maxFailures: number, resetTimeout: number) {
    this.name = name;
    this.maxFailures = maxFailures;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.isOpen = false;
    this.lastFailureTime = null;
  }

  // Check if the circuit is open
  isOpen(): boolean {
    return this.isOpen;
  }

  // Record a failure
  recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.maxFailures) {
      this.isOpen = true;
      this.lastFailureTime = Date.now();
    }
  }

  // Reset the circuit
  reset(): void {
    this.failureCount = 0;
    this.isOpen = false;
    this.lastFailureTime = null;
  }

  // Get the number of consecutive failures
  getFailureCount(): number {
    return this.failureCount;
  }

  // Get the time since the last failure
  getTimeSinceLastFailure(): number | null {
    if (this.lastFailureTime === null) {
      return null;
    }
    return Date.now() - this.lastFailureTime;
  }
}

// Export the CircuitBreaker class
export default CircuitBreaker;

// Define a Zod schema for the circuit breaker configuration
const circuitBreakerConfigSchema = z.object({
  name: z.string(),
  maxFailures: z.number(),
  resetTimeout: z.number(),
});

// Export the Zod schema
export { circuitBreakerConfigSchema };

// Define a function to create a circuit breaker instance
export function createCircuitBreaker(name: string, maxFailures: number, resetTimeout: number): CircuitBreaker {
  return new CircuitBreaker(name, maxFailures, resetTimeout);
}

// Define a function to check if a circuit breaker is open
export function isCircuitBreakerOpen(cb: CircuitBreaker): boolean {
  return cb.isOpen();
}

// Define a function to record a failure for a circuit breaker
export function recordCircuitBreakerFailure(cb: CircuitBreaker): void {
  cb.recordFailure();
}

// Define a function to reset a circuit breaker
export function resetCircuitBreaker(cb: CircuitBreaker): void {
  cb.reset();
}

// Define a function to get the number of consecutive failures for a circuit breaker
export function getCircuitBreakerFailureCount(cb: CircuitBreaker): number {
  return cb.getFailureCount();
}

// Define a function to get the time since the last failure for a circuit breaker
export function getTimeSinceLastCircuitBreakerFailure(cb: CircuitBreaker): number | null {
  return cb.getTimeSinceLastFailure();
}

// Define a function to define a tool using the circuit breaker
export function defineToolWithCircuitBreaker(
  name: string,
  maxFailures: number,
  resetTimeout: number,
  fn: (input: any) => Promise<any>,
): (input: any) => Promise<any> {
  const cb = createCircuitBreaker(name, maxFailures, resetTimeout);
  return async (input: any) => {
    if (cb.isOpen()) {
      throw new Error(`Circuit breaker ${name} is open. Not executing tool.`);
    }
    try {
      const result = await fn(input);
      cb.reset();
      return result;
    } catch (error) {
      cb.recordFailure();
      throw error;
    }
  };
}

// Define a function to define a tool using the circuit breaker with a default failure handler
export function defineToolWithCircuitBreakerAndDefaultHandler(
  name: string,
  maxFailures: number,
  resetTimeout: number,
  fn: (input: any) => Promise<any>,
  defaultHandler: (input: any) => Promise<any>,
): (input: any) => Promise<any> {
  const cb = createCircuitBreaker(name, maxFailures, resetTimeout);
  return async (input: any) => {
    if (cb.isOpen()) {
      throw new Error(`Circuit breaker ${name} is open. Not executing tool.`);
    }
    try {
      const result = await fn(input);
      cb.reset();
      return result;
    } catch (error) {
      cb.recordFailure();
      return defaultHandler(input);
    }
  };
}

// Define a function to define a tool using the circuit breaker with a custom failure handler
export function defineToolWithCircuitBreakerAndCustomHandler(
  name: string,
  maxFailures: number,
  resetTimeout: number,
  fn: (input: any) => Promise<any>,
  failureHandler: (input: any) => Promise<any>,
): (input: any) => Promise<any> {
  const cb = createCircuitBreaker(name, maxFailures, resetTimeout);
  return async (input: any) => {
    if (cb.isOpen()) {
      throw new Error(`Circuit breaker ${name} is open. Not executing tool.`);
    }
    try {
      const result = await fn(input);
      cb.reset();
      return result;
    } catch (error) {
      cb.recordFailure();
      return failureHandler(input);
    }
  };
}