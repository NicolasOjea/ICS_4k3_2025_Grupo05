import express, { json } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/user.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import authRoutes from './routes/auth.routes.js';


const app = express();

// Middlewares
app.use(express.json());

// Servir frontend estático (carpeta frontend en la raíz del proyecto)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../../frontend')));


// Rutas
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);


// Healthcheck (útil para CI)
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

export default app;
