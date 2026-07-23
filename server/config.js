import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_development_secret';

if (JWT_SECRET === 'fallback_development_secret') {
  console.warn('WARNING: JWT_SECRET is not set. Using insecure fallback secret for development.');
}
