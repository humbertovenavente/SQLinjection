import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Cargando...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 
          className={`${sizeClasses[size]} text-primary-600 animate-spin`} 
        />
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
