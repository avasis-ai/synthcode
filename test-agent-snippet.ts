type Schema<T> = { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } };

class Agent {
  async structured<T>(
    prompt: string,
    schema: Schema<T>,
    options?: { abortSignal?: AbortSignal; maxRetries?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const currentPrompt = attempt === 0
        ? prompt
        : `${prompt}\n\nPrevious attempt returned invalid JSON. Please fix and respond with valid JSON only.`;
    }

    throw new Error(`Failed after ${3} attempts`);
  }

  async structuredViaTool<T>(
    prompt: string,
    schema: Schema<T>,
    options?: { abortSignal?: AbortSignal; maxRetries?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;

    let captured: T | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      captured = undefined;
    }

    throw new Error(`Failed after ${maxRetries} attempts`);
  }
}
