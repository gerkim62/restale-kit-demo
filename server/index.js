import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import todosRouter from './routes/todos.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Todo API is running' });
});

// Register Routers
app.use('/api/auth', authRouter);
app.use('/api/todos', todosRouter);

// Database initialization & server start
async function startServer() {
  try {
    console.log('Initializing database...');
    await initDb();

    app.listen(PORT, () => {
      console.log(`Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server due to database error:', error);
    process.exit(1);
  }
}

startServer();
