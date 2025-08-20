const securityMiddleware = (req, res, next) => {
  // Remover headers que pueden exponer información
  res.removeHeader('X-Powered-By');
  
  // Headers de seguridad adicionales
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Prevenir clickjacking
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  
  // Log de intentos de acceso sospechoso
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Detectar patrones sospechosos
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i
  ];
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || pattern.test(req.body) || pattern.test(req.query)
  );
  
  if (hasSuspiciousPattern) {
    console.warn(' Intento de acceso sospechoso detectado:', {
      ip,
      userAgent,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // En modo seguro, bloquear inmediatamente
    if (process.env.MODE === 'secure') {
      return res.status(403).json({
        error: 'Acceso denegado por seguridad',
        message: 'Se detectó un patrón sospechoso en la solicitud'
      });
    }
  }
  
  next();
};

// Middleware para validar entrada JSON
const validateJSON = (req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    try {
      JSON.parse(JSON.stringify(req.body));
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'JSON inválido',
        message: 'El cuerpo de la solicitud no contiene JSON válido'
      });
    }
  } else {
    next();
  }
};

// Middleware para limitar tamaño de payload
const limitPayload = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 1024 * 1024; // 1MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Payload demasiado grande',
      message: 'El tamaño máximo permitido es 1MB'
    });
  }
  
  next();
};

// Middleware para sanitizar entrada
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remover caracteres peligrosos pero mantener funcionalidad
      return obj
        .replace(/[<>]/g, '') // remover < y >
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

module.exports = {
  securityMiddleware,
  validateJSON,
  limitPayload,
  sanitizeInput
};
