import express from 'express';
import { processVideoUrl } from '../services/videoService';

const router = express.Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  try {
    const result = await processVideoUrl(url);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

export default router;
