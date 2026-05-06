import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class CoherenceViolation extends Error {
    constructor(message: string, public details: { score: number; reason: string }) {
        super(message);
        super.name = "CoherenceViolation";
    }
}

export class DialogueCoherenceValidator {
    private readonly similarityThreshold: number;
    private readonly contradictionKeywords: Set<string>;

    constructor(similarityThreshold: number = 0.4) {
        this.similarityThreshold = similarityThreshold;
        this.contradictionKeywords = new Set([
            "but",
            "however",
            "actually",
            "no, wait",
            "on the other hand"
        ]);
    }

    private calculateSimilarityScore(message: string, context: string): number {
        const messageWords = new Set(message.toLowerCase().split(/\s+/).filter(w => w.length > 1));
        const contextWords = new Set(context.toLowerCase().split(/\s+/).filter(w => w.length > 1));

        let commonWordsCount = 0;
        for (const word of messageWords) {
            if (contextWords.has(word)) {
                commonWordsCount++;
            }
        }

        const maxPossibleOverlap = Math.min(messageWords.size, contextWords.size);
        if (maxPossibleOverlap === 0) return 0;

        // Simple Jaccard-like index approximation
        return commonWordsCount / Math.max(messageWords.size, contextWords.size);
    }

    private checkContradiction(message: string, history: Message[]): boolean {
        const messageLower = message.toLowerCase();
        for (const keyword of this.contradictionKeywords) {
            if (messageLower.includes(keyword)) {
                return true;
            }
        }
        return false;
    }

    private extractContext(history: Message[], goal: string): string {
        let context = "";
        if (history.length > 0) {
            const lastMessage = history[history.length - 1];
            if (lastMessage.role === "assistant") {
                context += `[Last Assistant Turn: ${lastMessage.content.map(b => b.text).join(' '')}] `;
            }
            context += history.slice(-3).map(m => {
                if (m.role === "user") return `User said: ${m.content.map(b => b.text).join(' '')}. `;
                if (m.role === "assistant") return `Assistant said: ${m.content.map(b => b.text).join(' '')}. `;
                return "";
            }).join(" ") + " ";
        }
        return `${context}Goal Context: ${goal}`;
    }

    /**
     * Validates the coherence of the current message against history and goal.
     * @param currentMessage The message being validated.
     * @param history The full conversation history.
     * @param goal The current objective or context goal.
     * @returns True if coherent, throws CoherenceViolation otherwise.
     */
    public validate(
        currentMessage: UserMessage,
        history: Message[],
        goal: string
    ): boolean {
        const messageContent = currentMessage.content;
        const context = this.extractContext(history, goal);

        // 1. Check for explicit contradiction keywords
        if (this.checkContradiction(messageContent, history)) {
            throw new CoherenceViolation(
                "Potential contradiction detected using transition keywords.",
                { score: 1.0, reason: "Contradiction keyword detected." }
            );
        }

        // 2. Calculate semantic similarity
        const similarityScore = this.calculateSimilarityScore(messageContent, context);

        if (similarityScore < this.similarityThreshold) {
            throw new CoherenceViolation(
                `Message topic shift detected. Similarity score (${similarityScore.toFixed(2)}) is below the threshold (${this.similarityThreshold.toFixed(2)}).`,
                { score: similarityScore, reason: "Low semantic similarity to context." }
            );
        }

        return true;
    }
}