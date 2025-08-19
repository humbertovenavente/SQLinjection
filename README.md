# SQL Injection - Proyecto de Seguridad Universidad del Istmo

> * React + Node.js + PostgreSQL. Consultas parametrizadas


##  Stack 

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL con usuario de mínimos privilegios
- **Driver**: `pg` (node-postgres)
- **Validación**: `zod` + `express-validator`
- **Seguridad**: `helmet`, `express-rate-limit`, `cors`
- **Autenticación**: JWT + bcrypt
- **Variables de entorno**: `dotenv`
- **Logging**: `morgan`


### Frontend (React + Vite)
- **Framework**: React 18
- **Build tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Styling**: Tailwind CS
- **Notifications**: React Hot Toast

## Características de Seguridad

### Prevención de SQL Injection
- **Consultas parametrizadas** en todas las operaciones de BD
- **Validación de entrada** con Zod y express-validator
- **Sanitización** de datos de entrada
- **Escape automático** de caracteres peligrosos
- **Logging de intentos sospechosos**

### Seguridad Web
- **Helmet.js** para headers de seguridad
- **CORS** configurado correctamente
- **Rate limiting** por IP y usuario
- **Content Security Policy** 
- **XSS Protection** headers
- **JWT tokens** 

### Autenticación y Autorización
-  **JWT tokens** 
-  **Bcrypt** para hash de contraseñas
-   **Middleware de autenticación** robusto
-  **Control de acceso basado en roles**

##  Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn

### 1. Clonar el repositorio

git clone <-repositorio>
cd SQLinjection


### 2. Configurar la base de datos

# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos y usuario
CREATE DATABASE sqli_demo;
CREATE USER sqli_user WITH PASSWORD 'Unis2025';
GRANT CONNECT ON DATABASE sqli_demo TO sqli_user;
GRANT USAGE ON SCHEMA public TO sqli_user;
GRANT CREATE ON SCHEMA public TO sqli_user;


### 3. Configurar variables de entorno

# Copiar archivo de ejemplo
cp server/env.example server/.env

# Editar .env con tus valores
DATABASE_URL=postgres://sqli_user:Unis2025@localhost:5432/sqli_demo
JWT_SECRET=tu_jwt_secret_super_seguro_aqui


### 4. Instalar dependencias

# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del servidor
cd server && npm install

# Instalar dependencias del cliente
cd ../client && npm install


### 5. Poblar la base de datos

cd ../server
npm run db:seed


### 6. Ejecutar el proyecto

# Desde la raíz del proyecto
npm run dev


El proyecto estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000


```

## Arquitectura
```
SQLinjection/
├── server/                 # Backend Node.js
│   ├── config/            # Configuración de BD
│   ├── middleware/        # Middleware de seguridad
│   ├── routes/            # Rutas de la API
│   ├── validators/        # Validación con Zod
│   ├── scripts/           # Scripts de BD
│   └── index.js           # Servidor principal
├── client/                # Frontend React
│   ├── src/               # Código fuente
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias
├── package.json           # Scripts del proyecto
└── README.md              # Este archivo
```

## Recursos de Aprendizaje

- [OWASP SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
