export interface StewardshipRecord {
    dataId: string;
    currentOwnerId: string;
    transferTimestamp: Date;
    transferReason: string;
}

export class DataStewardshipManager {
    private records: Map<string, StewardshipRecord>;

    constructor() {
        this.records = new Map<string, StewardshipRecord>();
    }

    initializeStewardship(dataId: string, initialOwnerId: string): void {
        if (this.records.has(dataId)) {
            throw new Error(`Stewardship already initialized for dataId: ${dataId}`);
        }

        const initialRecord: StewardshipRecord = {
            dataId: dataId,
            currentOwnerId: initialOwnerId,
            transferTimestamp: new Date(),
            transferReason: "Initial creation and assignment of ownership.",
        };
        this.records.set(dataId, initialRecord);
    }

    transferOwnership(dataId: string, newOwnerId: string, reason: string): StewardshipRecord {
        if (!this.records.has(dataId)) {
            throw new Error(`Cannot transfer ownership. Stewardship record not found for dataId: ${dataId}`);
        }

        const currentRecord = this.records.get(dataId)!;

        if (currentRecord.currentOwnerId === newOwnerId) {
            throw new Error(`Ownership already held by ${newOwnerId} for dataId: ${dataId}`);
        }

        const updatedRecord: StewardshipRecord = {
            dataId: dataId,
            currentOwnerId: newOwnerId,
            transferTimestamp: new Date(),
            transferReason: reason,
        };

        this.records.set(dataId, updatedRecord);
        return updatedRecord;
    }

    validateOwnership(dataId: string, expectedOwnerId: string): StewardshipRecord {
        const record = this.records.get(dataId);

        if (!record) {
            throw new Error(`Stewardship record not found for dataId: ${dataId}`);
        }

        if (record.currentOwnerId !== expectedOwnerId) {
            throw new Error(`Ownership mismatch for dataId: ${dataId}. Expected owner: ${expectedOwnerId}, but current owner is: ${record.currentOwnerId}`);
        }

        return record;
    }

    getRecord(dataId: string): StewardshipRecord | undefined {
        return this.records.get(dataId);
    }
}

export { DataStewardshipManager };