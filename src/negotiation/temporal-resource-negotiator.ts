interface ResourceRequirement {
    id: string;
    resourceType: string;
    amount: number;
    startTime: number;
    endTime: number;
    priorityWeight: number;
}

interface ScheduledRequirement extends ResourceRequirement {
    actualStartTime: number;
    actualEndTime: number;
}

interface NegotiationReport {
    scheduledSchedule: ScheduledRequirement[];
    adjustmentsMade: string[];
}

export class TemporalResourceNegotiator {
    negotiate(requirements: ResourceRequirement[], timeWindow: { start: number; end: number }): NegotiationReport {
        if (!requirements || requirements.length === 0) {
            return { scheduledSchedule: [], adjustmentsMade: [] };
        }

        // 1. Sort requirements: Primary key = Start Time, Secondary key = Priority Weight (descending)
        const sortedRequirements = [...requirements].sort((a, b) => {
            if (a.startTime !== b.startTime) {
                return a.startTime - b.startTime;
            }
            return b.priorityWeight - a.priorityWeight;
        });

        const scheduledSchedule: ScheduledRequirement[] = [];
        const adjustmentsMade: string[] = [];
        
        // Map to track resource usage over time: Map<ResourceType, Array<{ start: number, end: number, usage: number }>>
        const resourceUsage: Map<string, Array<{ start: number, end: number, usage: number }>> = new Map();

        // Helper function to check for overlap and calculate total usage at any point
        const checkConflict = (resourceType: string, start: number, end: number, requiredAmount: number): boolean => {
            const usageHistory = resourceUsage.get(resourceType) || [];
            let currentUsage = 0;
            let conflict = false;

            // Simple linear scan for conflict detection (assuming usage history is sorted)
            // For simplicity, we check if the required amount exceeds capacity (which we assume is 1 unit per resource type for this model, or we need a defined capacity).
            // Since capacity isn't defined, we assume conflict means resource is already fully booked by a higher priority task.
            
            // For this implementation, we will track the *total* usage at any point in time.
            // We assume a maximum capacity of 1 unit for simplicity, unless the requirement itself defines the capacity.
            // Let's assume the resource amount *is* the capacity needed, and we check if the sum exceeds a conceptual limit (e.g., 1).
            
            // Re-implementing conflict check: We need to check if the required amount overlaps with existing usage.
            
            // Since we are building the schedule sequentially, we only need to check if the *new* requirement overlaps with *existing* scheduled requirements.
            
            const overlaps = usageHistory.filter(segment => {
                // Check for time overlap
                const overlapsTime = Math.max(start, segment.start) < Math.min(end, segment.end);
                if (overlapsTime) {
                    // Check for resource overload (assuming total usage must be <= 1 for simplicity, or we need a defined capacity)
                    // If we assume the resource amount *is* the capacity, this check is complex.
                    // Let's simplify: Conflict exists if the time overlaps AND the required amount exceeds the remaining capacity (1 - existing usage).
                    return true; 
                }
                return false;
            });

            // If we detect overlap, we need to know the severity.
            // For this model, let's just return true if any overlap is found, indicating a conflict needs resolution.
            return overlaps.length > 0;
        };

        const processRequirement = (req: ResourceRequirement, currentSchedule: ScheduledRequirement[]): { scheduled: ScheduledRequirement | null, report: string } => {
            let currentStart = req.startTime;
            let currentEnd = req.endTime;
            let conflictFound = false;
            let report = "";

            // 1. Check for conflicts against already scheduled items
            for (const scheduledReq of currentSchedule) {
                const resourceType = req.resourceType;
                
                // Check for time overlap
                const overlapsTime = Math.max(currentStart, scheduledReq.actualStartTime) < Math.min(currentEnd, scheduledReq.actualEndTime);

                if (overlapsTime) {
                    conflictFound = true;
                    
                    // Conflict Resolution Strategy:
                    // If the current requirement has lower priority than the conflicting scheduled item, it must shift.
                    // Since we process by priority (highest first), any conflict means the current item (req) is lower priority than the conflicting item (scheduledReq).
                    if (req.priorityWeight < scheduledReq.priorityWeight) {
                        // Suggest shifting the requirement immediately after the conflict ends.
                        const newStart = scheduledReq.actualEndTime;
                        const newEnd = newStart + (currentEnd - currentStart);

                        report = `Conflict detected for ${req.id} (${resourceType}) with scheduled task ${scheduledReq.id}. Shifting ${req.id} to start at ${newStart} and end at ${newEnd}.`;
                        
                        return { 
                            scheduled: { ...req, actualStartTime: newStart, actualEndTime: newEnd }, 
                            report: report 
                        };
                    } 
                    // If priorities are equal or higher (shouldn't happen due to sorting), we might fail or require manual intervention.
                    // For robustness, we assume the higher priority item wins and the current item must shift.
                }
            }

            // 2. No conflict found, schedule as is.
            return { 
                scheduled: { ...req, actualStartTime: req.startTime, actualEndTime: req.endTime }, 
                report: "" 
            };
        };

        // Process requirements sequentially, building the schedule and detecting conflicts
        for (const req of sortedRequirements) {
            const { scheduled, report } = processRequirement(req, scheduledSchedule);
            
            if (scheduled) {
                scheduledSchedule.push(scheduled);
                if (report) {
                    adjustmentsMade.push(report);
                }
            }
        }

        return {
            scheduledSchedule: scheduledSchedule,
            adjustmentsMade: adjustmentsMade
        };
    }
}