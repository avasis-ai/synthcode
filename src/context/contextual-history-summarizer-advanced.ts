import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ActionItem = {
  description: string;
  owner: string;
  due_date: string | null;
};

type StructuredSummary = {
  goals: string[];
  facts: string[];
  action_items: ActionItem[];
};

export class ContextualHistorySummarizerAdvanced {
  private history: Message[];
  private currentGoal: string | null = null;
  private actionItems: ActionItem[] = [];

  constructor(history: Message[] = []) {
    this.history = history;
  }

  private extractGoals(history: Message[]): string[] {
    // Placeholder: In a real system, this would use an LLM call or complex NLP.
    // For simulation, we look for explicit goal setting messages.
    const goalIndicators = ["our primary goal is", "we need to achieve"];
    const goals: Set<string> = new Set();

    for (const message of history) {
      const content = message.content ? message.content.join(" ") : "";
      for (const indicator of goalIndicators) {
        if (content.toLowerCase().includes(indicator)) {
          const startIndex = content.toLowerCase().indexOf(indicator);
          const potentialGoal = content.substring(startIndex + indicator.length).trim();
          if (potentialGoal.length > 10) {
            goals.add(potentialGoal.substring(0, 100) + "...");
          }
        }
      }
    }
    return Array.from(goals);
  }

  private extractFacts(history: Message[]): string[] {
    // Placeholder: Extracts key entities and confirmed facts.
    const facts: Set<string> = new Set();
    for (const message of history) {
      const content = message.content ? message.content.map(block => block.type === "text" ? block.text : "").join(" ") : "";
      if (content.length > 50 && Math.random() > 0.7) { // Simulate fact extraction
        facts.add(`Confirmed fact derived from ${message.role}: "${content.substring(0, 80)}..."`);
      }
    }
    return Array.from(facts);
  }

  private extractActionItems(history: Message[]): ActionItem[] {
    // Placeholder: Identifies tasks, owners, and deadlines.
    const items: ActionItem[] = [];
    // Simple simulation: assume the last user message implies an action.
    const lastUserMessage = history.filter(m => m.role === "user").pop();
    if (lastUserMessage) {
      const text = lastUserMessage.content ? lastUserMessage.content.map(block => block.text).join(" ") : "";
      if (text.toLowerCase().includes("please follow up")) {
        items.push({
          description: "Follow up on the next steps.",
          owner: "System",
          due_date: "Tomorrow",
        });
      }
    }
    return items;
  }

  public summarize(history: Message[]): StructuredSummary {
    this.history = history;
    const goals = this.extractGoals(history);
    const facts = this.extractFacts(history);
    const action_items = this.extractActionItems(history);

    return {
      goals: goals,
      facts: facts,
      action_items: action_items,
    };
  }

  public updateContext(summary: StructuredSummary): void {
    this.currentGoal = summary.goals.length > 0 ? summary.goals[0] : null;
    this.actionItems = summary.action_items;
  }

  public generatePromptContext(summary: StructuredSummary): string {
    let context = "--- CONTEXTUAL SUMMARY ---\n";

    if (summary.goals.length > 0) {
      context += "\n[PRIMARY GOALS]:\n";
      summary.goals.forEach((goal, index) => {
        context += `${index + 1}. ${goal}\n`;
      });
    }

    if (summary.facts.length > 0) {
      context += "\n[KEY FACTS ESTABLISHED]:\n";
      summary.facts.forEach((fact, index) => {
        context += `${index + 1}. ${fact}\n`;
      });
    }

    if (summary.action_items.length > 0) {
      context += "\n[ACTION ITEMS REMAINING]:\n";
      summary.action_items.forEach((item, index) => {
        context += `${index + 1}. Task: ${item.description} | Owner: ${item.owner} | Due: ${item.due_date || 'N/A'}\n`;
      });
    } else {
      context += "\n[ACTION ITEMS REMAINING]: None identified.\n";
    }

    context += "\n--------------------------\n";
    return context;
  }
}