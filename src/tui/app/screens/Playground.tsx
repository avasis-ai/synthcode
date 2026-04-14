import React, { useState, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import { TextInput } from '@inkjs/ui';
import { COLORS } from '../theme.js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface PlaygroundProps {
  width: number;
  height: number;
  onNavigate?: (screen: string) => void;
  onSelectModel?: (modelId: string) => void;
}

export function Playground({ width, height }: PlaygroundProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Welcome to SynthCode Playground. Type a message to chat with the AI agent.',
      timestamp: new Date(),
    },
    {
      role: 'assistant',
      content: 'Connect a provider to start chatting. Use --ollama, --anthropic, or --google flags.',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('qwen3:32b');

  const topBarHeight = 1;
  const inputBarHeight = 3;
  const messageAreaHeight = Math.max(3, height - topBarHeight - inputBarHeight);
  const maxContentWidth = Math.max(20, width - 6);
  const visibleMessages = messages.slice(-messageAreaHeight);

  const wrapContent = useCallback((content: string, maxLen: number) => {
    const lines: string[] = [];
    for (let i = 0; i < content.length; i += maxLen) {
      lines.push(content.slice(i, i + maxLen));
    }
    return lines.length > 0 ? lines : [''];
  }, []);

  const formatTime = useCallback((d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const handleSend = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (trimmed === '/clear') {
      setMessages([]);
      return;
    }

    if (trimmed.startsWith('/model ')) {
      const newModel = trimmed.slice(7).trim();
      if (newModel) {
        setModel(newModel);
        setMessages(prev => [
          ...prev,
          { role: 'system' as const, content: `Model switched to ${newModel}`, timestamp: new Date() },
        ]);
      }
      return;
    }

    if (trimmed === '/quit') {
      exit();
      return;
    }

    const userContent = trimmed;
    setMessages(prev => [
      ...prev,
      { role: 'user' as const, content: userContent, timestamp: new Date() },
    ]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          content: `[Simulated] Connect a provider (Ollama, Anthropic, OpenAI) to get real responses. Your message: "${userContent}"`,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 800 + Math.random() * 1200);
  }, [exit]);

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box width={width} justifyContent="space-between" paddingX={1}>
        <Text bold color={COLORS.accent}>
          Agent Playground
        </Text>
        <Text color={COLORS.muted}>
          {'Model: '}{model}{' | /clear /model /quit'}
        </Text>
      </Box>

      <Box flexDirection="column" width={width} height={messageAreaHeight} paddingX={1}>
        {visibleMessages.map((msg, i) => {
          if (msg.role === 'system') {
            return (
              <Box key={i} justifyContent="center" width={width - 2}>
                <Text color={COLORS.warning}>{msg.content}</Text>
              </Box>
            );
          }

          if (msg.role === 'user') {
            const wrapped = wrapContent(msg.content, maxContentWidth);
            return (
              <Box key={i} flexDirection="column" alignItems="flex-end" width={width - 2}>
                {wrapped.map((line, j) => (
                  <Text key={j} color={COLORS.cyan}>
                    {line}
                  </Text>
                ))}
                <Text dimColor>{formatTime(msg.timestamp)}</Text>
              </Box>
            );
          }

          return (
            <Box key={i} flexDirection="column" width={width - 2}>
              <Text color={COLORS.text}>{msg.content}</Text>
              <Text dimColor>{formatTime(msg.timestamp)}</Text>
            </Box>
          );
        })}
        {isLoading && (
          <Box paddingLeft={2}>
            <Text color={COLORS.muted} italic>
              thinking...
            </Text>
          </Box>
        )}
      </Box>

      <Box width={width} paddingX={1} borderStyle="single" borderColor={COLORS.dim}>
        <Text color={COLORS.cyan} bold>
          {'> '}
        </Text>
        <Box flexGrow={1}>
          <TextInput
            onSubmit={handleSend}
            placeholder="Type a message..."
            isDisabled={isLoading}
          />
        </Box>
      </Box>
    </Box>
  );
}
