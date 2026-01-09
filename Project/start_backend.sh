#!/bin/bash

# Script to start backend server
# Automatically kills any process using port 5000 first

echo "🔍 Backend will use port 5001 (to avoid AirPlay Receiver conflict)"
echo "💡 To use port 5000, disable AirPlay: System Preferences → General → AirDrop & Handoff"

# Navigate to src directory
cd "$(dirname "$0")/src"

# Check if virtual environment exists
if [ ! -d "../venv" ]; then
    echo "📦 Creating virtual environment..."
    cd ..
    python3 -m venv venv
    cd src
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source ../venv/bin/activate

# Install dependencies if needed
if [ ! -f "../.deps_installed" ]; then
    echo "📥 Installing dependencies..."
    pip install -r ../requirements.txt > /dev/null 2>&1
    touch ../.deps_installed
fi

# Start the Flask app
echo "🚀 Starting Flask backend server..."
echo ""
python3 app.py

