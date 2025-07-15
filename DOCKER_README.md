# Docker Setup Guide

Setup Docker untuk development dan production environment dengan port 9503.

## Prerequisites

- Docker
- Docker Compose
- Node.js 22+ (untuk development lokal)

## Environment Setup

### 1. Development Environment

```bash
# Jalankan development environment
./scripts/docker-dev.sh

# Atau manual
docker-compose -f docker-compose.dev.yml up --build -d
```

**Features:**
- Hot reload dengan nodemon
- Volume mounting untuk live code changes
- Port: 9503
- Environment: development

### 2. Production Environment

```bash
# Jalankan production environment
./scripts/docker-prod.sh

# Atau manual
docker-compose -f docker-compose.prod.yml up --build -d
```

**Features:**
- Multi-stage build untuk optimasi ukuran image
- Non-root user untuk security
- Port: 9503
- Environment: production
- Resource limits (1GB RAM, 0.5 CPU)

## Directory Structure

```
/app
├── logs/           # Log files (mounted volume)
├── public/         # Public files (mounted volume)
├── storages/       # Storage files (mounted volume)
└── src/            # Application source code
```

## Commands

### Development
```bash
# Start development
./scripts/docker-dev.sh

# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Stop development
docker-compose -f docker-compose.dev.yml down

# Rebuild development
docker-compose -f docker-compose.dev.yml up --build -d
```

### Production
```bash
# Start production
./scripts/docker-prod.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Stop production
docker-compose -f docker-compose.prod.yml down

# Rebuild production
docker-compose -f docker-compose.prod.yml up --build -d
```

## Health Check

API akan melakukan health check setiap 30 detik pada endpoint `/health`.

## Environment Variables

Pastikan file `.env` sudah dikonfigurasi dengan benar:

```env
# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# JWT
JWT_SECRET=your_jwt_secret

# App
APP_PORT=9503
NODE_ENV=development # atau production
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 9503
lsof -i :9503

# Kill process if needed
kill -9 <PID>
```

### Permission Issues
```bash
# Fix directory permissions
sudo chown -R $USER:$USER logs public storages
chmod -R 755 logs public storages
```

### Container Won't Start
```bash
# Check container logs
docker-compose -f docker-compose.dev.yml logs api

# Check container status
docker-compose -f docker-compose.dev.yml ps
```

## Notes

- API berjalan di port 9503
- Database dan service lain tidak termasuk dalam Docker setup
- Volume mounting untuk logs, public, dan storages
- Health check endpoint: `http://localhost:9503/health` 