import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeText(
  transcript: string,
  prompt: string = 'Summarize the video using markdown with section headings and bullet points. Include key themes like infrastructure, climate issues, and community resilience.',
  maxWords: number = 2000
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that generates rich summaries. Use markdown formatting with headlines and bullet points. Limit the response to ${maxWords} words.`,
      },
      {
        role: 'user',
        content: `Transcript:\n${transcript}\n\nPrompt: ${prompt}`,
      },
    ],
  });

  const summaryText = completion.choices[0]?.message?.content?.trim() || '';
  return summaryText;
}
