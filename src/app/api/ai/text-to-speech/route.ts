import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, language } = await request.json();

    // Check if Google Cloud TTS API key is configured
    if (!process.env.GOOGLE_CLOUD_TTS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Cloud TTS not configured. Using browser TTS fallback.' },
        { status: 503 }
      );
    }

    // Map language to voice codes
    const voiceMap: Record<string, string> = {
      'English': 'en-NG',
      'Nigerian Pidgin': 'en-NG',
      'Yoruba': 'yo-NG',
      'Igbo': 'ig-NG',
      'Hausa': 'ha-NG'
    };

    const languageCode = voiceMap[language] || 'en-NG';

    // Use Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3'
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('TTS API failed');
    }

    const data = await response.json();
    
    // Return base64 audio as data URL
    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;

    return NextResponse.json({ media: audioUrl });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
