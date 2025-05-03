import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeText(
  transcript: string,
  prompt: string = 'Give bullet points highlighting key issues and events from the video.',
  maxWords: number = 200
): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a video summarization tool. ${prompt} Keep it concise and under ${maxWords} words.`,
      },
      {
        role: 'user',
        content: transcript,
      },
    ],
  });

  const summaryText = completion.choices[0]?.message?.content || '';
  return summaryText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('```')); // cleanup formatting artifacts
}
