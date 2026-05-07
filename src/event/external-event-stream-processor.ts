import { EventEmitter } from "node:events";

type Role = "user" | "assistant" | "tool";

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContextualEvent {
    source: string;
    timestamp: number;
    severity: "low" | "medium" | "high";
    description: string;
    actionable_context: Record<string, unknown>;
}

export interface ExternalEventSource {
    sourceId: string;
    connect(): Promise<void>;
    onRawEvent(callback: (rawEvent: Record<string, unknown>) => void): void;
    disconnect(): Promise<void>;
}

export interface EventMapper {
    map(rawEvent: Record<string, unknown>): ContextualEvent | null;
    shouldProcess(rawEvent: Record<string, unknown>): boolean;
}

export class ExternalEventStreamProcessor extends EventEmitter {
    private sources: Map<string, ExternalEventSource> = new Map();
    private mappers: Map<string, EventMapper> = new Map();

    constructor() {
        super();
    }

    addSource(source: ExternalEventSource, mapper: EventMapper): void {
        if (this.sources.has(source.sourceId)) {
            throw new Error(`Source ID ${source.sourceId} already registered.`);
        }
        this.sources.set(source.sourceId, source);
        this.mappers.set(source.sourceId, mapper);

        source.onRawEvent((rawEvent) => {
            const mapperInstance = this.mappers.get(source.sourceId);
            if (mapperInstance) {
                const contextEvent = mapperInstance.map(rawEvent);
                if (contextEvent) {
                    this.emit("contextualEvent", contextEvent);
                }
            }
        });
    }

    async initializeSources(): Promise<Promise<void>[]> {
        const initializationPromises: Promise<void>[] = [];
        for (const source of this.sources.values()) {
            initializationPromises.push(source.connect().catch(err => {
                console.error(`Failed to connect to source ${source.sourceId}:`, err);
            }));
        }
        return Promise.all(initializationPromises);
    }

    async shutdownSources(): Promise<void> {
        const shutdownPromises: Promise<void>[] = [];
        for (const source of this.sources.values()) {
            shutdownPromises.push(source.disconnect().catch(err => {
                console.error(`Failed to disconnect from source ${source.sourceId}:`, err);
            }));
        }
        await Promise.all(shutdownPromises);
    }

    /**
     * Processes all registered sources, applying filters and mapping raw events
     * into structured ContextualEvent payloads.
     * @returns A promise that resolves when all sources are initialized.
     */
    public async startProcessing(): Promise<void> {
        await this.initializeSources();
    }

    /**
     * Cleans up all connections and stops event processing.
     */
    public async stopProcessing(): Promise<void> {
        await this.shutdownSources();
    }
}