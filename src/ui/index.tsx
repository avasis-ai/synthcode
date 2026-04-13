import React, { useState, useRef, useCallback, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { MessageBubble } from "./components/message-bubble.js";
import type { DisplayEntry } from "./components/message-bubble.js";
import { StreamingIndicator } from "./components/streaming-indicator.js";
import { StatusBar } from "./components/status-bar.js";
import { PromptInput } from "./components/prompt-input.js";
import type { Agent } from "../agent.js";
import type { LoopEvent } from "../types.js";

export interface AppProps {
  agent: Agent;
  modelName: string;
}

export function App({ agent, modelName }: AppProps) {
  const { exit } = useApp();

  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const idCounter = useRef(0);
  const textBuf = useRef("");

  useEffect(() => {
    streamingRef.current = isStreaming;
  }, [isStreaming]);

  useInput((ch, key) => {
    if (key.ctrl && ch === "c") {
      if (streamingRef.current && abortRef.current) {
        abortRef.current.abort();
      } else {
        exit();
      }
      return;
    }
    if (key.ctrl && ch === "d") {
      exit();
      return;
    }
  });

  const nextId = useCallback(() => idCounter.current++, []);

  const processPrompt = useCallback(
    async (prompt: string) => {
      setEntries((prev) => [
        ...prev,
        { id: nextId(), type: "user", content: prompt },
      ]);
      setIsStreaming(true);
      setCurrentText("");
      textBuf.current = "";

      const ac = new AbortController();
      abortRef.current = ac;

      const flushText = () => {
        const t = textBuf.current;
        if (!t) return;
        setEntries((prev) => [
          ...prev,
          { id: nextId(), type: "assistant", content: t },
        ]);
        textBuf.current = "";
        setCurrentText("");
      };

      try {
        for await (const event of agent.run(prompt, {
          abortSignal: ac.signal,
        })) {
          switch (event.type) {
            case "text":
              textBuf.current += event.text;
              setCurrentText(textBuf.current);
              break;

            case "thinking":
              flushText();
              setEntries((prev) => [
                ...prev,
                {
                  id: nextId(),
                  type: "thinking",
                  content: event.thinking,
                },
              ]);
              break;

            case "tool_use": {
              flushText();
              const s = JSON.stringify(event.input);
              setEntries((prev) => [
                ...prev,
                {
                  id: nextId(),
                  type: "tool_use",
                  content: "",
                  toolName: event.name,
                  toolInput:
                    s.length > 120 ? `${s.slice(0, 120)}...` : s,
                },
              ]);
              break;
            }

            case "tool_result":
              flushText();
              setEntries((prev) => [
                ...prev,
                {
                  id: nextId(),
                  type: "tool_result",
                  content: event.output,
                  toolName: event.name,
                  isError: event.isError,
                },
              ]);
              break;

            case "error":
              flushText();
              setEntries((prev) => [
                ...prev,
                {
                  id: nextId(),
                  type: "tool_result",
                  content: event.error.message,
                  isError: true,
                },
              ]);
              break;

            case "done":
              flushText();
              setTotalInputTokens(
                (prev) => prev + event.usage.inputTokens,
              );
              setTotalOutputTokens(
                (prev) => prev + event.usage.outputTokens,
              );
              setTurnCount((prev) => prev + 1);
              setTotalCost(agent.getCostTracker().getTotal().cost);
              break;
          }
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error.name === "AbortError") {
          if (textBuf.current) {
            textBuf.current += "\n[cancelled]";
          }
          flushText();
        } else {
          flushText();
          setEntries((prev) => [
            ...prev,
            {
              id: nextId(),
              type: "tool_result",
              content: error.message || "Unknown error",
              isError: true,
            },
          ]);
        }
      } finally {
        flushText();
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [agent, nextId],
  );

  const handleSubmit = useCallback(() => {
    const p = input.trim();
    if (!p || isStreaming) return;
    setInput("");
    processPrompt(p);
  }, [input, isStreaming, processPrompt]);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box flexDirection="column">
        {entries.map((e) => (
          <MessageBubble key={e.id} entry={e} />
        ))}
        {currentText && (
          <Box flexDirection="column">
            <Text color="green">{currentText}</Text>
            <StreamingIndicator active={isStreaming} />
          </Box>
        )}
        {!currentText && isStreaming && (
          <Box marginTop={1} paddingLeft={2}>
            <StreamingIndicator active={isStreaming} />
          </Box>
        )}
      </Box>

      <PromptInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isStreaming}
      />

      <StatusBar
        model={modelName}
        turn={turnCount}
        inputTokens={totalInputTokens}
        outputTokens={totalOutputTokens}
        cost={totalCost}
        isStreaming={isStreaming}
      />
    </Box>
  );
}
