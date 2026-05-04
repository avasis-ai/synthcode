import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextualValidator = (
  messages: Message[],
  toolCall: ToolUseBlock
): { isValid: boolean; message: string };

const extractKeyConcepts = (messages: Message[]): Set<string> => {
  const concepts = new Set<string>();
  for (const message of messages) {
    if (message.role === "user" && message.content.length > 0) {
      // Simple heuristic: extract the first few significant words from the user message
      const textContent = message.content.filter((block): block is TextBlock => block.type === "text")
        .map(block => block.text)
        .join(" ")
        .trim();

      if (textContent) {
        const words = textContent.split(/\s+/).filter(w => w.length > 2);
        words.slice(0, 5).forEach(word => concepts.add(word.toLowerCase()));
      }
    }
  }
  return concepts;
};

const validateContextualConsistency: ContextualValidator = (
  messages: Message[],
  toolCall: ToolUseBlock
): { isValid: boolean; message: string } => {
  const precedingContext = messages.slice(0, -1);
  const keyConcepts = extractKeyConcepts(precedingContext);

  if (keyConcepts.size === 0) {
    return { isValid: true, message: "No specific context found to validate against." };
  }

  // Simple check: Does the tool call's name or arguments mention any key concept?
  const requiredConceptMatch = Array.from(keyConcepts).some(concept => {
    const toolNameMatch = toolCall.name.toLowerCase().includes(concept);
    const inputString = JSON.stringify(toolCall.input).toLowerCase();
    const inputMatch = inputString.includes(concept);
    return toolNameMatch || inputMatch;
  });

  if (requiredConceptMatch) {
    return { isValid: true, message: "Tool call appears contextually relevant." };
  } else {
    return {
      isValid: false,
      message: `Tool call '${toolCall.name}' seems disconnected from the preceding context. Key concepts identified: ${Array.from(keyConcepts).join(', ')}.`,
    };
  }
};

export const contextualToolCallValidator = validateContextualConsistency;