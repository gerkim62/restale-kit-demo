import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import todosRouter from './routes/todos.js';
import { attachSSE } from 'restale-kit/express';
import { sseGroup } from './sse.js';
import { authMiddleware, parseCookies } from './middleware/auth.js';
import { JWT_SECRET } from './config.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser
const allowedOrigins = [
  /^https?:\/\/localhost:\d+$/,
  /^https?:\/\/127\.0\.0\.1:\d+$/
];

if (process.env.CLIENT_URL) {
  const urls = process.env.CLIENT_URL.split(',').map(url => url.trim());
  allowedOrigins.push(...urls);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
    } else {
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Todo API is running' });
});

// Register Routers
app.use('/api/auth', authRouter);
app.use('/api/todos', todosRouter);

// SSE real-time cache invalidation endpoint
app.get('/api/sse', authMiddleware, (req, res) => {
  // req.user.exp is epoch-seconds from the JWT; deadline takes epoch-ms.
  // onDeadline:'revoke' is correct here — the token's exp is authoritative
  // (signed by the server), not a conservative hint.
  const tokenDeadlineMs = req.user.exp * 1000;

  const channel = attachSSE(req, res, {
    target: 'tanstack-query',

    // 1. Lifetime: close the SSE connection exactly when the JWT expires.
    lifetime: {
      deadline: tokenDeadlineMs,
      onDeadline: 'revoke',
    },

    // 2. beforeFrame: re-verify the token before every outgoing signal.
    //    Catches mid-connection invalidation (e.g. cookie cleared by another
    //    tab without a logout request reaching this server).
    //    Closes over req (the original authenticated request) for cookie access.
    beforeFrame: (_ctx) => {
      const token = parseCookies(req.headers.cookie)['token'] ?? null;

      if (!token) {
        return { action: 'close', reason: 'token-missing' };
      }

      try {
        jwt.verify(token, JWT_SECRET);
        return { action: 'send' };
      } catch {
        return { action: 'close', reason: 'token-expired' };
      }
    },
  });

  sseGroup.register(channel, { userId: req.user.id }, {
    topics: [`user:${req.user.id}`]
  });
});

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
