import express from 'express';
import { processVideoUrl } from '../services/videoService';

const router = express.Router();

router.get('/', async (req, res) => {
  const { url, words } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  const maxWords = parseInt(words as string) || 200;

  try {
    const result = await processVideoUrl(url, maxWords);
    res.json(result);
  } catch (err) {
    console.error('Error in video processing route:', err);
    res.status(500).json({ error: 'Failed to process video.' });
  }
});

export default router;
