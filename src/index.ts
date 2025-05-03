import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
import videoRoutes from './routes/video';



const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use('/analyze', videoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
