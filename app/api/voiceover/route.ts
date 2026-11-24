import { NextRequest, NextResponse } from 'next/server';
import {
  extractFriendlyGeminiError,
  getGeminiClient,
  withGeminiRetry,
} from '@/lib/gemini';

type VoiceoverMode = 'theatre-dialogue' | 'story-narration' | 'poem-recitation';

interface DialogueLineInput {
  type: 'stage' | 'dialogue';
  speaker?: string;
  cue?: string;
  text: string;
}

interface VoiceoverRequest {
  mode: VoiceoverMode;
  title?: string;
  language?: string;
  genre?: string;
  voiceStyle?: string;
  text?: string;
  lines?: DialogueLineInput[];
}

function pickVoicePair(speakers: string[]): [string, string] {
  const s1 = (speakers[0] || '').toLowerCase();
  const s2 = (speakers[1] || '').toLowerCase();
  const isFemale1 =
    s1.includes('आई') ||
    s1.includes('riya') ||
    s1.includes('मुक्ता') ||
    s1.includes('aai') ||
    s1.includes('suman');
  const isFemale2 =
    s2.includes('आई') ||
    s2.includes('riya') ||
    s2.includes('मुक्ता') ||
    s2.includes('aai') ||
    s2.includes('suman');

  const voice1 = isFemale1 ? 'Kore' : 'Charon';
  const voice2 = isFemale2 ? 'Zephyr' : voice1 === 'Charon' ? 'Puck' : 'Fenrir';
  return [voice1, voice2];
}

async function synthesizeSingleSpeaker(params: {
  text: string;
  styleInstruction: string;
  voiceName: string;
}): Promise<{ audioBase64: string; model: string }> {
  const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  const ai = getGeminiClient('v1beta');

  let lastErr: unknown;
  for (const model of ttsModels) {
    try {
      const resp = await withGeminiRetry(
        () =>
          ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Read aloud in this voice style (${params.styleInstruction}):\n\n${params.text}`,
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: params.voiceName },
                },
              },
            },
          }),
        3
      );

      const audioBase64 =
        resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        return { audioBase64, model };
      }
    } catch (err) {
      lastErr = err;
      console.warn(
        `TTS failed (${model}):`,
        err instanceof Error ? err.message : err
      );
    }
  }

  throw lastErr || new Error('Studio voiceover synthesis failed.');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VoiceoverRequest;

    if (body.mode === 'theatre-dialogue') {
      const rawLines = (body.lines || []).filter((l) => l.text?.trim());
      if (rawLines.length === 0) {
        return NextResponse.json(
          { error: 'No dialogue lines provided for theatre voiceover.' },
          { status: 400 }
        );
      }

      const dialogueSpeakers: string[] = [];
      for (const l of rawLines) {
        if (l.type === 'dialogue' && l.speaker) {
          const sp = l.speaker.trim();
          if (!dialogueSpeakers.includes(sp)) {
            dialogueSpeakers.push(sp);
          }
        }
      }

      const primarySpeaker = dialogueSpeakers[0] || 'अर्जुन';
      const secondarySpeaker = dialogueSpeakers[1] || 'आवाज';
      const [voiceA, voiceB] = pickVoicePair([primarySpeaker, secondarySpeaker]);

      const plainTranscript = rawLines
        .map((line) => {
          if (line.type === 'stage') {
            return `${secondarySpeaker}: ${line.text.replace(/^\(|\)$/g, '')}`;
          }
          const rawSpeaker = (line.speaker || primarySpeaker).trim();
          const mappedSpeaker =
            rawSpeaker === primarySpeaker
              ? primarySpeaker
              : rawSpeaker === secondarySpeaker
                ? secondarySpeaker
                : dialogueSpeakers.indexOf(rawSpeaker) % 2 === 0
                  ? primarySpeaker
                  : secondarySpeaker;
          return `${mappedSpeaker}: ${line.text}`;
        })
        .join('\n');

      try {
        const ai = getGeminiClient('v1beta');
        const response = await withGeminiRetry(
          () =>
            ai.models.generateContent({
              model: 'gemini-3.8-flash-tts',
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Perform this two-speaker stage dialogue naturally in Marathi/Hindi with expressive theatre pacing:\n\n${plainTranscript}`,
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                      {
                        speaker: primarySpeaker,
                        voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: voiceA },
                        },
                      },
                      {
                        speaker: secondarySpeaker,
                        voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: voiceB },
                        },
                      },
                    ],
                  },
                },
              },
            }),
          3
        );

        const audioBase64 =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) {
          return NextResponse.json({
            audioBase64,
            mimeType: 'audio/wav',
            speakers: [primarySpeaker, secondarySpeaker],
            model: 'gemini-3.8-flash-tts',
          });
        }
      } catch (err) {
        console.warn(
          'Multi-speaker TTS failed, falling back to single-speaker dramatic voice:',
          err instanceof Error ? err.message : err
        );
      }

      const fallback = await synthesizeSingleSpeaker({
        text: plainTranscript,
        styleInstruction:
          'Expressive Indian theatre actor performing a poignant dramatic dialogue scene with distinct character contrast and natural pauses',
        voiceName: voiceA,
      });

      return NextResponse.json({
        audioBase64: fallback.audioBase64,
        mimeType: 'audio/wav',
        speakers: [primarySpeaker, secondarySpeaker],
        model: fallback.model,
      });
    }

    const text = (body.text || '').trim();
    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required for voiceover generation.' },
        { status: 400 }
      );
    }

    const isThriller =
      (body.genre || '').toLowerCase().includes('thriller') ||
      (body.title || '').toLowerCase().includes('chupke');

    const styleInstruction =
      body.mode === 'poem-recitation'
        ? `Intimate Indian poet reciting ${body.language || 'multilingual'} verse at midnight, warm emotional cadence, unhurried breath pauses`
        : isThriller
          ? 'Gripping investigative noir audiobook narrator, low smoky Delhi midnight atmosphere, crisp dramatic pacing'
          : 'Warm, deeply empathetic Indian literary storyteller, natural late-night audiobook intimacy';

    const voiceName =
      body.voiceStyle === 'warm-female'
        ? 'Kore'
        : isThriller
          ? 'Fenrir'
          : 'Charon';

    const result = await synthesizeSingleSpeaker({
      text,
      styleInstruction,
      voiceName,
    });

    return NextResponse.json({
      audioBase64: result.audioBase64,
      mimeType: 'audio/wav',
      model: result.model,
    });
  } catch (err) {
    console.error('Voiceover API error:', err);
    const { message, status } = extractFriendlyGeminiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
