import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-24 w-24 bg-gradient-to-r from-warning-600 to-warning-800 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-12 w-12 text-white" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Página No Encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary w-full flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al Inicio
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary w-full flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Si crees que esto es un error, contacta al administrador.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
