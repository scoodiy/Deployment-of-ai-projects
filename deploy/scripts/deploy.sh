#!/bin/bash
set -e

echo "Deploying to Kubernetes..."

kubectl apply -f deploy/k8s/backend.yaml
kubectl apply -f deploy/k8s/frontend.yaml
kubectl apply -f deploy/k8s/strategy-engine.yaml
kubectl apply -f deploy/k8s/risk-engine.yaml
kubectl apply -f deploy/k8s/data-collector.yaml
kubectl apply -f deploy/k8s/qa-bot.yaml
kubectl apply -f deploy/k8s/kafka.yaml

echo "Deployment complete."
kubectl get pods
