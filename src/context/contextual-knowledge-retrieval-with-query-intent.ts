import { Message, UserMessage } from "./types";

interface Intent {
  intent: "summarization" | "comparison" | "listing" | "question_answering" | "unknown";
  confidence: number;
}

interface KnowledgeBase {
  retrieve: (query: string, intent: Intent) => Promise<{ documents: { content: string; score: number }[]; metadata: Record<string, any> }>;
}

class IntentClassifier {
  classify(query: string): Intent {
    const lowerQuery = query.toLowerCase();
    let intent: Intent = { intent: "unknown", confidence: 0.5 };

    if (lowerQuery.includes("compare") || lowerQuery.includes("difference between")) {
      intent = { intent: "comparison", confidence: 0.9 };
    } else if (lowerQuery.includes("summarize") || lowerQuery.includes("overview of")) {
      intent = { intent: "summarization", confidence: 0.95 };
    } else if (lowerQuery.includes("list") || lowerQuery.includes("what are the")) {
      intent = { intent: "listing", confidence: 0.85 };
    } else if (lowerQuery.includes("how to") || lowerQuery.includes("what is")) {
      intent = { intent: "question_answering", confidence: 0.9 };
    }

    return intent;
  }
}

export class ContextualKnowledgeRetriever {
  private intentClassifier: IntentClassifier;
  private knowledgeBase: KnowledgeBase;

  constructor(knowledgeBase: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.intentClassifier = new IntentClassifier();
  }

  private async classifyQuery(query: string): Promise<Intent> {
    return this.intentClassifier.classify(query);
  }

  public async retrieveContext(userMessage: UserMessage): Promise<{ documents: { content: string; score: number }[]; metadata: Record<string, any> }> {
    const query = userMessage.content;

    const intent = await this.classifyQuery(query);

    console.log(`[Retriever] Detected Intent: ${intent.intent} with confidence ${intent.confidence.toFixed(2)}`);

    return this.knowledgeBase.retrieve(query, intent);
  }
}