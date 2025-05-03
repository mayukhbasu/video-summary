import express from 'express';
import { processVideoUrl } from '../services/videoService';

const router = express.Router();

router.get('/', async (req, res) => {
  const { url, words, prompt } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  try {
    const maxWords = parseInt(words as string) || 200;
    const result = await processVideoUrl(url, maxWords, prompt as string);
    res.json(result);
  } catch (err) {
    console.error('Error in /analyze route:', err);
    res.status(500).json({ error: 'Failed to process video.' });
  }
});

export default router;
