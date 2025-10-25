import { findUserByEmail } from '../models/users.js';

// Auth mock: autenticación simple con contraseña fija 'secret'
export const login = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email y password son obligatorios' });

  const user = findUserByEmail(email);
  if (!user || user.password !== password) return res.status(401).json({ message: 'Credenciales inválidas' });

  // Mock: devolvemos user sin password
  const { password: _pw, ...safe } = user;
  res.json({ user: safe, token: 'mock-token-' + user.id });
};
