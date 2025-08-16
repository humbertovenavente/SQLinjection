import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SQLInjectionDemoPage from './pages/SQLInjectionDemoPage';

import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app-container">
      {/* HEADER - Barra de navegación en la parte superior */}
      <header className="app-header">
        <Navbar />
      </header>
      
      {/* BODY - Contenido principal en el centro */}
      <main className="app-main">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } />
          
          {/* Rutas protegidas */}
          <Route path="/sql-demo" element={
            isAuthenticated ? <SQLInjectionDemoPage /> : <Navigate to="/login" replace />
          } />
          
          {/* Ruta 404 */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                <a 
                  href="/" 
                  className="btn-primary"
                >
                  Volver al inicio
                </a>
              </div>
            </div>
          } />
        </Routes>
      </main>
      
      {/* FOOTER - Pie de página en la parte inferior */}
      <Footer />
    </div>
  );
}

export default App;
