---
title: Docker Containerization Practical Guide
created: 2026-02-09
updated: 2026-02-09
tags: ["docker", "devops", "containers", "deployment"]
summary: Practical guide to Docker containerization with best practices and optimization techniques
ai_refined: true
---

# Docker Containerization Practical Guide

## Docker Fundamentals

### What is Docker?

Docker is a platform for developing, shipping, and running applications in containers. Containers package software with all dependencies, ensuring consistency across environments.

**Benefits:**
- Consistent environments (dev, staging, production)
- Isolation and security
- Resource efficiency
- Fast deployment
- Easy scaling

### Core Concepts

**Image:** Read-only template with application and dependencies
**Container:** Running instance of an image
**Dockerfile:** Instructions to build an image
**Registry:** Storage for images (Docker Hub, private registries)

## Dockerfile Basics

### Simple Node.js Application

```dockerfile
# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
```

### Multi-stage Build

Reduce image size by separating build and runtime:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Python Application

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run as non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
CMD ["python", "app.py"]
```

## Docker Commands

### Image Management

```bash
# Build image
docker build -t myapp:1.0 .

# Build with build args
docker build --build-arg NODE_ENV=production -t myapp:1.0 .

# List images
docker images

# Remove image
docker rmi myapp:1.0

# Pull image
docker pull nginx:latest

# Push image
docker push username/myapp:1.0

# Tag image
docker tag myapp:1.0 username/myapp:latest
```

### Container Management

```bash
# Run container
docker run -d -p 3000:3000 --name myapp myapp:1.0

# Run with environment variables
docker run -d -e NODE_ENV=production -e DB_HOST=localhost myapp:1.0

# Run with volume
docker run -d -v $(pwd)/data:/app/data myapp:1.0

# List running containers
docker ps

# List all containers
docker ps -a

# Stop container
docker stop myapp

# Start container
docker start myapp

# Restart container
docker restart myapp

# Remove container
docker rm myapp

# View logs
docker logs myapp
docker logs -f myapp  # Follow logs

# Execute command in container
docker exec -it myapp bash
docker exec myapp ls /app

# Inspect container
docker inspect myapp

# View resource usage
docker stats myapp
```

## Docker Compose

### Basic Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Full Stack Application

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Docker Compose Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Build and start
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs
docker-compose logs -f web

# Execute command
docker-compose exec web bash

# Scale services
docker-compose up -d --scale web=3

# List services
docker-compose ps
```

## Best Practices

### 1. Use Specific Image Tags

```dockerfile
# Bad: Latest tag can change
FROM node:latest

# Good: Specific version
FROM node:18.16.0-alpine
```

### 2. Minimize Layers

```dockerfile
# Bad: Multiple RUN commands
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# Good: Combine commands
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*
```

### 3. Use .dockerignore

```
# .dockerignore
node_modules
npm-debug.log
.git
.env
.DS_Store
*.md
coverage
.vscode
```

### 4. Leverage Build Cache

```dockerfile
# Copy package files first
COPY package*.json ./
RUN npm ci

# Then copy source code
COPY . .
```

### 5. Run as Non-Root User

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

### 6. Use Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### 7. Set Resource Limits

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Networking

### Bridge Network (Default)

```bash
# Create network
docker network create mynetwork

# Run containers on network
docker run -d --network mynetwork --name web nginx
docker run -d --network mynetwork --name api node-app

# Containers can communicate using service names
# web can reach api at http://api:3000
```

### Host Network

```bash
# Use host's network stack
docker run -d --network host nginx
```

### Custom Network in Compose

```yaml
services:
  web:
    networks:
      - frontend
      - backend
  
  api:
    networks:
      - backend
  
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```

## Volumes and Data Persistence

### Named Volumes

```bash
# Create volume
docker volume create mydata

# Use volume
docker run -v mydata:/app/data myapp

# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Remove volume
docker volume rm mydata
```

### Bind Mounts

```bash
# Mount host directory
docker run -v $(pwd)/data:/app/data myapp

# Read-only mount
docker run -v $(pwd)/config:/app/config:ro myapp
```

### tmpfs Mounts

```bash
# Temporary in-memory storage
docker run --tmpfs /app/temp myapp
```

## Security

### 1. Scan Images for Vulnerabilities

```bash
# Using Docker Scout
docker scout cves myapp:1.0

# Using Trivy
trivy image myapp:1.0
```

### 2. Use Official Base Images

```dockerfile
FROM node:18-alpine  # Official Node.js image
```

### 3. Don't Store Secrets in Images

```bash
# Use environment variables
docker run -e DB_PASSWORD=secret myapp

# Use Docker secrets (Swarm mode)
echo "mypassword" | docker secret create db_password -
```

### 4. Limit Container Capabilities

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
```

### 5. Use Read-Only Filesystem

```bash
docker run --read-only --tmpfs /tmp myapp
```

## Optimization

### Reduce Image Size

```dockerfile
# Use Alpine base images
FROM node:18-alpine  # ~170MB vs node:18 ~900MB

# Multi-stage builds
FROM node:18 AS builder
# ... build steps
FROM node:18-alpine
COPY --from=builder /app/dist ./dist

# Remove unnecessary files
RUN npm ci --only=production && \
    npm cache clean --force
```

### Build Cache Optimization

```dockerfile
# Order matters - least to most frequently changed
COPY package*.json ./
RUN npm ci
COPY . .
```

## Monitoring and Logging

### Container Logs

```bash
# View logs
docker logs myapp

# Follow logs
docker logs -f myapp

# Last 100 lines
docker logs --tail 100 myapp

# Logs since timestamp
docker logs --since 2024-01-01T00:00:00 myapp
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Specific container
docker stats myapp
```

### Logging Drivers

```bash
# JSON file (default)
docker run --log-driver json-file myapp

# Syslog
docker run --log-driver syslog myapp

# None (disable logging)
docker run --log-driver none myapp
```

## Troubleshooting

### Debug Container

```bash
# Interactive shell
docker exec -it myapp sh

# Check processes
docker top myapp

# Inspect configuration
docker inspect myapp

# View resource usage
docker stats myapp

# Check logs
docker logs myapp
```

### Common Issues

**Container exits immediately:**
```bash
# Check logs
docker logs myapp

# Run interactively
docker run -it myapp sh
```

**Port already in use:**
```bash
# Use different host port
docker run -p 3001:3000 myapp
```

**Permission denied:**
```bash
# Check file permissions
# Run as root (not recommended)
docker exec -u root -it myapp sh
```

## Production Deployment

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml myapp

# Scale service
docker service scale myapp_web=5

# Update service
docker service update --image myapp:2.0 myapp_web
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0
        ports:
        - containerPort: 3000
```

> Docker simplifies deployment and ensures consistency across all environments.
