import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware ,requireAuth,} from '@clerk/express'
import router from './routes/aiRoutes.js';
import userRouter from './routes/userRoutes.js';
import connectCloudinary from './config/cloudinary.js';


const app = express();

await connectCloudinary();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('server is Live!'));

app.use(requireAuth());

app.use('/api/ai',router);
app.use('/api/user',userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
