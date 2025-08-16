const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token de autenticación requerido'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    const result = await query(
      'SELECT id, username, email, is_active, is_admin FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: true,
        message: 'Cuenta desactivada'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin
    };

    next();
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
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar si el usuario es administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: true,
      message: 'Acceso denegado: se requieren privilegios de administrador'
    });
  }
  next();
};

// Middleware para verificar si el usuario es propietario del recurso o administrador
const requireOwnerOrAdmin = (resourceOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'No autenticado'
      });
    }

    // Permitir si es administrador o propietario del recurso
    if (req.user.isAdmin || req.user.userId === resourceOwnerId) {
      return next();
    }

    return res.status(403).json({
      error: true,
      message: 'Acceso denegado: no tienes permisos para este recurso'
    });
  };
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: 'No autenticado'
        });
      }

      // Verificar permisos del usuario
      const result = await query(
        'SELECT permissions FROM user_permissions WHERE user_id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permisos para realizar esta acción'
        });
      }

      const userPermissions = result.rows[0].permissions;
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          error: true,
          message: `No tienes el permiso: ${permission}`
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return res.status(500).json({
        error: true,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para rate limiting específico por usuario
const userRateLimit = (maxRequests, windowMs) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const now = Date.now();
    const userData = userRequests.get(userId) || { count: 0, resetTime: now + windowMs };

    // Resetear contador si la ventana de tiempo ha expirado
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + windowMs;
    }

    // Incrementar contador
    userData.count++;

    if (userData.count > maxRequests) {
      return res.status(429).json({
        error: true,
        message: 'Demasiadas solicitudes para este usuario',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      });
    }

    userRequests.set(userId, userData);
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin,
  requirePermission,
  userRateLimit
};
