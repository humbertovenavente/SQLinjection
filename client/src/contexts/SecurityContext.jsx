import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
  const [securityMode, setSecurityMode] = useState('secure');
  const [securityLogs, setSecurityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener modo de seguridad del servidor
  useEffect(() => {
    const getSecurityMode = async () => {
      try {
        const response = await axios.get('/api/health');
        setSecurityMode(response.data.mode || 'secure');
      } catch (error) {
        console.error('Error obteniendo modo de seguridad:', error);
        setSecurityMode('secure');
      }
    };

    getSecurityMode();
  }, []);

  // Agregar log de seguridad
  const addSecurityLog = (log) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: log.type || 'info',
      message: log.message,
      details: log.details || {},
      ...log
    };

    setSecurityLogs(prev => [newLog, ...prev.slice(0, 99)]); // Mantener solo los últimos 100 logs
  };

  // Limpiar logs
  const clearLogs = () => {
    setSecurityLogs([]);
  };

  // Ejecutar consulta de prueba
  const executeTestQuery = async (query, mode = 'secure') => {
    setIsLoading(true);
    addSecurityLog({
      type: 'info',
      message: `Ejecutando consulta de prueba en modo: ${mode}`,
      details: { query, mode }
    });

    try {
      let endpoint = '/api/demo/search';
      let params = { q: query, mode };

      if (mode === 'preview_vulnerable') {
        addSecurityLog({
          type: 'warning',
          message: 'MODO DEMO: Mostrando consulta vulnerable pero ejecutando la segura',
          details: { query, mode }
        });
      }

      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        addSecurityLog({
          type: 'success',
          message: 'Consulta ejecutada exitosamente',
          details: { 
            mode, 
            results: response.data.results,
            message: response.data.message 
          }
        });

        return {
          success: true,
          data: response.data,
          securityNote: response.data.message
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error ejecutando consulta';
      
      addSecurityLog({
        type: 'error',
        message: `Error en consulta: ${errorMessage}`,
        details: { error: error.response?.data, mode }
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Ejecutar ataque de prueba (solo para demostración)
  const executeAttackDemo = async (attackType, payload) => {
    setIsLoading(true);
    
    addSecurityLog({
      type: 'warning',
      message: `DEMO: Ejecutando ataque de prueba: ${attackType}`,
      details: { attackType, payload }
    });

    try {
      // Simular diferentes tipos de ataques
      let demoQuery = '';
      let demoMode = 'preview_vulnerable';

      switch (attackType) {
        case 'union_select':
          demoQuery = `' UNION SELECT username, password_hash, email FROM users --`;
          break;
        case 'drop_table':
          demoQuery = `'; DROP TABLE users; --`;
          break;
        case 'insert_admin':
          demoQuery = `'; INSERT INTO users (username, email, password_hash) VALUES ('hacker', 'hacker@evil.com', 'hash'); --`;
          break;
        case 'information_schema':
          demoQuery = `' UNION SELECT table_name, column_name, data_type FROM information_schema.columns --`;
          break;
        case 'version_info':
          demoQuery = `' UNION SELECT version(), current_database(), current_user --`;
          break;
        default:
          demoQuery = payload;
      }

      const response = await axios.get('/api/demo/search', {
        params: { q: demoQuery, mode: demoMode }
      });

      if (response.data.success) {
        addSecurityLog({
          type: 'info',
          message: ' DEMO: Ataque simulado - consulta ejecutada de forma segura',
          details: { 
            attackType, 
            payload: demoQuery,
            results: response.data.results,
            securityNote: response.data.message 
          }
        });

        return {
          success: true,
          data: response.data,
          securityNote: 'Este ataque fue simulado para demostración. La consulta real se ejecutó de forma segura.'
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error en demo de ataque';
      
      addSecurityLog({
        type: 'error',
        message: `Error en demo de ataque: ${errorMessage}`,
        details: { error: error.response?.data, attackType }
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener estadísticas de seguridad
  const getSecurityStats = async () => {
    try {
      const response = await axios.get('/api/demo/stats');
      
      if (response.data.success) {
        addSecurityLog({
          type: 'info',
          message: 'Estadísticas de seguridad obtenidas',
          details: { stats: response.data.stats }
        });

        return response.data;
      }
    } catch (error) {
      addSecurityLog({
        type: 'error',
        message: 'Error obteniendo estadísticas de seguridad',
        details: { error: error.response?.data }
      });
      
      throw error;
    }
  };

  // Cambiar modo de seguridad (solo para administradores)
  const changeSecurityMode = async (newMode) => {
    if (!['secure', 'preview_vulnerable'].includes(newMode)) {
      addSecurityLog({
        type: 'error',
        message: 'Modo de seguridad inválido',
        details: { attemptedMode: newMode }
      });
      return false;
    }

    try {
      // En una implementación real, esto requeriría permisos de administrador
      // Por ahora, solo simulamos el cambio
      setSecurityMode(newMode);
      
      addSecurityLog({
        type: 'warning',
        message: `Modo de seguridad cambiado a: ${newMode}`,
        details: { 
          previousMode: securityMode, 
          newMode,
          note: 'Este cambio solo afecta la vista previa, las consultas siguen siendo seguras'
        }
      });

      return true;
    } catch (error) {
      addSecurityLog({
        type: 'error',
        message: 'Error cambiando modo de seguridad',
        details: { error: error.message }
      });
      
      return false;
    }
  };

  const value = {
    securityMode,
    securityLogs,
    isLoading,
    addSecurityLog,
    clearLogs,
    executeTestQuery,
    executeAttackDemo,
    getSecurityStats,
    changeSecurityMode
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity debe ser usado dentro de un SecurityProvider');
  }
  return context;
};
