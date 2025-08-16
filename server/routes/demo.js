const express = require('express');
const { query } = require('../config/database');
const { asyncErrorHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Variable global para el modo (en producción esto debería estar en la base de datos)
let currentMode = process.env.MODE || 'secure';

// Ruta para cambiar el modo de seguridad
router.post('/toggle-mode', asyncErrorHandler(async (req, res) => {
  try {
    // Cambiar entre modos
    currentMode = currentMode === 'secure' ? 'preview_vulnerable' : 'secure';
    
    // Actualizar variable de entorno
    process.env.MODE = currentMode;
    
    res.json({
      success: true,
      mode: currentMode,
      message: `Mode changed to: ${currentMode === 'secure' ? 'Secure' : 'Vulnerable'}`
    });
  } catch (error) {
    console.error('Error changing mode:', error);
    throw error;
  }
}));

// Ruta para obtener el modo actual
router.get('/current-mode', asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    mode: currentMode,
    message: `Current mode: ${currentMode === 'secure' ? 'Secure' : 'Vulnerable'}`
  });
}));

// Demo de búsqueda segura vs vulnerable
router.get('/search', asyncErrorHandler(async (req, res) => {
  const { q: searchTerm, mode = currentMode } = req.query;
  
  if (!searchTerm) {
    return res.status(400).json({
      error: true,
      message: 'Search term required'
    });
  }

  try {
    let result;
    let message;
    let executedSQL = '';
    
    if (mode === 'secure') {
      // Modo seguro: usar consultas parametrizadas
      
      try {
        // Ejecutar la consulta segura y obtener resultados reales
        const result = await query(
          'SELECT id, username, email, created_at FROM users WHERE username ILIKE $1 OR email ILIKE $1',
          [`%${searchTerm}%`]
        );
        
        const executedSQL = `SELECT id, username, email, created_at FROM users WHERE username ILIKE $1 OR email ILIKE $1`;
        const message = 'Query executed securely with parameterized parameters';
        
        // Formatear resultados para mostrar
        const formattedResults = result.rows.map(row => ({
          id: row.id,
          username: row.username,
          email: row.email,
          created_at: row.created_at
        }));
        
        res.json({
          success: true,
          mode: mode,
          searchTerm: searchTerm,
          attackType: 'secure_query',
          results: formattedResults,
          totalResults: result.rows.length,
          message: message,
          executedSQL: executedSQL,
          rawResults: result.rows, // Mostrar resultados reales
          // Información adicional para modo seguro
          secureInfo: {
            queryExecuted: executedSQL,
            parametersUsed: [`%${searchTerm}%`],
            securityMeasures: [
              'Parameterized parameters',
              'Input validation',
              'Escape of special characters',
              'SQL Injection prevention'
            ],
            explanation: 'This query was executed securely using parameterized parameters that prevent SQL Injection attacks.',
            actualResults: result.rows.length > 0 ? 'Real results were found in the database' : 'No matches found for this search term'
          }
        });
        
      } catch (error) {
        console.error('Error in secure query:', error);
        res.status(500).json({
          error: true,
          message: 'Error executing secure query',
          details: error.message
        });
      }
      
      return; // TODO: Remove this
    } else if (mode === 'preview_vulnerable') {
      // MODO VULNERABLE: Ejecutar SQL real para demostrar el riesgo
      try {
        
        if (searchTerm.includes('CREATE TABLE')) {
          
          try {
            // Ejecutar realmente el CREATE TABLE - Limpiar el SQL correctamente
            let createTableSQL = searchTerm;
            if (createTableSQL.includes("'; ")) {
              createTableSQL = createTableSQL.split("'; ")[1];
            }
            if (createTableSQL.includes(" --")) {
              createTableSQL = createTableSQL.split(" --")[0];
            }
            
            await query(createTableSQL);
            
            // Verificar que la tabla se creó
            const tableName = createTableSQL.match(/CREATE TABLE (\w+)/i)?.[1] || 'unknown_table';
            const checkSQL = `SELECT table_name FROM information_schema.tables WHERE table_name = '${tableName}'`;
            const checkResult = await query(checkSQL);
            
            const vulnerableSQL = `SELECT 1 as id, 'CREATE TABLE executed' as username, 'Table created successfully' as email, NOW()::text as created_at UNION ALL SELECT 999, 'Table exists: ' || (checkResult.rows.length > 0 ? 'YES' : 'NO'), '${tableName}', NOW()::text --`;
            
            result = await query(vulnerableSQL);
            executedSQL = createTableSQL;
            message = 'Create Table Attack executed - Table created';
            
          } catch (error) {
            // Fallback a consulta segura si falla
            const fallbackSQL = "SELECT id, username, email, created_at FROM users ";
            result = await query(fallbackSQL);
            executedSQL = fallbackSQL;
            message = 'Create Table Attack failed - Secure query executed';
          }
          
        } else if (searchTerm.includes('INSERT INTO')) {
          
          try {
            // Crear un INSERT simple y único para evitar conflictos
            const timestamp = Date.now();
            const uniqueUsername = `hacker_${timestamp}`;
            const uniqueEmail = `hacker_${timestamp}@evil.com`;
            
            // Crear el INSERT corregido con campos únicos
            const insertSQL = `INSERT INTO users (username, email, password_hash, created_at) VALUES ('${uniqueUsername}', '${uniqueEmail}', 'hacked_password_hash', NOW())`;
            
            await query(insertSQL);
            
            // Verificar que se insertó el dato
            const checkSQL = `SELECT username, email FROM users WHERE username = '${uniqueUsername}'`;
            const checkResult = await query(checkSQL);
            
            // Crear el SQL vulnerable sin operadores problemáticos
            const userExists = checkResult.rows.length > 0 ? 'YES' : 'NO';
            const vulnerableSQL = `SELECT 1 as id, 'INSERT executed' as username, 'Data inserted successfully' as email, NOW()::text as created_at UNION ALL SELECT 999, 'User exists: ${userExists}', '${uniqueEmail}', NOW()::text --`;
            
            result = await query(vulnerableSQL);
            executedSQL = insertSQL;
            message = 'Insert Data Attack executed - Data inserted';
            
          } catch (error) {
            // Fallback a consulta segura si falla
            const fallbackSQL = "SELECT id, username, email, created_at FROM users ";
            result = await query(fallbackSQL);
            executedSQL = fallbackSQL;
            message = 'Insert Data Attack failed - Secure query executed';
          }
          
        } else if (searchTerm.includes('DELETE FROM')) {
          
          try {
            // Contar registros antes del DELETE
            const countBefore = await query('SELECT COUNT(*) as count FROM users');
            const beforeCount = countBefore.rows[0].count;
            
            // Ejecutar realmente el DELETE
            const deleteSQL = searchTerm.replace("'; ", "").replace(" --", "");
            await query(deleteSQL);
            
            // Contar registros después del DELETE
            const countAfter = await query('SELECT COUNT(*) as count FROM users');
            const afterCount = countAfter.rows.length;
            
            // Crear el SQL vulnerable sin operadores problemáticos
            const recordsDeleted = beforeCount - afterCount;
            const vulnerableSQL = `SELECT 1 as id, 'DELETE executed' as username, 'Records deleted: ${recordsDeleted}' as email, NOW()::text as created_at UNION ALL SELECT 999, 'Before: ${beforeCount}', 'After: ${afterCount}', NOW()::text --`;
            
            result = await query(vulnerableSQL);
            executedSQL = deleteSQL;
            message = 'Delete Data Attack executed - Data deleted';
            
          } catch (error) {
            // Fallback a consulta segura si falla
            const fallbackSQL = "SELECT id, username, email, created_at FROM users ";
            result = await query(fallbackSQL);
            executedSQL = fallbackSQL;
            message = 'Delete Data Attack failed - Secure query executed';
          }
          
        } else if (searchTerm.includes('DROP TABLE')) {
          
          try {
            // Verificar que la tabla existe antes
            const checkBefore = await query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'users'`);
            const tableExists = checkBefore.rows.length > 0;
            
            if (tableExists) {
              // Ejecutar realmente el DROP TABLE
              const dropSQL = searchTerm.replace("'; ", "").replace(" --", "");
              await query(dropSQL);
              
              // Verificar que la tabla se eliminó
              const checkAfter = await query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'users'`);
              const tableDropped = checkAfter.rows.length === 0;
              
              const vulnerableSQL = `SELECT 1 as id, 'DROP TABLE executed' as username, 'Table dropped: ${tableDropped ? 'YES' : 'NO'}' as email, NOW()::text as created_at UNION ALL SELECT 999, 'Before: EXISTS', 'After: ${tableDropped ? 'NOT EXISTS' : 'STILL EXISTS'}', NOW()::text --`;
              
              result = await query(vulnerableSQL);
              executedSQL = dropSQL;
              message = 'Drop Table Attack executed - Table dropped successfully';
            } else {
              const vulnerableSQL = `SELECT 1 as id, 'DROP TABLE failed' as username, 'Table users does not exist' as email, NOW()::text as created_at`;
              result = await query(vulnerableSQL);
              executedSQL = searchTerm;
              message = 'Drop Table Attack failed - Table does not exist in the database';
            }
            
          } catch (error) {
            console.log('Error en DROP TABLE:', error.message);
            const vulnerableSQL = `SELECT 1 as id, 'DROP TABLE failed' as username, '${error.message}' as email, NOW()::text as created_at`;
            result = await query(vulnerableSQL);
            executedSQL = searchTerm;
            message = 'Drop Table Attack failed - Table does not exist in the database';
          }
          
        } else if (searchTerm.includes('UPDATE')) {
          
          try {
            // Contar registros antes del UPDATE
            const countBefore = await query('SELECT COUNT(*) as count FROM users');
            const beforeCount = countBefore.rows.length;
            
            // Generar un email único para evitar conflictos
            const timestamp = Date.now();
            const uniqueEmail = `hacked_${timestamp}@evil.com`;
            
            // Crear el UPDATE con email único
            const updateSQL = `UPDATE users SET email = '${uniqueEmail}' WHERE id = 1`;
            
            const updateResult = await query(updateSQL);
            
            // Contar registros afectados después del UPDATE
            const countAfter = await query(`SELECT COUNT(*) as count FROM users WHERE email = '${uniqueEmail}'`);
            const afterCount = countAfter.rows.length;
            
            // Crear el SQL vulnerable sin operadores problemáticos
            const recordsUpdated = updateResult.rowCount || 0;
            const vulnerableSQL = `SELECT 1 as id, 'UPDATE executed' as username, 'Records updated: ${recordsUpdated}' as email, NOW()::text as created_at UNION ALL SELECT 999, 'Before: ${beforeCount}', 'After: ${afterCount}', NOW()::text --`;
            
            result = await query(vulnerableSQL);
            executedSQL = updateSQL;
            message = 'Update Attack executed - Data updated';
            
          } catch (error) {
            console.log('Error en UPDATE:', error.message);
            const vulnerableSQL = `SELECT 1 as id, 'UPDATE failed' as username, '${error.message}' as email, NOW()::text as created_at`;
            result = await query(vulnerableSQL);
            executedSQL = searchTerm;
            message = 'Update Attack failed - Data not updated';
          }
          
        } else if (searchTerm.includes('information_schema.tables')) {
          
          // Para ataques de schema discovery - Tablas - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, table_name as username, table_schema as email, table_type as created_at FROM information_schema.tables WHERE table_schema = 'public' UNION ALL SELECT 999, table_name, table_schema, table_type FROM information_schema.tables WHERE table_schema = 'public' --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'Schema Discovery - Tables executed successfully';
          
        } else if (searchTerm.includes('information_schema.columns')) {
          
          // Para ataques de schema discovery - Columnas - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, column_name as username, data_type as email, is_nullable as created_at FROM information_schema.columns WHERE table_name = 'users' UNION ALL SELECT 999, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'Schema Discovery - Columns executed successfully';
          
        } else if (searchTerm.includes('pg_user')) {
          
          // Para ataques de enumeración de usuarios del sistema - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, usename as username, usesysid::text as email, usecreatedb::text as created_at FROM pg_user UNION ALL SELECT 999, usename, usesysid::text, usecreatedb::text FROM pg_user --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'User Enumeration executed';
          
        } else if (searchTerm.includes('pg_database_size')) {
          
          // Para ataques de estadísticas de base de datos - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, pg_size_pretty(pg_database_size(current_database())) as username, current_database() as email, NOW()::text as created_at UNION ALL SELECT 999, pg_size_pretty(pg_database_size(current_database())), current_database(), NOW()::text --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'Database Stats executed';
          
        } else if (searchTerm.includes('has_table_privilege')) {
          
          // Para ataques de verificación de privilegios - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, has_table_privilege(current_user, 'users', 'SELECT')::text as username, 'users' as email, 'SELECT' as created_at UNION ALL SELECT 999, has_table_privilege(current_user, 'users', 'SELECT')::text, 'users', 'SELECT' --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'Privilege Check executed';
          
        } else if (searchTerm.includes('information_schema')) {
          
          // Para ataques de schema discovery general - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, table_name as username, column_name as email, data_type as created_at FROM information_schema.columns WHERE table_name = 'users' UNION ALL SELECT 999, table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'users' --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'Schema Discovery executed';
          
        } else if (searchTerm.includes('version()') || searchTerm.includes('current_database') || searchTerm.includes('current_user')) {
          
          // Para ataques de información del sistema - Consulta corregida
          const vulnerableSQL = `SELECT 1 as id, version() as username, current_database() as email, current_user as created_at UNION ALL SELECT 999, version(), current_database(), current_user --`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'System Info Attack executed';
          
        } else if (searchTerm.includes('UNION')) {
          
          try {
            // Ejecutar realmente el UNION attack
            const vulnerableSQL = searchTerm.replace("'; ", "").replace(" --", "");
            result = await query(vulnerableSQL);
            executedSQL = vulnerableSQL;
            message = 'UNION Attack executed';
            
          } catch (error) {
            console.log('Error en UNION:', error.message);
            // Fallback a consulta segura si falla
            const fallbackSQL = "SELECT id, username, email, created_at FROM users ";
            result = await query(fallbackSQL);
            executedSQL = fallbackSQL;
            message = 'UNION Attack failed - Secure query executed';
          }
          
        } else if (searchTerm.startsWith('SELECT')) {
          
          try {
            result = await query(searchTerm);
            executedSQL = searchTerm;
            message = 'SELECT query executed';
          } catch (selectError) {
            if (searchTerm.includes('version()') || searchTerm.includes('current_database') || searchTerm.includes('current_user')) {
              const verySimpleSQL = 'SELECT version() as version_info, current_database() as db_name, current_user as user_name';
              result = await query(verySimpleSQL);
              executedSQL = verySimpleSQL;
              message = 'System Info executed';
            } else {
              // Intentar extraer el campo de la consulta SELECT
              const fieldMatch = searchTerm.match(/SELECT\s+(.+?)\s+FROM/i);
              if (fieldMatch) {
                const field = fieldMatch[1].trim();
                const simpleSQL = `SELECT ${field} FROM users `;
                result = await query(simpleSQL);
                executedSQL = simpleSQL;
                  message = 'SELECT query executed';
              } else {
                // Fallback final
                const fallbackSQL = 'SELECT id, username, email, created_at FROM users ';
                result = await query(fallbackSQL);
                executedSQL = fallbackSQL;
                message = 'Fallback query executed';
              }
            }
          }
          
        } else {
          // No es un ataque específico - usar búsqueda normal pero vulnerable
          const vulnerableSQL = `SELECT id, username, email, created_at FROM users WHERE username ILIKE '%${searchTerm}%' OR email ILIKE '%${searchTerm}%' ORDER BY created_at DESC LIMIT 10`;
          
          result = await query(vulnerableSQL);
          executedSQL = vulnerableSQL;
          message = 'Vulnerable search executed';
        }
      } catch (sqlError) {
        console.error('Error en consulta vulnerable:', sqlError);
        
        // Si falla la consulta vulnerable, ejecutar la segura como fallback
        const fallbackSQL = 'SELECT id, username, email, created_at FROM users WHERE username ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT 10';
        result = await query(fallbackSQL, [`%${searchTerm}%`]);
        
        executedSQL = fallbackSQL;
        message = 'Vulnerable query failed, executing secure query as fallback';
      }
      
    } else {
      return res.status(400).json({
        error: true,
        message: 'Invalid mode. Use "secure" or "preview_vulnerable"'
      });
    }

    // Preparar resultados para diferentes tipos de ataques
    let formattedResults = [];
    let attackType = 'normal';
    
    if (mode === 'preview_vulnerable') {
      if (searchTerm.includes('information_schema.tables')) {
        // Para ataques de schema discovery - Tablas
        attackType = 'schema_discovery_tables';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'Table Info',
          tableName: row.username || 'N/A', // username es el alias de table_name
          schema: row.email || 'N/A',       // email es el alias de table_schema
          type: row.created_at || 'N/A',    // created_at es el alias de table_type
          extra: row
        }));
      } else if (searchTerm.includes('information_schema.columns')) {
        // Para ataques de schema discovery - Columnas
        attackType = 'schema_discovery_columns';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'Column Info',
          columnName: row.username || 'N/A', // username es el alias de column_name
          dataType: row.email || 'N/A',      // email es el alias de data_type
          nullable: row.created_at || 'N/A', // created_at es el alias de is_nullable
          extra: row
        }));
      } else if (searchTerm.includes('pg_user')) {
        // Para ataques de enumeración de usuarios del sistema
        attackType = 'user_enumeration';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'System User',
          username: row.username || 'N/A',
          userID: row.email || 'N/A',        // email es el alias de usesysid
          canCreateDB: row.created_at || 'N/A', // created_at es el alias de usecreatedb
          extra: row
        }));
      } else if (searchTerm.includes('pg_database_size')) {
        // Para ataques de estadísticas de base de datos
        attackType = 'database_stats';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'DB Stats',
          databaseSize: row.username || 'N/A',    // username es el alias de pg_size_pretty
          databaseName: row.email || 'N/A',       // email es el alias de current_database
          timestamp: row.created_at || 'N/A',     // created_at es el alias de NOW()
          extra: row
        }));
      } else if (searchTerm.includes('has_table_privilege')) {
        // Para ataques de verificación de privilegios
        attackType = 'privilege_check';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'Privilege Info',
          hasSelect: row.username || 'N/A',       // username es el alias de has_table_privilege
          tableName: row.email || 'N/A',          // email es el alias de 'users'
          privilege: row.created_at || 'N/A',     // created_at es el alias de 'SELECT'
          extra: row
        }));
      } else if (searchTerm.includes('version()') || searchTerm.includes('current_database') || searchTerm.includes('current_user')) {
        // Para ataques de información del sistema
        attackType = 'system_info';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'System Info',
          version: row.username || 'N/A',         // username es el alias de version()
          database: row.email || 'N/A',           // email es el alias de current_database()
          user: row.created_at || 'N/A',          // created_at es el alias de current_user()
          extra: row
        }));
      } else if (searchTerm.includes('CREATE TABLE') || searchTerm.includes('INSERT INTO') || searchTerm.includes('DELETE FROM') || searchTerm.includes('DROP TABLE') || searchTerm.includes('UPDATE')) {
        // Para ataques de manipulación de datos
        attackType = 'data_manipulation';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'Attack Info',
          attackType: row.username || 'N/A',      // username es el alias del tipo de ataque
          description: row.email || 'N/A',        // email es el alias de la descripción
          timestamp: row.created_at || 'N/A',     // created_at es el alias del timestamp
          extra: row
        }));
      } else if (searchTerm.includes('UNION')) {
        // Para ataques UNION generales
        attackType = 'union_attack';
        formattedResults = result.rows.map(row => ({
          id: row.id || 'N/A',
          username: row.username || 'N/A',
          email: row.email || 'N/A',
          createdAt: row.created_at || 'N/A',
          extra: row
        }));
      } else {
        // Para consultas vulnerables normales
        attackType = 'basic_vulnerable';
        formattedResults = result.rows.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at
        }));
      }
    } else {
      // Para consultas seguras
      attackType = 'secure_query';
      formattedResults = result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      }));
    }

    res.json({
      success: true,
      mode: mode,
      searchTerm: searchTerm,
      attackType: attackType,
      results: formattedResults,
      totalResults: result.rows.length,
      message: message,
      executedSQL: executedSQL,
      rawResults: mode === 'preview_vulnerable' ? result.rows : undefined,
      // Agregar información adicional para modo seguro
      secureInfo: mode === 'secure' ? {
        queryExecuted: executedSQL,
        parametersUsed: [`%${searchTerm}%`],
        securityMeasures: [
          'Parameterized parameters',
          'Input validation',
          'Escape of special characters',
          'SQL Injection prevention'
        ],
        explanation: 'This query was executed securely using parameterized parameters that prevent SQL Injection attacks.'
      } : undefined
    });

  } catch (error) {
    console.error('Error in search:', error);
    
    // Respuesta de error más amigable
    res.status(500).json({
      error: true,
      message: 'Error interno del servidor al procesar la consulta',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      mode: mode,
      searchTerm: searchTerm
    });
  }
}));

// Demo de filtros seguros
router.get('/filter', asyncErrorHandler(async (req, res) => {
  const { status, role, limit = 10, page = 1 } = req.query;
  
  try {
    let whereClause = 'WHERE is_active = true';
    let params = [];
    let paramIndex = 1;

    // Construir WHERE clause de forma segura
    if (status) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(status === 'true');
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND is_admin = $${paramIndex}`;
      params.push(role === 'admin');
      paramIndex++;
    }

    // Paginación segura
    const offset = (parseInt(page) - 1) * parseInt(limit);
    whereClause += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    // Consulta parametrizada
    const result = await query(
      `SELECT id, username, email, is_active, is_admin, created_at FROM users ${whereClause}`,
      params
    );

    // Obtener total de registros
    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE is_active = true`,
      []
    );

    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      filters: { status, role, limit, page },
      results: result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.is_active,
        isAdmin: user.is_admin,
        createdAt: user.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      },
      message: 'Filters applied securely with parameterized parameters'
    });

  } catch (error) {
        console.error('Error in filters:', error);
    throw error;
  }
}));

// Demo de inserción segura
router.post('/user', authenticateToken, asyncErrorHandler(async (req, res) => {
  const { username, email, role = 'user' } = req.body;

  // Validación básica
  if (!username || !email) {
    return res.status(400).json({
      error: true,
      message: 'Username and email are required'
    });
  }

  try {
    // Verificar si el usuario ya existe (consulta parametrizada)
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'El username o email ya está en uso'
      });
    }

    // Insertar usuario (consulta parametrizada)
    const result = await query(
      'INSERT INTO users (username, email, is_admin, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, is_admin, created_at',
      [username, email, role === 'admin']
    );

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User created successfully securely',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin,
        createdAt: newUser.created_at
      },
      securityNote: 'User created using parameterized queries to prevent SQL Injection'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}));

// Demo de actualización segura
router.put('/user/:id', authenticateToken, asyncErrorHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, email, isActive } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid user ID'
    });
  }

  try {
    // Verificar que el usuario existe
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Construir UPDATE de forma segura
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramIndex}`);
      params.push(username);
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No fields provided to update'
      });
    }

    // Agregar ID y timestamp
    params.push(userId);
    updateFields.push('updated_at = NOW()');

    // Ejecutar UPDATE parametrizado
    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, is_active, updated_at`,
      params
    );

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'User updated successfully securely',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.is_active,
        updatedAt: updatedUser.updated_at
      },
      securityNote: 'User updated using parameterized queries to prevent SQL Injection'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}));

// Demo de eliminación segura (soft delete)
router.delete('/user/:id', authenticateToken, asyncErrorHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid user ID'
    });
  }

  try {
    // Soft delete usando UPDATE parametrizado
    const result = await query(
      'UPDATE users SET is_active = false, deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, username',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    const deletedUser = result.rows[0];

    res.json({
      success: true,
      message: 'User deactivated successfully securely',
      user: {
        id: deletedUser.id,
        username: deletedUser.username
      },
      securityNote: 'User deactivated using soft delete and parameterized queries to prevent SQL Injection'
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
}));

// Demo de estadísticas seguras
router.get('/stats', asyncErrorHandler(async (req, res) => {
  try {
    // Múltiples consultas parametrizadas para estadísticas
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM users WHERE is_active = true'),
      query('SELECT COUNT(*) FROM users WHERE is_admin = true'),
      query('SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\'')
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        activeUsers: parseInt(activeUsers.rows[0].count),
        adminUsers: parseInt(adminUsers.rows[0].count),
        recentUsers: parseInt(recentUsers.rows[0].count)
      },
      message: 'Stats generated using parameterized queries to prevent SQL Injection'
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}));

// Ruta para hacer peticiones HTTP externas (solo para fines educativos)
router.get('/external-test', asyncErrorHandler(async (req, res) => {
  const { url, method = 'GET', headers = {} } = req.query;
  
  if (!url) {
    return res.status(400).json({
      error: true,
      message: 'URL required'
    });
  }

  try {
    
    // Hacer petición HTTP a la URL externa
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...headers
      }
    });

    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    res.json({
      success: true,
      url: url,
      method: method,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      size: JSON.stringify(responseData).length,
      message: 'External request executed - ONLY FOR EDUCATIONAL PURPOSES'
    });

  } catch (error) {
    console.error('Error in external request:', error);
    res.status(500).json({
      error: true,
      message: 'Error making external request',
      details: error.message
    });
  }
}));

module.exports = router;
