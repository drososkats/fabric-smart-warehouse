# Fabric Smart Warehouse

A distributed, cloud-native ERP and IoT monitoring system for warehouse management. The platform combines a microservices application (React + Node.js) with object storage, event-driven messaging, and real-time IoT environmental monitoring, deployed on Kubernetes.

> **MSc Project** — Cloud Native Applications, Harokopio University of Athens
> **Author:** Drosos Katsimpras (`ais25123`)

---

## Overview

The system models a **Smart Warehouse**: when an employee adds a new product to the inventory, the platform stores the product image and metadata, then triggers an IoT workflow that simulates and monitors the environmental conditions (temperature and humidity) of the storage area in real time.

It demonstrates the transition from a monolithic application to a **cloud-native architecture**, built around an event-driven flow and orchestrated as independent services on a MicroK8s cluster.

## Architecture

| Service | Technology | Role |
| :--- | :--- | :--- |
| Frontend | React | Inventory management UI |
| Backend | Node.js / Express | REST API, business logic, storage orchestration |
| Database | MongoDB Atlas | Cloud-hosted NoSQL store for product metadata |
| Object Storage | MinIO | S3-compatible storage for product images |
| Message Broker | RabbitMQ | Asynchronous, event-driven communication (AMQP) |
| IoT Gateway | Node-RED | Consumes events and simulates sensor telemetry |
| Visualization | ThingsBoard | Real-time IoT dashboard (MQTT) |
| Orchestration | MicroK8s | Kubernetes cluster running all services as pods |

### Smart Warehouse flow

1. An employee adds a product through the **Frontend**.
2. The **Backend** uploads the image to **MinIO** and stores metadata in **MongoDB Atlas**.
3. A `NEW_PRODUCT` event is published to **RabbitMQ**.
4. **Node-RED** consumes the event and simulates sensor readings (e.g. 23 °C, 45 % humidity).
5. Readings are pushed via MQTT to **ThingsBoard**, where gauges and charts update in real time.

## Repository structure

```
fabric-smart-warehouse/
├── backend/            # Node.js / Express REST API
├── frontend/           # React application
├── kubernetes/         # Kubernetes manifests (deployments, services, etc.)
├── infrastructure/     # Infrastructure as Code (OpenTofu — provisions the VM)
├── ansible/            # Configuration management (installs and configures the stack)
├── ci/                 # CI/CD pipeline (Jenkinsfile)
├── argocd/             # GitOps application manifests (ArgoCD)
├── load-tests/         # Performance and SLA tests (k6)
├── scripts/            # Helper and deployment scripts
├── docs/               # Documentation hub (points to the LaTeX docs repo)
├── docker-compose.yml  # Local development — brings up all services together
└── README.md
```

## Getting started

### Prerequisites
- Ubuntu (native, VM, or cloud)
- MicroK8s, with addons enabled: `dns`, `storage`, `ingress`
- Node.js and npm
- Docker

### Deploy to Kubernetes

```bash
git clone https://github.com/drososkats/fabric-smart-warehouse.git
cd fabric-smart-warehouse

# Apply all manifests
microk8s kubectl apply -f kubernetes/

# Or use the automation script
chmod +x scripts/deploy_fabric.sh
./scripts/deploy_fabric.sh
```

### Verify

```bash
microk8s kubectl get pods
```

### Local development

```bash
docker-compose up --build
```

## Accessing the services

Services are exposed via NodePort or port-forwarding. Ports may vary depending on your configuration.

| Service | Default URL |
| :--- | :--- |
| Frontend | `http://<host>:30002` |
| Backend API | `http://<host>:5000` |
| Node-RED | `http://<host>:1880` |
| ThingsBoard | `http://<host>:9090` |
| RabbitMQ Management | `http://<host>:15672` |
| MinIO Console | `http://<host>:9001` |

Example port-forward:

```bash
microk8s kubectl port-forward --address 0.0.0.0 service/fabric-backend-service 5000:5000
```

## Demo accounts

These are **default local/demo credentials** intended only for evaluation. In the cloud-native deployment, secrets are externalized and managed through Kubernetes Secrets / Vault rather than committed to the repository.

| System | Username | Password |
| :--- | :--- | :--- |
| Fabric App | `drosos@fabric.com` | `12345678` |
| RabbitMQ | `guest` | `guest` |
| ThingsBoard | `tenant@thingsboard.org` | `tenant` |
| MinIO | `admin` | `password123` |

MongoDB Atlas access is configured through a connection string provided via the backend environment variables (not stored in this repository).

## Documentation

The full technical report and presentation (LaTeX sources) are maintained in a dedicated repository. See [`docs/`](docs/) for links.

## Roadmap — Cloud-Native enhancements

This project is being extended with production-grade cloud-native practices:

- **Resilience patterns** — Circuit Breaker, Retry, Claim Check, Idempotency, Async Reply, Stateless services
- **Monitoring and autoscaling** — Prometheus and Grafana with Horizontal Pod Autoscaling
- **GitOps CI/CD** — Jenkins for builds and image publishing, ArgoCD for continuous deployment
- **Infrastructure as Code** — OpenTofu for provisioning, Ansible for configuration, external secret management
- **Service-level objectives** — load testing and SLA tiers (Gold / Silver / Bronze)
- **Production networking** — Ingress, TLS via Let's Encrypt, and a custom domain

## Known limitations

- **Storage:** MinIO currently uses ephemeral pod storage; restarting the cluster resets stored images. Persistent Volume Claims (PVCs) are planned.
- **Security:** Service-to-service communication currently uses HTTP. HTTPS and ingress are part of the roadmap.

## License

Created for educational purposes.