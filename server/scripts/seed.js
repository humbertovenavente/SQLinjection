// Datos de Prueba para la base de datos

const { query } = require('../config/database');
require('dotenv').config();

async function seedDatabase() {
  try {
    console.log('Iniciando población de base de datos...');

    // Crear tabla de usuarios si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false,
        login_attempts INTEGER DEFAULT 0,
        last_login_attempt TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);

    // Crear tabla de permisos si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        permissions TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Crear índices para mejorar rendimiento
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at)');

    console.log('Tablas creadas/verificadas exitosamente');

    // Verificar si ya hay usuarios
    const existingUsers = await query('SELECT COUNT(*) FROM users');
    
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('ℹ  La base de datos ya tiene usuarios. Saltando población...');
      return;
    }

    // Crear usuarios de ejemplo
    const users = [
      {
        username: 'admin',
        email: 'admin@email.com',
        password: 'Admin123!',
        isAdmin: true
      },
      {
        username: 'usuario1',
        email: 'usuario1@email.com',
        password: 'User123!',
        isAdmin: false
      },
      {
        username: 'usuario2',
        email: 'usuario2@email.com',
        password: 'User123!',
        isAdmin: false
      },
      {
        username: 'test_user',
        email: 'test@email.com',
        password: 'Test123!',
        isAdmin: false
      },
      {
        username: 'demo_user',
        email: 'demo@email.com',
        password: 'Demo123!',
        isAdmin: false
      }
    ];

    console.log('Creando usuarios de ejemplo...');

    for (const user of users) {
      // Hash de la contraseña
      const bcrypt = require('bcryptjs');
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      // Insertar usuario
      const result = await query(
        'INSERT INTO users (username, email, password_hash, is_admin, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
        [user.username, user.email, hashedPassword, user.isAdmin]
      );

      const userId = result.rows[0].id;

      // Crear permisos básicos
      const permissions = user.isAdmin 
        ? ['read', 'write', 'delete', 'admin']
        : ['read', 'write'];

      await query(
        'INSERT INTO user_permissions (user_id, permissions) VALUES ($1, $2)',
        [userId, permissions]
      );

      console.log(` Usuario creado: ${user.username} (${user.isAdmin ? 'Admin' : 'User'})`);
    }

    
    console.log('Creando usuarios adicionales para demostración...');

    for (const username of additionalUsers) {
      const email = `${username.replace('_', '.')}@demo.com`;
      const password = 'Demo123!';
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await query(
        'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
        [username, email, hashedPassword]
      );

      const userId = result.rows[0].id;

      await query(
        'INSERT INTO user_permissions (user_id, permissions) VALUES ($1, $2)',
        [userId, ['read', 'write']]
      );

      console.log(`Usuario adicional creado: ${username}`);
    }

    console.log('Base de datos poblada exitosamente!');
    console.log('\n Resumen:');
    console.log(`   - Total de usuarios: ${users.length + additionalUsers.length}`);
    console.log(`   - Administradores: ${users.filter(u => u.isAdmin).length}`);
    console.log(`   - Usuarios: ${users.filter(u => !u.isAdmin).length + additionalUsers.length}`);
    console.log('\n Credenciales de prueba:');
    console.log('   Admin: admin@email.com / Admin123!');
    console.log('   Usuario: usuario1@demo.com / User123!');

  } catch (error) {
    console.error('rror al poblar la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log(' Script de datos de prueba completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en script de datos de prueba:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
