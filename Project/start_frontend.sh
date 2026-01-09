#!/bin/bash

# Script to start frontend server

echo "🚀 Starting frontend development server..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Start Vite dev server
npm run dev


