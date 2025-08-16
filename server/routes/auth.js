const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  validateSchema 
} = require('../validators/auth');
const { asyncErrorHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Registro de usuario
router.post('/register', validateSchema(registerSchema), asyncErrorHandler(async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Verificar si el usuario ya existe (consulta parametrizada)
    const existingUser = await query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'El nombre de usuario o email ya está en uso'
      });
    }

    // Hash de la contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario (consulta parametrizada)
    const result = await query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username,
        email: newUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
}));

// Login de usuario
router.post('/login', validateSchema(loginSchema), asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email (consulta parametrizada)
    const result = await query(
      'SELECT id, username, email, password_hash, is_active, login_attempts, last_login_attempt FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar si la cuenta está bloqueada
    if (user.login_attempts >= 5) {
      const lockoutTime = 15 * 60 * 1000; // 15 minutos
      const timeSinceLastAttempt = Date.now() - new Date(user.last_login_attempt).getTime();
      
      if (timeSinceLastAttempt < lockoutTime) {
        return res.status(423).json({
          error: true,
          message: 'Cuenta temporalmente bloqueada. Intenta de nuevo en 15 minutos.'
        });
      } else {
        // Resetear intentos después del tiempo de bloqueo
        await query(
          'UPDATE users SET login_attempts = 0 WHERE id = $1',
          [user.id]
        );
      }
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Incrementar contador de intentos fallidos
      await query(
        'UPDATE users SET login_attempts = login_attempts + 1, last_login_attempt = NOW() WHERE id = $1',
        [user.id]
      );

      return res.status(401).json({
        error: true,
        message: 'Credenciales inválidas'
      });
    }

    // Resetear contador de intentos fallidos
    await query(
      'UPDATE users SET login_attempts = 0, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}));

// Cambio de contraseña
router.post('/change-password', validateSchema(changePasswordSchema), asyncErrorHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token de autenticación requerido'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener usuario actual
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: true,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña (consulta parametrizada)
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expirado'
      });
    }
    
    console.error('Error en cambio de contraseña:', error);
    throw error;
  }
}));

// Verificar token
router.get('/verify', asyncErrorHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token de autenticación requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información actualizada del usuario
    const result = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expirado'
      });
    }
    
    console.error('Error en verificación de token:', error);
    throw error;
  }
}));

module.exports = router;
