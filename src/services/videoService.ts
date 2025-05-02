import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { transcribeAudio } from './whisperService';
import { summarizeText } from './gptService';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export async function processVideoUrl(url: string) {
  const jobId = uuidv4();
  const tempDir = path.join(__dirname, '../../tmp', jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  const videoPath = path.join(tempDir, 'video.mp4');

  // 1. Download the video
  await execAsync(`yt-dlp -f best -o "${videoPath}" "${url}"`);

  // 2. Split video into clips (e.g., every 30s)
  const clip1 = path.join(tempDir, 'clip1.mp4');
  await execAsync(`ffmpeg -i "${videoPath}" -t 30 -c copy "${clip1}"`);

  // 3. Extract audio from the clip
  const audioPath = path.join(tempDir, 'clip1.wav');
  await execAsync(`ffmpeg -i "${clip1}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioPath}"`);

  // 4. Transcribe audio
  const transcript = await transcribeAudio(audioPath);

  // 5. Summarize
  const summary = await summarizeText(transcript);

  return {
    jobId,
    result: [
      {
        start: 0,
        end: 30,
        transcript,
        summary,
      },
    ],
  };
}
