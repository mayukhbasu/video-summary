import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { transcribeAudio } from './whisperService';
import { summarizeText } from './gptService';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

async function downloadVideo(url: string, output: string) {
  // Handles YouTube and generic MP4 URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    await execAsync(`yt-dlp -f best -o "${output}" "${url}"`);
  } else {
    await execAsync(`curl -L "${url}" --output "${output}"`);
  }
}

export async function processVideoUrl(
  url: string,
  maxWords = 200,
  prompt?: string
) {
  const jobId = uuidv4();
  const tempDir = path.join('/tmp', jobId); // Use /tmp for Cloud Run compatibility
  fs.mkdirSync(tempDir, { recursive: true });

  const videoPath = path.join(tempDir, 'video.mp4');

  try {
    console.log(`[${jobId}] Downloading video: ${url}`);
    await downloadVideo(url, videoPath);

    const { stdout: durationStr } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );

    const totalDuration = Math.floor(parseFloat(durationStr));
    const chunkDuration = 600; // 10 min chunks
    const numChunks = Math.ceil(totalDuration / chunkDuration);

    const allTranscripts: string[] = [];
    const clips = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkDuration;
      const clipPath = path.join(tempDir, `clip_${i}.mp4`);
      const audioPath = path.join(tempDir, `clip_${i}.mp3`);

      await execAsync(`ffmpeg -y -i "${videoPath}" -ss ${start} -t ${chunkDuration} -c copy "${clipPath}"`);
      await execAsync(`ffmpeg -y -i "${clipPath}" -vn -ar 44100 -ac 1 -b:a 64k "${audioPath}"`);

      const transcript = await transcribeAudio(audioPath);
      allTranscripts.push(transcript);

      clips.push({ start, end: Math.min(start + chunkDuration, totalDuration), transcript });
    }

    const fullTranscript = allTranscripts.join('\n\n');
    const summary = await summarizeText(fullTranscript, prompt, maxWords);

    return { jobId, title: `Summary for: ${url}`, summary, clips };
  } catch (err) {
    console.error(`[${jobId}] ❌ Error during processing:`, err);
    throw err;
  }
}
