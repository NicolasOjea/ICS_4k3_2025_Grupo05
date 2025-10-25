// Middleware de auth mock: acepta token en header Authorization o cookie 'token'
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);

  // parsear cookie si no hay header
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === 'token') { token = decodeURIComponent(v); break; }
    }
  }

  const match = (token || '').match(/^mock-token-(\d+)$/);
  if (!match) return res.status(401).json({ message: 'No autorizado. Debe hacer login.' });
  req.authUserId = Number(match[1]);
  next();
};
