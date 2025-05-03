import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { transcribeAudio } from './whisperService';
import { summarizeText } from './gptService';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export async function processVideoUrl(url: string, maxWords = 200) {
  const jobId = uuidv4();
  const tempDir = path.join(__dirname, '../../tmp', jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  console.log(`[${jobId}] Starting video processing...`);

  const videoPath = path.join(tempDir, 'video.mp4');

  try {
    console.log(`[${jobId}] Downloading video: ${url}`);
    await execAsync(`yt-dlp -f best -o "${videoPath}" "${url}"`);
    console.log(`[${jobId}] Downloaded to: ${videoPath}`);

    // Get video duration
    const { stdout: durationStr } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    const totalDuration = Math.floor(parseFloat(durationStr));
    const chunkDuration = 600; // 10 minutes in seconds
    const numChunks = Math.ceil(totalDuration / chunkDuration);

    const allTranscripts: string[] = [];
    const results = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkDuration;
      const clipPath = path.join(tempDir, `clip_${i}.mp4`);
      const audioPath = path.join(tempDir, `clip_${i}.mp3`);

      console.log(`[${jobId}] Extracting segment ${i + 1}/${numChunks}...`);
      await execAsync(`ffmpeg -y -i "${videoPath}" -ss ${start} -t ${chunkDuration} -c copy "${clipPath}"`);
      await execAsync(`ffmpeg -y -i "${clipPath}" -vn -ar 44100 -ac 1 -b:a 64k "${audioPath}"`);

      console.log(`[${jobId}] Transcribing segment ${i + 1}...`);
      const transcript = await transcribeAudio(audioPath);
      allTranscripts.push(transcript);

      results.push({
        start,
        end: Math.min(start + chunkDuration, totalDuration),
        transcript,
      });
    }

    const fullTranscript = allTranscripts.join('\n\n');
    console.log(`[${jobId}] Generating summary with limit of ${maxWords} words...`);
    const summary = await summarizeText(fullTranscript, maxWords);

    return {
      jobId,
      summary,
      clips: results,
    };
  } catch (err) {
    console.error(`[${jobId}] ❌ Error during processing:`, err);
    throw err;
  }
}
