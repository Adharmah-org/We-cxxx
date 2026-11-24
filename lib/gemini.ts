import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(apiVersion?: string): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check Settings > Secrets.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientGeminiError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  const status =
    (err as { status?: number; code?: number }).status ??
    (err as { code?: number }).code;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily')
  );
}

export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts && isTransientGeminiError(err)) {
        const delayMs = 700 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export function extractFriendlyGeminiError(err: unknown): {
  message: string;
  status: number;
} {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes('503') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('high demand')
  ) {
    return {
      message:
        'Gemini studio service is experiencing a temporary high-demand spike (503). Please try again in a few seconds.',
      status: 503,
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      message:
        'Free-tier API quota or rate limit exceeded (429). Please wait briefly or select a billing-enabled key in Settings > Secrets to increase quota.',
      status: 429,
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return {
      message:
        'Gemini API key permission issue. Please verify your key in Settings > Secrets.',
      status: 403,
    };
  }
  return {
    message: raw || 'Unable to reach Gemini studio service.',
    status: 500,
  };
}
