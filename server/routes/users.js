const express = require('express');
const { query } = require('../config/database');
const { asyncErrorHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, asyncErrorHandler(async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, created_at, updated_at, last_login FROM users WHERE id = $1',
      [req.user.userId]
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
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
}));

// Actualizar perfil del usuario
router.put('/profile', authenticateToken, asyncErrorHandler(async (req, res) => {
  const { username, email } = req.body;

  // Validación básica
  if (!username || !email) {
    return res.status(400).json({
      error: true,
      message: 'Username y email son requeridos'
    });
  }

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({
      error: true,
      message: 'El username debe tener entre 3 y 50 caracteres'
    });
  }

  if (email.length < 5 || email.length > 100) {
    return res.status(400).json({
      error: true,
      message: 'El email debe tener entre 5 y 100 caracteres'
    });
  }

  try {
    // Verificar si el username o email ya están en uso por otro usuario
    const existingUser = await query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, req.user.userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'El username o email ya está en uso por otro usuario'
      });
    }

    // Actualizar perfil (consulta parametrizada)
    const result = await query(
      'UPDATE users SET username = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, username, email, updated_at',
      [username, email, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
}));

// Obtener lista de usuarios (solo para administradores)
router.get('/', authenticateToken, asyncErrorHandler(async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const adminCheck = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({
        error: true,
        message: 'Acceso denegado: se requieren privilegios de administrador'
      });
    }

    // Obtener lista de usuarios (consulta parametrizada con paginación)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, username, email, is_active, created_at, last_login 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Obtener total de usuarios
    const countResult = await query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      users: result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      })),
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}));

// Obtener usuario específico por ID (solo para administradores)
router.get('/:id', authenticateToken, asyncErrorHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      error: true,
      message: 'ID de usuario inválido'
    });
  }

  try {
    // Verificar si el usuario es administrador o está consultando su propio perfil
    if (req.user.userId !== userId) {
      const adminCheck = await query(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
        return res.status(403).json({
          error: true,
          message: 'Acceso denegado: solo puedes ver tu propio perfil'
        });
      }
    }

    // Obtener usuario (consulta parametrizada)
    const result = await query(
      'SELECT id, username, email, is_active, created_at, updated_at, last_login FROM users WHERE id = $1',
      [userId]
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
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}));

// Desactivar cuenta del usuario
router.delete('/profile', authenticateToken, asyncErrorHandler(async (req, res) => {
  try {
    // Desactivar cuenta (consulta parametrizada)
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente'
    });

  } catch (error) {
    console.error('Error al desactivar cuenta:', error);
    throw error;
  }
}));

module.exports = router;
