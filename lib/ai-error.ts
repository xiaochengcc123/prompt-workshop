export function getReadableAiError(error: unknown) {
  if (error instanceof Error) {
    const maybeStatus = (error as Error & { status?: number }).status;
    const maybeCode = (error as Error & { code?: string }).code;
    const parts = [error.message];

    if (maybeStatus) {
      parts.push(`status=${maybeStatus}`);
    }

    if (maybeCode) {
      parts.push(`code=${maybeCode}`);
    }

    return parts.filter(Boolean).join(" | ");
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "未知 AI 调用错误";
  }
}
