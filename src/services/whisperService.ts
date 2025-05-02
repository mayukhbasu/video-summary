import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioPath: string): Promise<string> {
  const audioStream = fs.createReadStream(audioPath);

  const resp = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioStream,
  });

  return resp.text;
}
