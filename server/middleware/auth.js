import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

/**
 * Parses a raw Cookie header string and returns a key→value map.
 */
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
  return cookies;
}

export function authMiddleware(req, res, next) {
  const token = parseCookies(req.headers.cookie)['token'] ?? null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, username, exp
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
  }
}
