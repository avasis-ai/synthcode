import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock } from "./types";

type FilterResult = {
  sanitizedContent: string;
  isAdversarial: boolean;
  reason?: string;
};

export class AdversarialInputFilter {
  private readonly injectionKeywords: RegExp[] = [
    /ignore previous instructions/i,
    /disregard all previous instructions/i,
    /system prompt is/i,
    /act as if you are/i,
    /jailbreak/i,
    /bypass safety mechanisms/i,
    /do not follow the rules/i,
  ];

  private readonly highRiskKeywords: Set<string> = new Set([
    "system prompt",
    "secret instructions",
    "developer mode",
    "root access",
    "internal context",
  ]);

  constructor() {}

  private detectAdversarial(text: string): { isAdversarial: boolean; reason?: string } {
    const lowerText = text.toLowerCase();

    // 1. Check for explicit injection keywords
    for (const regex of this.injectionKeywords) {
      if (regex.test(lowerText)) {
        return { isAdversarial: true, reason: `Detected explicit injection pattern: ${regex.source}` };
      }
    }

    // 2. Check for high-risk keywords
    for (const keyword of this.highRiskKeywords) {
      if (lowerText.includes(keyword)) {
        return { isAdversarial: true, reason: `Detected high-risk keyword: ${keyword}` };
      }
    }

    return { isAdversarial: false };
  }

  /**
   * Processes a single message to check for adversarial content and sanitize it.
   * @param message The message to filter.
   * @returns FilterResult containing sanitized content and detection status.
   */
  public filterMessage(message: Message): FilterResult {
    let rawContent: string = "";

    if (message.role === "user" && "content" in message) {
      rawContent = message.content;
    } else if (message.role === "assistant" && "content" in message) {
      // Concatenate all text blocks for analysis
      rawContent = message.content.filter((block): block is TextBlock => block.type === "text")
        .map((block) => block.text)
        .join(" ");
    } else if (message.role === "tool" && "content" in message) {
      rawContent = message.content;
    } else {
      return { sanitizedContent: "", isAdversarial: false };
    }

    const detection = this.detectAdversarial(rawContent);

    if (detection.isAdversarial) {
      return {
        sanitizedContent: "[Content blocked due to potential adversarial input]",
        isAdversarial: true,
        reason: detection.reason,
      };
    }

    // Sanitization: Simple removal of common control characters or excessive whitespace
    const sanitized = rawContent.replace(/[\r\n]+/g, " ").trim();

    return {
      sanitizedContent: sanitized,
      isAdversarial: false,
    };
  }

  /**
   * Filters an array of messages, applying the guardrail to each one.
   * @param messages The sequence of messages to validate.
   * @returns An array of FilterResult objects.
   */
  public filterContext(messages: Message[]): FilterResult[] {
    return messages.map(message => this.filterMessage(message));
  }
}