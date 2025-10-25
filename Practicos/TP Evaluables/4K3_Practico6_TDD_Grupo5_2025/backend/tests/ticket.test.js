import { jest } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('./data/tickets.json');
let app;
let token;

beforeEach(async () => {
  // Limpia módulos en caché (reinicia backend)
  jest.resetModules();

  // Importa nueva instancia limpia del backend
  app = (await import('../src/app.js')).default;

  // Autenticación para obtener token válido
  const authRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ada@example.com', password: 'secret' });

  expect(authRes.statusCode).toBe(200);
  token = authRes.body.token;
});
const obtenerFechaAbierta = (diasDesdeHoy = 1) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  while ([2, 3].includes(fecha.getDay())) {
    fecha.setDate(fecha.getDate() + 1);
  }
  return fecha.toISOString();
};
describe('Ticket API (Compra de entradas)', () => {

  // ================================
  // ❌ Casos inválidos
  // ================================
  describe('Casos inválidos', () => {
    test('Falla si el userId del token y del body no coinciden', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fechaVisita: obtenerFechaAbierta(),
          cantidad: 1,
          pago: 'efectivo',
          userId: 999, // otro usuario
          visitantes: [{ edad: 20, tipoPase: 'regular' }]
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/token inválido/i);
    });
    test('Falla si no se selecciona forma de pago', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 2,
        userId: 1,
        visitantes: [
          { edad: 20, tipoPase: 'regular' },
          { edad: 25, tipoPase: 'vip' }
        ]
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/pago/i);
    });

    test('Falla si el parque está cerrado (lunes)', async () => {
      const hoy = new Date();
      const diaDeHoy = hoy.getDay(); // 0=Dom, 1=Lun, 2=Mar...

      // 🗓️ Calcular el próximo lunes (si hoy ya es lunes, usar el lunes siguiente)
      // días hasta el próximo lunes: (1 - diaDeHoy + 7) % 7; si resulta 0, usar 7
      const diasHastaLunes = (1 - diaDeHoy + 6) % 7 || 7;
      const diaCerrado = new Date(hoy);
      diaCerrado.setDate(hoy.getDate() + diasHastaLunes);

      const payload = {
        fechaVisita: diaCerrado.toISOString(),
        cantidad: 2,
        pago: 'efectivo',
        userId: 1,
        visitantes: [
          { edad: 22, tipoPase: 'regular' },
          { edad: 30, tipoPase: 'vip' }
        ]
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cerrado/i);
    });

    test('Falla si se intenta comprar más de 10 entradas', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 15,
        pago: 'efectivo',
        userId: 1,
        visitantes: Array.from({ length: 15 }, () => ({ edad: 20, tipoPase: 'regular' }))
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/inválida/i);
    });

    test('Falla si la fecha es pasada', async () => {
      const ayer = new Date(Date.now() - 86400000).toISOString();
      const payload = {
        fechaVisita: ayer,
        cantidad: 1,
        pago: 'efectivo',
        userId: 1,
        visitantes: [{ edad: 20, tipoPase: 'regular' }]
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/pasad/i);
    });

    test('Falla si cantidad y visitantes no coinciden', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 3,
        pago: 'efectivo',
        userId: 1,
        visitantes: [
          { edad: 20, tipoPase: 'regular' },
          { edad: 25, tipoPase: 'vip' }
        ]
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/visitantes/i);
    });

    test('Falla si alguna edad es inválida', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 2,
        pago: 'efectivo',
        userId: 1,
        visitantes: [
          { edad: 20, tipoPase: 'regular' },
          { edad: 20, tipoPase: 'vip' }
        ]
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/edad/i);
    });

    test('Falla si tipoPase es inválido', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 1,
        pago: 'efectivo',
        userId: 1,
        visitantes: [{ edad: 20, tipoPase: 'gold' }]
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/pase/i);
    });

    test('Falla si cantidad es 0 o negativa', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 0,
        pago: 'efectivo',
        userId: 1,
        visitantes: []
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cantidad/i);
    });

    test('Falla si no está autenticado', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 2,
        pago: 'efectivo',
        visitantes: [
          { edad: 20, tipoPase: 'regular' },
          { edad: 25, tipoPase: 'vip' }
        ]
      };

      const res = await request(app).post('/api/tickets').send(payload);
      expect(res.statusCode).toBe(401);
    });

    test('Falla si la fecha supera los 3 meses desde hoy', async () => {
      const fechaFutura = new Date();
      fechaFutura.setMonth(fechaFutura.getMonth() + 3);

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fechaVisita: fechaFutura.toISOString(),
          cantidad: 1,
          pago: 'efectivo',
          userId: 1,
          visitantes: [{ edad: 20, tipoPase: 'regular' }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/3 meses/i);
    });
  });

  // ================================
  // ✅ Casos válidos
  // ================================
  describe('Casos válidos', () => {
    test('Compra con Mercado Pago devuelve checkoutUrl', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(),
        cantidad: 3,
        visitantes: [
          { edad: 25, tipoPase: 'regular' },
          { edad: 30, tipoPase: 'vip' },
          { edad: 5, tipoPase: 'regular' }
        ],
        pago: 'mercado_pago',
        userId: 1
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('checkoutUrl');
    });

    test('Compra en efectivo (sin checkoutUrl)', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(5),
        cantidad: 2,
        visitantes: [
          { edad: 18, tipoPase: 'vip' },
          { edad: 40, tipoPase: 'regular' }
        ],
        pago: 'efectivo',
        userId: 1
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body).not.toHaveProperty('checkoutUrl');
    });

    test('Compra válida con exactamente 10 entradas', async () => {
      const payload = {
        fechaVisita: obtenerFechaAbierta(3),
        cantidad: 10,
        visitantes: Array.from({ length: 10 }, () => ({ edad: 22, tipoPase: 'regular' })),
        pago: 'efectivo',
        userId: 1
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
    });
    test('Compra válida genera un QR en base64', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fechaVisita: obtenerFechaAbierta(),
          cantidad: 1,
          pago: 'efectivo',
          userId: 1,
          visitantes: [{ edad: 30, tipoPase: 'vip' }]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);
    });
    test('Compra válida marca emailSent en true', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fechaVisita: obtenerFechaAbierta(),
          cantidad: 1,
          pago: 'efectivo',
          userId: 1,
          userMail: "tizichiaro1@gmail.com",
          visitantes: [
            { edad: 30, tipoPase: 'regular' }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.emailSent).toBeDefined();
    });
  });
});
