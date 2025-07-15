#!/bin/bash

echo "🚀 Starting Development Environment..."

# Build and start development containers
docker-compose -f docker-compose.dev.yml up --build -d

echo "✅ Development environment started!"
echo "📱 API is running on http://localhost:9503"
echo "🔍 View logs: docker-compose -f docker-compose.dev.yml logs -f api"
echo "🛑 Stop: docker-compose -f docker-compose.dev.yml down" 