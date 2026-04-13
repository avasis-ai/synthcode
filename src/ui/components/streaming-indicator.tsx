import React, { useState, useEffect } from "react";
import { Text } from "ink";

interface StreamingIndicatorProps {
  active: boolean;
}

export function StreamingIndicator({ active }: StreamingIndicatorProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % 3), 400);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return <Text color="green">{".".repeat(frame + 1)}</Text>;
}
