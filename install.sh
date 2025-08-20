#!/bin/bash

# Script de instalación automática para SQL Injection Demo
# Autor: Estudiante de Seguridad Web
# Fecha: Agosto 2025

set -e  # Salir si hay algún error

echo "Iniciando instalación de SQL Injection ..."
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si PostgreSQL está instalado
check_postgres() {
    print_status "Verificando instalación de PostgreSQL..."
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL no está instalado. Por favor instálalo primero:"
        echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "CentOS/RHEL: sudo yum install postgresql postgresql-server"
        echo "macOS: brew install postgresql"
        exit 1
    fi
    
    print_success "PostgreSQL está instalado"
}

# Verificar si Node.js está instalado
check_node() {
    print_status "Verificando instalación de Node.js..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instálalo primero:"
        echo "Visita: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION está instalado"
}

# Verificar si npm está instalado
check_npm() {
    print_status "Verificando instalación de npm..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado. Por favor instálalo primero."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION está instalado"
}

# Configurar base de datos
setup_database() {
    print_status "Configurando base de datos PostgreSQL..."
    
    # Verificar si el usuario postgres existe
    if ! sudo -u postgres psql -c "SELECT 1" &> /dev/null; then
        print_error "No se puede acceder a PostgreSQL como usuario postgres"
        print_warning "Asegúrate de que PostgreSQL esté ejecutándose y configurado correctamente"
        exit 1
    fi
    
    # Crear base de datos y usuario
    print_status "Creando base de datos y usuario..."
    
    sudo -u postgres psql << EOF
CREATE DATABASE sqli_demo;
CREATE USER sqli_user WITH PASSWORD 'Unis2025';
GRANT CONNECT ON DATABASE sqli_demo TO sqli_user;
GRANT USAGE ON SCHEMA public TO sqli_user;
GRANT CREATE ON SCHEMA public TO sqli_user;
\q
EOF
    
    print_success "Base de datos configurada correctamente"
}

# Instalar dependencias del servidor
install_server_deps() {
    print_status "Instalando dependencias del servidor..."
    
    cd server
    
    if [ ! -f "package.json" ]; then
        print_error "No se encontró package.json en el directorio server"
        exit 1
    fi
    
    npm install
    
    print_success "Dependencias del servidor instaladas"
    cd ..
}

# Instalar dependencias del cliente
install_client_deps() {
    print_status "Instalando dependencias del cliente..."
    
    cd client
    
    if [ ! -f "package.json" ]; then
        print_error "No se encontró package.json en el directorio client"
        exit 1
    fi
    
    npm install
    
    print_success "Dependencias del cliente instaladas"
    cd ..
}

# Instalar dependencias del proyecto principal
install_root_deps() {
    print_status "Instalando dependencias del proyecto principal..."
    
    if [ ! -f "package.json" ]; then
        print_error "No se encontró package.json en el directorio raíz"
        exit 1
    fi
    
    npm install
    
    print_success "Dependencias del proyecto principal instaladas"
}

# Configurar variables de entorno
setup_env() {
    print_status "Configurando variables de entorno..."
    
    if [ ! -f "server/.env" ]; then
        if [ -f "server/env.example" ]; then
            cp server/env.example server/.env
            print_success "Archivo .env creado desde env.example"
        else
            print_warning "No se encontró env.example, creando .env manualmente..."
            cat > server/.env << EOF
# Configuración de la base de datos
DATABASE_URL=postgres://sqli_user:Unis2025@localhost:5432/sqli_demo

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Modo de seguridad (secure | preview_vulnerable)
MODE=secure

# Configuración de seguridad
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion
BCRYPT_ROUNDS=12

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EOF
            print_success "Archivo .env creado manualmente"
        fi
    else
        print_warning "El archivo .env ya existe, no se sobrescribirá"
    fi
}

# Poblar base de datos
seed_database() {
    print_status "Poblando base de datos con datos de ejemplo..."
    
    cd server
    
    # Verificar si el script de seed existe
    if [ ! -f "scripts/seed.js" ]; then
        print_error "No se encontró el script de seed"
        exit 1
    fi
    
    # Ejecutar seed
    npm run db:seed
    
    print_success "Base de datos poblada correctamente"
    cd ..
}

# Verificar instalación
verify_installation() {
    print_status "Verificando instalación..."
    
    # Verificar archivos importantes
    if [ ! -f "server/index.js" ]; then
        print_error "No se encontró server/index.js"
        exit 1
    fi
    
    if [ ! -f "client/src/App.jsx" ]; then
        print_error "No se encontró client/src/App.jsx"
        exit 1
    fi
    
    if [ ! -f "server/.env" ]; then
        print_error "No se encontró server/.env"
        exit 1
    fi
    
    print_success "Instalación verificada correctamente"
}

# Mostrar instrucciones de uso
show_usage() {
    echo ""
    echo " ¡Instalación completada exitosamente!"
    echo "========================================"
    echo ""
    echo "Para ejecutar el proyecto:"
    echo ""
    echo "1. Iniciar el servidor:"
    echo "   npm run server:dev"
    echo ""
    echo "2. En otra terminal, iniciar el cliente:"
    echo "   npm run client:dev"
    echo ""
    echo "3. O ejecutar ambos simultáneamente:"
    echo "   npm run dev"
    echo ""
    echo "El proyecto estará disponible en:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend: http://localhost:3000"
    echo ""
    echo " Credenciales de prueba:"
    echo "   - Admin: admin@email.com / Admin123!"
    echo "   - Usuario: usuario1@email.com / User123!"
    echo ""
    echo " IMPORTANTE:"
    echo "   - Este proyecto es SOLO para fines educativos"
    echo "   - No usar en producción sin revisión de seguridad"
    echo "   - Las consultas vulnerables mostradas son simulaciones controladas"
    echo ""
}

# Función principal
main() {
    echo "Iniciando instalación de SQL Injection Demo..."
    echo ""
    
    # Verificaciones previas
    check_postgres
    check_node
    check_npm
    
    echo ""
    
    # Instalación
    setup_database
    setup_env
    install_root_deps
    install_server_deps
    install_client_deps
    seed_database
    
    echo ""
    
    # Verificación final
    verify_installation
    
    echo ""
    
    # Mostrar instrucciones
    show_usage
}

# Ejecutar función principal
main "$@"
