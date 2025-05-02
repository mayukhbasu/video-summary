import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment
});

export async function summarizeText(transcript: string): Promise<string> {
  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a summarization tool. Summarize this video clip in 1–2 lines.',
      },
      {
        role: 'user',
        content: transcript,
      },
    ],
  });

  return chatCompletion.choices[0].message?.content || '';
}
