import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioPath: string): Promise<string> {
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file does not exist at path: ${audioPath}`);
  }

  const ext = path.extname(audioPath).toLowerCase();
  const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
  if (!supportedFormats.includes(ext)) {
    throw new Error(`Unsupported audio format: ${ext}`);
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Whisper] Attempt ${attempt}: Transcribing ${path.basename(audioPath)}`);

      const response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: fs.createReadStream(audioPath),
      });

      if (!response.text) throw new Error('Empty transcription response');
      return response.text;
    } catch (error: any) {
      console.error(`[Whisper] Error on attempt ${attempt}:`, error.message || error);
      if (attempt === maxRetries) throw new Error('Max transcription retries exceeded.');
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }

  throw new Error('Unhandled Whisper error');
}
