import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_development_secret';

if (JWT_SECRET === 'fallback_development_secret') {
  console.warn('WARNING: JWT_SECRET is not set. Using insecure fallback secret for development.');
}

export function authMiddleware(req, res, next) {
  const cookieHeader = req.headers.cookie;
  let token = null;

  if (cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    });
    token = cookies['token'];
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id and username
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
  }
}
