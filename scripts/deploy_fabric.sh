#!/bin/bash
echo "🚀 Starting Fabric Cloud Deployment..."

# infrastructure tools/services
echo "📦 Deploying Infrastructure..."
microk8s kubectl apply -f kubernetes/rabbitmq-deployment.yaml
microk8s kubectl apply -f kubernetes/minio-deployment.yaml
microk8s kubectl apply -f kubernetes/nodered-deployment.yaml
microk8s kubectl apply -f kubernetes/thingsboard-deployment.yaml
# await for 15 seconds
echo "⏳ Waiting 15s for infrastructure..."
sleep 15

# deploy Fabric app
echo "💻 Deploying Fabric App (Frontend + Backend)..."
microk8s kubectl apply -f kubernetes/backend-deployment.yaml
microk8s kubectl apply -f kubernetes/frontend-deployment.yaml

# 4. statement
echo "✅ Deployment finished! Checking Pods..."
microk8s kubectl get pods
microk8s kubectl get services
echo "☁️ App is ready at: http://localhost:30002"