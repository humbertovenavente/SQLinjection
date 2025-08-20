import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Database, 
  User, 
  LogOut, 
  Lock,
  Home
} from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/sql-demo', label: 'SQL', icon: Database },
  ];

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                
              </div>
              <span className="navbar-brand">
                SQL Injection by Jose Najar
              </span>
            </Link> 
          </div>

          {/* Navegación */}
          <div className="flex items-center space-x-4 md:space-x-8">
            {isAuthenticated ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Usuario y logout */}
                <div>
                  <div>
                   
                  </div>
                  
                  <Link
                    onClick={handleLogout}
                  >
                  
                    <span>Log out</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>


        </div>
      </div>


    </nav>
  );
};

export default Navbar;
