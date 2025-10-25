import { getAllUsers, addUser, findUserById } from '../models/users.js';

export const getUsers = (_req, res) => {
  res.json(getAllUsers());
};

export const createUser = (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ message: 'name y email son obligatorios' });
  }
  // password opcional aquí, la DB de ejemplo lo permitirá
  const user = addUser({ name, email, password });
  // devolver sin password por seguridad
  const { password: _pw, ...safe } = user;
  // Generar token mock y devolverlo; además establecer cookie para flujo web
  const token = 'mock-token-' + user.id;
  // Establecer cookie simple (no httpOnly para facilitar uso desde frontend de ejemplo)
  res.cookie && res.cookie('token', token, { path: '/' });
  res.status(201).json({ ...safe, token });
};

// Helper simple para buscar usuario por id en la "DB" en memoria
export const getUserById = (id) => findUserById(id);

