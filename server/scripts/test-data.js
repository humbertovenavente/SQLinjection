const { query } = require('../config/database');

async function insertTestData() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Insertar usuarios de prueba
    const users = [
      { username: 'admin', email: 'admin@demo.com', password: 'admin123' },
      { username: 'usuario1', email: 'user1@demo.com', password: 'user123' },
      { username: 'usuario2', email: 'user2@demo.com', password: 'user456' },
      { username: 'test_user', email: 'test@demo.com', password: 'test123' },
      { username: 'demo_user', email: 'demo@demo.com', password: 'demo123' }
    ];

    console.log('📝 Insertando usuarios de prueba...');
    
    for (const user of users) {
      try {
        await query(
          'INSERT INTO users (username, email, password_hash, is_active, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT (username) DO NOTHING',
          [user.username, user.email, user.password, true, user.username === 'admin', new Date()]
        );
        console.log(`✅ Usuario ${user.username} insertado`);
      } catch (error) {
        if (error.code === '23505') { // Unique violation
          console.log(`ℹ️  Usuario ${user.username} ya existe`);
        } else {
          console.error(`❌ Error insertando usuario ${user.username}:`, error.message);
        }
      }
    }

    // Verificar datos
    const result = await query('SELECT COUNT(*) FROM users');
    console.log(`📊 Total de usuarios en la base de datos: ${result.rows[0].count}`);

    // Mostrar algunos usuarios
    const sampleUsers = await query('SELECT username, email, is_admin FROM users ');
    console.log('👥 Usuarios de muestra:');
    sampleUsers.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) ${user.is_admin ? '[ADMIN]' : ''}`);
    });

    console.log('✅ Datos de prueba insertados correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

insertTestData();
