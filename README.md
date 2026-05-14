# Finnix CRM

CRM interno de Finnix — Consultoría Integral para PyMEs.

## Stack

- **Frontend:** React + Vite
- **Auth:** Firebase Authentication (email/password)
- **Base de datos:** Firebase Firestore
- **Deploy:** Vercel

---

## Setup paso a paso

### 1. Crear proyecto en Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear nuevo proyecto → nombre: `finnix-crm`
3. Ir a **Authentication** → Comenzar → Habilitar proveedor **Email/contraseña**
4. Ir a **Firestore Database** → Crear base de datos → Modo **producción**
5. Ir a **Configuración del proyecto** → **Tus apps** → Agregar app web
6. Copiar los datos de configuración

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto (copiar de `.env.example`):

```
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### 3. Crear usuario en Firebase Auth

En la consola de Firebase → Authentication → Users → Agregar usuario:
- Email: `tu@email.com`
- Contraseña: la que quieras (mínimo 6 caracteres)

### 4. Reglas de Firestore

En Firestore → Reglas, pegar esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Instalar y correr localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173)

---

## Deploy en Vercel

### Opción A: Desde GitHub (recomendado)

1. Subir el proyecto a un repositorio en GitHub
2. Ir a [vercel.com](https://vercel.com) → New Project
3. Importar el repositorio
4. En **Environment Variables**, agregar todas las variables del `.env`
5. Click en **Deploy** — listo

### Opción B: CLI de Vercel

```bash
npm i -g vercel
vercel
```

---

## Colecciones en Firestore

### `clientes`
```
nombre, empresa, cuit, email, whatsapp, localidad,
condicion_fiscal, plan, precio_usd, estado, actividad,
notas_internas, created_at
```

### `vencimientos`
```
cliente_id, cliente_nombre, tipo, descripcion,
fecha_vencimiento, estado, monto, notas, created_at
```

### `facturas`
```
cliente_id, cliente_nombre, periodo, monto_usd, tc,
monto_ars, fecha_emision, fecha_venc_cobro, estado,
medio_cobro, notas, created_at
```

### `notas`
```
cliente_id, cliente_nombre, tipo, texto, fecha, created_at
```

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| 📊 Dashboard | Stats generales: clientes, MRR, próximos vencimientos |
| 👥 Clientes | CRUD completo con filtros por estado y plan |
| 📅 Vencimientos | Control de obligaciones fiscales con alertas |
| 💰 Facturación | Registro de cobros con cálculo USD→ARS automático |
| 📝 Notas | Notas por cliente con tipos y búsqueda |

---

Finnix CRM © 2025 — Uso exclusivo del equipo
