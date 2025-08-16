-- Script de configuración de base de datos para SQL Injection Demo
-- Ejecutar como usuario postgres

-- Crear base de datos
CREATE DATABASE sqli_demo;

-- Crear usuario con mínimos privilegios
CREATE USER sqli_user WITH PASSWORD 'Unis2025';

-- Conectar a la base de datos
\c sqli_demo;

-- Otorgar privilegios mínimos al usuario
GRANT CONNECT ON DATABASE sqli_demo TO sqli_user;
GRANT USAGE ON SCHEMA public TO sqli_user;
GRANT CREATE ON SCHEMA public TO sqli_user;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    login_attempts INTEGER DEFAULT 0,
    last_login_attempt TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Crear tabla de permisos
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);

-- Otorgar permisos específicos al usuario
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sqli_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sqli_user;

-- Configurar políticas de seguridad (PostgreSQL 9.5+)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (id = current_setting('app.current_user_id')::integer OR is_admin = true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (id = current_setting('app.current_user_id')::integer OR is_admin = true);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (is_admin = true);

CREATE POLICY "Users can view their own permissions" ON user_permissions
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::integer OR 
                     EXISTS (SELECT 1 FROM users WHERE id = user_permissions.user_id AND is_admin = true));

-- Configurar auditoría básica
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear función para auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
        VALUES (current_setting('app.current_user_id')::integer, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), 
                current_setting('app.client_ip')::inet, current_setting('app.user_agent'));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
        VALUES (current_setting('app.current_user_id')::integer, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW),
                current_setting('app.client_ip')::inet, current_setting('app.user_agent'));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
        VALUES (current_setting('app.current_user_id')::integer, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD),
                current_setting('app.client_ip')::inet, current_setting('app.user_agent'));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers de auditoría
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_permissions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Otorgar permisos en tabla de auditoría
GRANT SELECT ON audit_logs TO sqli_user;

-- Configurar límites de conexiones
ALTER USER sqli_user CONNECTION LIMIT 10;

-- Configurar timeout de sesión
ALTER USER sqli_user SET statement_timeout = '30s';
ALTER USER sqli_user SET lock_timeout = '10s';

-- Verificar configuración
SELECT 
    current_database() as database_name,
    current_user as current_user,
    sqli_user as demo_user;

-- Mostrar privilegios del usuario
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'sqli_user';

-- Mostrar políticas de seguridad
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public';
