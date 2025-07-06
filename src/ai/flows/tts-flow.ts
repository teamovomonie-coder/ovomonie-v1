'use server';
/**
 * @fileOverview A flow for converting text to speech with multilingual support.
 *
 * - textToSpeech - A function that converts a string of text into playable audio in a specified language/voice.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';
import {googleAI} from '@genkit-ai/googleai';

export type SupportedLanguage = 'English' | 'Nigerian Pidgin' | 'Yoruba' | 'Igbo' | 'Hausa' | 'Unknown';

function getVoiceForLanguage(language: SupportedLanguage): string {
    switch (language) {
        case 'Nigerian Pidgin':
            return 'Achernar';
        case 'Yoruba':
            return 'Canopus';
        case 'Igbo':
            return 'Capella';
        case 'Hausa':
            return 'Arcturus';
        case 'English':
        case 'Unknown':
        default:
            return 'Algenib'; // Professional, calm voice as default
    }
}

export async function textToSpeech(query: string, language: SupportedLanguage = 'English'): Promise<{media: string}> {
  const voiceName = getVoiceForLanguage(language);
  
  const {media} = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-preview-tts'),
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {voiceName},
        },
      },
    },
    prompt: query,
  });
  if (!media) {
    throw new Error('no media returned');
  }
  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );
  return {
    media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
  };
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
