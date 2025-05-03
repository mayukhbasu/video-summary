import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment
});

export async function summarizeText(transcript: string, maxWords = 200): Promise<string> {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a summarization tool. Summarize the input transcript in under ${maxWords} words.`,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

