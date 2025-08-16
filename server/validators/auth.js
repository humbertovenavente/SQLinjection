const { z } = require('zod');

// Esquema para registro de usuario
const registerSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos')
    .transform(val => val.toLowerCase().trim()),
  
  email: z.string()
    .email('Formato de email inválido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .max(100, 'El email no puede exceder 100 caracteres')
    .transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

// Esquema para login
const loginSchema = z.object({
  email: z.string()
    .email('Formato de email inválido')
    .transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(1, 'La contraseña es requerida')
});

// Esquema para cambio de contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'La contraseña actual es requerida'),
  
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128, 'La nueva contraseña no puede exceder 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las nuevas contraseñas no coinciden",
  path: ["confirmNewPassword"]
});

// Esquema para recuperación de contraseña
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Formato de email inválido')
    .transform(val => val.toLowerCase().trim())
});

// Esquema para reset de contraseña
const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'El token es requerido'),
  
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128, 'La nueva contraseña no puede exceder 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las nuevas contraseñas no coinciden",
  path: ["confirmNewPassword"]
});

// Middleware de validación
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: true,
          message: 'Error de validación',
          details: errors
        });
      }
      next(error);
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateSchema
};
