import React from 'react';
import { Lock } from 'lucide-react';

const Footer = () => {
 

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
            </div>
            <span className="text-xl font-bold text-white">
              SQL Injection Attacks by Jose Najar
            </span>
          </div>
          <p className="text-gray-400 text-sm">
             Security Project 2025
          </p>
        </div>

        {/* Recursos educativos */}
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li>
              <a 
                href="https://owasp.org/www-community/attacks/SQL_Injection" 
                target="_blank"
                rel="noopener noreferrer"
              >
                OWASP SQL Injection
              </a>
            </li>
            <li>
              <a 
                href="https://nodejs.org/en/docs/guides/security/" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Node.js Security
              </a>
            </li>
            <li>
              <a 
                href="https://www.postgresql.org/docs/current/security.html" 
                target="_blank"
                rel="noopener noreferrer"
              >
                PostgreSQL Security
              </a>
            </li>
            <li>
              <a 
                href="https://expressjs.com/en/advanced/best-practices-security.html" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Express Security
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
