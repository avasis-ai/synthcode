import { EventEmitter } from "events"

export interface DriftConfig {
  endpoint: string
  intervalMs: number
  metrics: Record<string, { path: string; threshold: number }>
}

export interface DriftReport {
  timestamp: number
  source: string
  isDriftDetected: boolean
  details: Record<string, any>
  reportMessage: string
}

export interface DriftDetectorOptions {
  diffFunction: (current: any, baseline: any) => Record<string, any>
  remediationCallback: (report: DriftReport) => Promise<void>
}

export class ExternalStateDriftDetector extends EventEmitter {
  private config: DriftConfig
  private options: DriftDetectorOptions
  private baseline: any
  private intervalId: NodeJS.Timeout | null = null

  constructor(config: DriftConfig, options: DriftDetectorOptions) {
    super()
    this.config = config
    this.options = options
    this.baseline = null
  }

  public async initialize(): Promise<void> {
    console.log(`[DriftDetector] Initializing detector for ${this.config.endpoint}`)
    await this.fetchState()
    this.startPolling()
  }

  private async fetchState(): Promise<any> {
    try {
      // Simulate fetching state from an external endpoint
      const response = await fetch(this.config.endpoint)
      if (!response.ok) {
        throw new Error(`Failed to fetch state: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error("[DriftDetector] Error fetching state:", error)
      throw error
    }
  }

  private startPolling(): void {
    this.intervalId = setInterval(async () => {
      try {
        await this.runCheckCycle()
      } catch (e) {
        console.error("[DriftDetector] Polling cycle failed:", e)
      }
    }, this.config.intervalMs)
  }

  public async stopPolling(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log("[DriftDetector] Polling stopped.")
    }
  }

  private async runCheckCycle(): Promise<void> {
    const currentState = await this.fetchState()
    const diff = this.options.diffFunction(currentState, this.baseline)

    const report: DriftReport = {
      timestamp: Date.now(),
      source: this.config.endpoint,
      isDriftDetected: false,
      details: diff,
      reportMessage: "No significant drift detected."
    }

    let driftDetected = false
    const driftDetails: Record<string, any> = {}

    for (const [metricName, metricConfig] of Object.entries(this.config.metrics)) {
      const currentValue = diff[metricConfig.path]
      const baselineValue = this.baseline?.[metricConfig.path]

      if (currentValue === undefined || baselineValue === undefined) {
        continue
      }

      const deviation = Math.abs(currentValue - baselineValue)
      if (deviation > metricConfig.threshold) {
        driftDetected = true
        report.reportMessage = `Drift detected in metric ${metricName}. Deviation: ${deviation.toFixed(2)} (Threshold: ${metricConfig.threshold}).`
        driftDetails[metricName] = {
          deviation: deviation,
          current: currentValue,
          baseline: baselineValue
        }
      }
    }

    report.isDriftDetected = driftDetected
    report.details = driftDetails
    
    this.emit('drift', report)

    if (driftDetected) {
      console.warn(`[DriftDetector] !!! DRIFT DETECTED: ${report.reportMessage} !!!`)
      await this.options.remediationCallback(report)
    }

    // Update baseline only if no critical drift was detected, or periodically
    if (!driftDetected) {
      this.baseline = currentState
    }
  }
}

export { ExternalStateDriftDetector }