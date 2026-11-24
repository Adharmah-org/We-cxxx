import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import {
  extractFriendlyGeminiError,
  getGeminiClient,
  withGeminiRetry,
} from '@/lib/gemini';
import type { PoetrySongComposition } from '@/lib/types';

interface PoetrySongRequest {
  title: string;
  language: string;
  category: string;
  poemBody: string;
  vocalTone?: 'intimate-male' | 'warm-female' | 'deep-baritone';
  customPrompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PoetrySongRequest;

    const promptText = `You are a master Indian acoustic songwriter, ghazal composer, and music arranger working in the literary universe of Tejas Purvesh Phirake (TEJAS · BENIYAAZ.ROOH).

Compose an original, deeply moving acoustic poetry song inspired by this poem/prompt:
Title: ${body.title}
Language: ${body.language}
Mood / Category: ${body.category}
Original Poem:
${body.poemBody}
${body.customPrompt ? `\nCreative Direction: ${body.customPrompt}` : ''}

Requirements:
1. Write lyrical, singable song sections (Mukhda / Chorus, Antara 1, Antara 2, Outro) in the same language (${body.language}) preserving the soul, longing, and poetic imagery. Keep each section concise (2-4 poetic lines) so it feels genuinely musical and memorable.
2. Specify an authentic Indian acoustic music arrangement:
   - ragaMood: e.g. "Raag Yaman · Acoustic Guitar & Tanpura", "Raag Bhairavi · Midnight Felt Piano", "Raag Pahadi · Flute & Warm Strings"
   - styleTag: short 3-5 word sonic mood label (e.g. "Acoustic Ghazal Ballad")
   - tempoBpm: integer between 64 and 92
   - rootMidi: integer MIDI note between 45 (A2) and 55 (G3)
   - scaleIntervals: array of 5 to 7 semitone offsets from 0 (e.g. [0, 2, 4, 7, 9] for Bhupali/Yaman pentatonic or [0, 1, 3, 5, 7, 8, 10] for Bhairavi)
   - chordProgression: 4 chord symbols matching the mood (e.g. ["Am", "F", "C", "G"])
3. Write "performanceScript": a natural, emotionally paced vocal rendition script combining the Mukhda and Antara 1 (under 85 words, clean poetic lines with no markup tags).`;

    const songSchema = {
      type: Type.OBJECT,
      properties: {
        songTitle: { type: Type.STRING },
        ragaMood: { type: Type.STRING },
        styleTag: { type: Type.STRING },
        tempoBpm: { type: Type.INTEGER },
        rootMidi: { type: Type.INTEGER },
        scaleIntervals: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER },
        },
        chordProgression: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['label', 'lines'],
          },
        },
        performanceScript: { type: Type.STRING },
      },
      required: [
        'songTitle',
        'ragaMood',
        'styleTag',
        'tempoBpm',
        'rootMidi',
        'scaleIntervals',
        'chordProgression',
        'sections',
        'performanceScript',
      ],
    };

    const aiText = getGeminiClient();
    const textModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let songResponse;
    let lastTextErr: unknown;

    for (const model of textModels) {
      try {
        songResponse = await withGeminiRetry(
          () =>
            aiText.models.generateContent({
              model,
              contents: promptText,
              config: {
                responseMimeType: 'application/json',
                responseSchema: songSchema,
              },
            }),
          3
        );
        if (songResponse.text) break;
      } catch (err) {
        lastTextErr = err;
        console.warn(
          `Song text model failed (${model}):`,
          err instanceof Error ? err.message : err
        );
      }
    }

    if (!songResponse?.text) {
      throw lastTextErr || new Error('Unable to compose song lyrics.');
    }

    const rawJson = songResponse.text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(rawJson) as Omit<
      PoetrySongComposition,
      'vocalTone' | 'vocalAudioBase64' | 'vocalMimeType'
    >;

    const vocalTone = body.vocalTone || 'intimate-male';
    const voiceName =
      vocalTone === 'warm-female'
        ? 'Kore'
        : vocalTone === 'deep-baritone'
          ? 'Fenrir'
          : 'Charon';

    const vocalStyle =
      vocalTone === 'warm-female'
        ? 'Soft, expressive Indian acoustic vocalist reciting poetic song lyrics with gentle melodic cadence and studio warmth'
        : vocalTone === 'deep-baritone'
          ? 'Deep, soulful ghazal singer-poet delivering lyrical verses with rich resonance and aching emotion'
          : 'Intimate, warm Indian singer-poet performing acoustic poetry lyrics softly at midnight';

    let vocalAudioBase64: string | undefined;
    const aiTts = getGeminiClient('v1beta');
    const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

    for (const model of ttsModels) {
      try {
        const ttsResp = await withGeminiRetry(
          () =>
            aiTts.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Sing or recite expressively in this style (${vocalStyle}):\n\n${parsed.performanceScript}`,
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
              },
            }),
          3
        );
        const data =
          ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) {
          vocalAudioBase64 = data;
          break;
        }
      } catch (err) {
        console.warn(
          `Song TTS failed (${model}):`,
          err instanceof Error ? err.message : err
        );
      }
    }

    const composition: PoetrySongComposition = {
      ...parsed,
      vocalTone,
      vocalAudioBase64,
      vocalMimeType: vocalAudioBase64 ? 'audio/wav' : undefined,
    };

    return NextResponse.json(composition);
  } catch (err) {
    console.error('Poetry Song API error:', err);
    const { message, status } = extractFriendlyGeminiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
