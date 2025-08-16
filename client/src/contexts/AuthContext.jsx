import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configurar axios con token por defecto
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      if (state.token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await axios.get('/api/auth/verify');
          
          if (response.data.success) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: response.data.user,
                token: state.token
              }
            });
          } else {
            throw new Error('Token inválido');
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Sesión expirada' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    verifyToken();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token }
        });
        
        toast.success('Lets do some SQL Injection! attack!');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token }
        });
        
        toast.success('Registration successful, now do some SQL Injection! attacks!');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error en el registro';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Limpiar error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    changePassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth needs to be used within an AuthProvider');
  }
  return context;
};
