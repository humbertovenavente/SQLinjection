# 🛡️ SQL Injection Demo - Proyecto Educativo de Seguridad

> **Demo educativa de SQL Injection con prevención**: React + Node.js + PostgreSQL. Consultas parametrizadas, introspección segura y simulaciones controladas para aprender sobre seguridad web.

## 🎯 Propósito

Este proyecto demuestra las **mejores prácticas de seguridad** para prevenir SQL Injection en aplicaciones web modernas, mientras proporciona una experiencia educativa interactiva para desarrolladores y estudiantes de seguridad.

## 🏗️ Stack Tecnológico

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL con usuario de **mínimos privilegios**
- **Driver**: `pg` (node-postgres)
- **Validación**: `zod` + `express-validator`
- **Seguridad**: `helmet`, `express-rate-limit`, `cors`
- **Autenticación**: JWT + bcrypt
- **Variables de entorno**: `dotenv`
- **Logging**: `morgan`
- **Migraciones**: `node-pg-migrate`

### Frontend (React + Vite)
- **Framework**: React 18
- **Build tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🔒 Características de Seguridad

### Prevención de SQL Injection
- ✅ **Consultas parametrizadas** en todas las operaciones de BD
- ✅ **Validación de entrada** con Zod y express-validator
- ✅ **Sanitización** de datos de entrada
- ✅ **Escape automático** de caracteres peligrosos
- ✅ **Logging de intentos sospechosos**

### Seguridad Web
- ✅ **Helmet.js** para headers de seguridad
- ✅ **CORS** configurado correctamente
- ✅ **Rate limiting** por IP y usuario
- ✅ **Content Security Policy** (CSP)
- ✅ **XSS Protection** headers
- ✅ **CSRF Protection** (JWT tokens)

### Autenticación y Autorización
- ✅ **JWT tokens** con expiración
- ✅ **Bcrypt** para hash de contraseñas
- ✅ **Bloqueo de cuentas** después de intentos fallidos
- ✅ **Middleware de autenticación** robusto
- ✅ **Control de acceso basado en roles**

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd SQLinjection
```

### 2. Configurar la base de datos
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos y usuario
CREATE DATABASE sqli_demo;
CREATE USER sqli_user WITH PASSWORD 'Unis2025';
GRANT CONNECT ON DATABASE sqli_demo TO sqli_user;
GRANT USAGE ON SCHEMA public TO sqli_user;
GRANT CREATE ON SCHEMA public TO sqli_user;
```

### 3. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp server/env.example server/.env

# Editar .env con tus valores
DATABASE_URL=postgres://sqli_user:Unis2025@localhost:5432/sqli_demo
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
```

### 4. Instalar dependencias
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del servidor
cd server && npm install

# Instalar dependencias del cliente
cd ../client && npm install
```

### 5. Poblar la base de datos
```bash
cd ../server
npm run db:seed
```

### 6. Ejecutar el proyecto
```bash
# Desde la raíz del proyecto
npm run dev
```

El proyecto estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📚 Uso Educativo

### Modo Seguro vs Vulnerable
El proyecto incluye un **feature flag** educativo que permite cambiar entre:

- **`MODE=secure`**: Todas las consultas son parametrizadas (por defecto)
- **`MODE=preview_vulnerable`**: Muestra cómo se verían consultas vulnerables, pero **NO las ejecuta**

### Ejemplos de Consultas Seguras
```javascript
// ❌ VULNERABLE (NO usar)
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ SEGURO (Siempre usar)
const query = 'SELECT * FROM users WHERE username = $1';
const result = await client.query(query, [username]);
```

### Endpoints de Demo
- `GET /api/demo/search?q=term&mode=secure` - Búsqueda segura
- `GET /api/demo/filter?status=true&role=admin` - Filtros seguros
- `POST /api/demo/user` - Creación segura de usuarios
- `PUT /api/demo/user/:id` - Actualización segura
- `DELETE /api/demo/user/:id` - Eliminación segura (soft delete)

## 🧪 Testing

### Ejecutar tests del servidor
```bash
cd server
npm test
```

### Ejecutar tests del cliente
```bash
cd client
npm test
```

## 📊 Estructura del Proyecto

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

## 🔑 Credenciales de Prueba

Después de ejecutar el seed:
- **Admin**: `admin@demo.com` / `Admin123!`
- **Usuario**: `usuario1@demo.com` / `User123!`

## 🚨 Advertencias de Seguridad

⚠️ **IMPORTANTE**: Este proyecto es **SOLO para fines educativos**. 

- **NO** usar en producción sin revisión de seguridad
- **NO** exponer a internet sin configuración adicional
- **SIEMPRE** usar consultas parametrizadas en aplicaciones reales
- **SIEMPRE** validar y sanitizar entrada de usuario

## 📖 Recursos de Aprendizaje

- [OWASP SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa los issues existentes
2. Crea un nuevo issue con detalles del problema
3. Incluye logs de error y pasos para reproducir

---

**🔒 Recuerda: La seguridad es responsabilidad de todos los desarrolladores. ¡Mantén tu código seguro!**
