const { Pool } = require('pg');

// Configuración del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000, // timeout de conexión de 2 segundos
  maxUses: 7500, // reciclar conexiones después de 7500 queries
});

// Eventos del pool
pool.on('connect', (client) => {
  console.log('🔌 Nueva conexión a PostgreSQL establecida');
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

pool.on('remove', (client) => {
  console.log('🔌 Cliente removido del pool de PostgreSQL');
});

// Función para conectar a la base de datos
async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida exitosamente');
    
    // Verificar que el usuario tiene los privilegios mínimos
    const result = await client.query(`
      SELECT 
        current_user,
        current_database(),
        has_table_privilege(current_user, 'users', 'SELECT') as can_select_users,
        has_table_privilege(current_user, 'users', 'INSERT') as can_insert_users,
        has_table_privilege(current_user, 'users', 'UPDATE') as can_update_users,
        has_table_privilege(current_user, 'users', 'DELETE') as can_delete_users
    `);
    
    console.log('🔐 Privilegios del usuario:', result.rows[0]);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error);
    throw error;
  }
}

// Función para ejecutar queries de forma segura
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log de queries (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query ejecutada:', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en query:', { text, params, error: error.message });
    throw error;
  }
}

// Función para obtener un cliente del pool
async function getClient() {
  return await pool.connect();
}

// Función para cerrar el pool
async function closePool() {
  await pool.end();
}

module.exports = {
  connectDB,
  query,
  getClient,
  closePool,
  pool
};
