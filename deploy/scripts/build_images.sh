#!/bin/bash
set -e

echo "Building Docker images..."

docker build -t quant-bot/backend:latest -f deploy/docker/Dockerfile.backend .
docker build -t quant-bot/frontend:latest -f deploy/docker/Dockerfile.frontend .
docker build -t quant-bot/strategy-engine:latest -f strategy-engine/Dockerfile strategy-engine/
docker build -t quant-bot/risk-engine:latest -f risk-engine/Dockerfile risk-engine/
docker build -t quant-bot/data-collector:latest -f data-collector/Dockerfile data-collector/
docker build -t quant-bot/qa-bot:latest -f qa-bot/Dockerfile qa-bot/

echo "All images built successfully."
