import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import botPerformanceRoutes from './routes/botPerformanceRoutes';

dotenv.config();

const app = express();
app.use(express.json());

const dbConnectionString = process.env.DB_CONNECTION_STRING as string;

mongoose.connect(dbConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Database connected'))
    .catch((error) => console.error('Database connection error:', error));

app.use('/api', botPerformanceRoutes);

export default app;