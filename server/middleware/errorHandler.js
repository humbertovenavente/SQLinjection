const errorHandler = (err, req, res, next) => {
  // Log del error completo para debugging
  console.error(' Error en la aplicación:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determinar el tipo de error
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details = null;

  // Errores de validación
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
    details = err.details || err.message;
  }
  
  // Errores de base de datos
  else if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'Conflicto: el recurso ya existe';
  }
  else if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Error de referencia: el recurso referenciado no existe';
  }
  else if (err.code === '42P01') { // Undefined table
    statusCode = 500;
    message = 'Error de configuración de base de datos';
  }
  else if (err.code === '28P01') { // Invalid password
    statusCode = 401;
    message = 'Credenciales inválidas';
  }
  
  // Errores de autenticación
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }
  
  // Errores de rate limiting
  else if (err.status === 429) {
    statusCode = 429;
    message = 'Demasiadas solicitudes';
  }
  
  // Errores de permisos
  else if (err.status === 403) {
    statusCode = 403;
    message = 'Acceso denegado';
  }
  
  // Errores de SQL Injection (detectados por nuestro middleware)
  else if (err.message && err.message.includes('SQL Injection')) {
    statusCode = 403;
    message = 'Acceso denegado por seguridad';
    
    // Log adicional para auditoría
    console.warn(' Intento de SQL Injection bloqueado:', {
      ip: req.ip,
      url: req.url,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }

  // Respuesta del error
  const errorResponse = {
    error: true,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Solo incluir detalles en desarrollo
  if (process.env.NODE_ENV === 'development' && details) {
    errorResponse.details = details;
  }

  // Headers de seguridad adicionales en caso de error
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar errores asíncronos
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para manejar errores de conexión a la base de datos
const dbErrorHandler = (err, req, res, next) => {
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    console.error('Error de conexión a la base de datos:', err);
    return res.status(503).json({
      error: true,
      message: 'Servicio temporalmente no disponible',
      timestamp: new Date().toISOString()
    });
  }
  next(err);
};

module.exports = {
  errorHandler,
  asyncErrorHandler,
  dbErrorHandler
};
