#!/bin/bash
set -e

echo "Setting up development environment..."

# Python venv
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip

# Install Python deps
pip install -r backend/requirements.txt
pip install -r strategy-engine/requirements.txt
pip install -r risk-engine/requirements.txt
pip install -r data-collector/requirements.txt
pip install -r qa-bot/requirements.txt
pip install pytest pytest-asyncio httpx

# Frontend
cd frontend && npm install && cd ..

# Start services
docker-compose -f deploy/docker/docker-compose.yml up -d postgres redis

echo "Setup complete! Run 'make dev' to start."
