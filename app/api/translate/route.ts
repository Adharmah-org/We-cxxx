import { NextRequest, NextResponse } from 'next/server';
import {
  extractFriendlyGeminiError,
  getGeminiClient,
  withGeminiRetry,
} from '@/lib/gemini';

interface TranslateRequest {
  text: string;
  targetLanguage: 'English' | 'Hindi' | 'Marathi';
  context?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateRequest;
    const text = (body.text || '').trim();
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for translation.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const prompt = `Translate the following literary passage into natural, poetic ${body.targetLanguage}. Preserve line breaks, emotional nuance, and literary rhythm without adding commentary or explanations.\n\nContext: ${body.context || 'Indian poetry & stage literature'}\n\nText:\n${text}`;
    const config = {
      systemInstruction:
        'You are a sensitive literary translator specializing in Marathi, Hindi, Hinglish, and English poetry and drama. Output only the translated text.',
    };

    const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let response;
    let lastErr: unknown;

    for (const model of models) {
      try {
        response = await withGeminiRetry(
          () =>
            ai.models.generateContent({
              model,
              contents: prompt,
              config,
            }),
          3
        );
        if (response.text) break;
      } catch (err) {
        lastErr = err;
        console.warn(
          `Translate model failed (${model}):`,
          err instanceof Error ? err.message : err
        );
      }
    }

    if (!response?.text) {
      throw lastErr || new Error('Translation service unavailable.');
    }

    return NextResponse.json({
      translatedText: response.text.trim(),
      targetLanguage: body.targetLanguage,
    });
  } catch (err) {
    console.error('Translate API error:', err);
    const { message, status } = extractFriendlyGeminiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
