## 📦 Instalar dependencias principales
npm i express dotenv

## 🧪 Instalar dependencias de desarrollo (testing y herramientas)
npm i -D jest supertest nodemon cross-env

## 🔄 Asegurar instalación completa
npm i

## 🚀 Ejecución del servidor
npm run dev

## 🧾 Ejecutar pruebas
npm test

## 📁 Estructura básica del proyecto

```bash
src/
├── app.js                 # Configuración principal de Express
├── server.js              # Punto de entrada del backend
├── controllers/           # Lógica de negocio (User / Ticket)
└── routes/                # Endpoints de la API
tests/
└── *.test.js              # Pruebas automatizadas con Jest

