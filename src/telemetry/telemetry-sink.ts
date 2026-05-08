interface Metric {
    name: string;
    value: number;
    tags: Record<string, string>;
    timestamp: number;
}

interface Log {
    level: "info" | "warn" | "error" | "debug";
    message: string;
    context: Record<string, unknown>;
    timestamp: number;
}

export interface TelemetrySink {
    writeMetric(metric: Metric): Promise<void>;
    writeLog(log: Log): Promise<void>;
}

export interface AlertRule {
    metricName: string;
    threshold: (metric: Metric) => boolean;
    action: (metric: Metric) => Promise<void>;
}

export class TelemetrySinkManager {
    private sinks: TelemetrySink[] = [];
    private alertRules: AlertRule[] = [];
    private metricBuffer: Map<string, Metric[]> = new Map();

    registerSink(sink: TelemetrySink): void {
        this.sinks.push(sink);
    }

    registerAlertRule(rule: AlertRule): void {
        this.alertRules.push(rule);
    }

    private async processMetric(metric: Metric): Promise<void> {
        const metricKey = `${metric.name}:${metric.tags["service"] || "global"}`;
        
        if (!this.metricBuffer.has(metricKey)) {
            this.metricBuffer.set(metricKey, []);
        }
        
        const buffer = this.metricBuffer.get(metricKey)!;
        buffer.push(metric);

        await this.sinks.forEach(sink => sink.writeMetric(metric));
        
        await this.checkAlerts(metric);
    }

    private async processLog(log: Log): Promise<void> {
        await this.sinks.forEach(sink => sink.writeLog(log));
    }

    private async checkAlerts(metric: Metric): Promise<void> {
        for (const rule of this.alertRules) {
            if (rule.metricName === metric.name) {
                if (rule.threshold(metric)) {
                    await rule.action(metric);
                }
            }
        }
    }

    public async writeMetric(metric: Metric): Promise<void> {
        await this.processMetric(metric);
    }

    public async writeLog(log: Log): Promise<void> {
        await this.processLog(log);
    }
}

export class ConsoleTelemetrySink implements TelemetrySink {
    async writeMetric(metric: Metric): Promise<void> {
        console.log(`[METRIC] ${metric.name} = ${metric.value} (Tags: ${JSON.stringify(metric.tags)})`);
    }

    async writeLog(log: Log): Promise<void> {
        console.log(`[LOG] [${log.level.toUpperCase()}] ${log.message} (Context: ${JSON.stringify(log.context)})`);
    }
}

export class PrometheusTelemetrySink implements TelemetrySink {
    async writeMetric(metric: Metric): Promise<void> {
        // Simulate Prometheus exposition logic
        console.log(`[PROMETHEUS] Gauge: ${metric.name}{${Object.entries(metric.tags).map(([k, v]) => `${k}="${v}"`).join(',')}} ${metric.value}`);
    }

    async writeLog(log: Log): Promise<void> {
        // Prometheus typically doesn't handle structured logs directly, but we simulate the attempt
        console.log(`[PROMETHEUS_LOG] Log level ${log.level}: ${log.message}`);
    }
}