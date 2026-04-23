#!/bin/bash
echo ""
echo "⌚ Jay's Watch Store — Exam Portal"
echo "=================================="
echo ""
cd "$(dirname "$0")/backend"

if [ ! -f ".env" ]; then
  echo "⚠️  No .env file found. Copying .env.example to .env..."
  cp .env.example .env
  echo ""
  echo "👉  Edit backend/.env with your MongoDB URI, then run this script again."
  echo ""
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo "🚀 Starting server on http://localhost:3001"
echo ""
npm start
