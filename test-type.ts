type Schema<T> = { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } };

function foo<T>(
  prompt: string,
  schema: Schema<T>,
  options?: { abortSignal?: AbortSignal; maxRetries?: number },
): Promise<T> {
  return Promise.resolve({} as T);
}

export { foo };
