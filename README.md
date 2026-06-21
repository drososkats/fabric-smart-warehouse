# Fabric Smart Warehouse

A distributed, cloud-native ERP and IoT monitoring system for warehouse management. The platform combines a microservices application (React + Node.js) with object storage, event-driven messaging, serverless image processing, and real-time IoT environmental monitoring — deployed on a fully automated, GitOps-driven Kubernetes cluster on Microsoft Azure.

> **MSc Project** — Cloud Native Applications, Harokopio University of Athens
> **Author:** Drosos Katsimpras (`ais25123`)

---

## Overview

The system models a **Smart Warehouse**: when an employee adds a new product to the inventory, the platform stores the product image and metadata, generates a thumbnail through a serverless function, and triggers an IoT workflow that simulates and monitors the environmental conditions (temperature and humidity) of the storage area in real time.

This is the cloud-native evolution of an already-containerized application (Docker + MicroK8s, built in a previous course): the same application layer now runs on an Azure virtual machine, provisioned through Infrastructure as Code, configured through automated playbooks, secured through centralized secrets management, deployed through a GitOps pipeline, and validated through real load testing and SLA tiers.

## Architecture

| Service | Technology | Role |
| :--- | :--- | :--- |
| Frontend | React | Inventory management UI |
| Backend | Node.js / Express | REST API, business logic, design patterns |
| Database | MongoDB Atlas | Cloud-hosted NoSQL store for product metadata |
| Object Storage | MinIO | S3-compatible storage for product images and thumbnails |
| Message Broker | RabbitMQ | Asynchronous, event-driven communication (AMQP) |
| IoT Gateway | Node-RED | Consumes events and simulates sensor telemetry |
| Visualization | ThingsBoard | Real-time IoT dashboard (MQTT) |
| Orchestration | MicroK8s | Kubernetes cluster running all services as pods |
| Serverless | Knative | Event-driven thumbnail generation, scale-to-zero |
| Secrets | HashiCorp Vault | Centralized secrets management via Agent Injector |
| IaC | OpenTofu | Declarative provisioning of the Azure VM and networking |
| Configuration | Ansible | Automated configuration of the VM and all services |
| CI | Jenkins | Build, test, and image publishing on every push |
| CD | ArgoCD | GitOps continuous deployment and self-healing sync |
| Monitoring | Prometheus / Grafana | Metrics collection and visualization |
| FinOps | Infracost | Infrastructure cost estimation |

### Smart Warehouse flow

1. An employee adds a product through the **Frontend**.
2. The **Backend** uploads the image to **MinIO** and stores metadata in **MongoDB Atlas**.
3. A **Knative** function is triggered automatically by the MinIO upload event, generating a thumbnail.
4. A `NEW_PRODUCT` event is published to **RabbitMQ**.
5. **Node-RED** consumes the event and simulates sensor readings (e.g. 23 °C, 45% humidity).
6. Readings are pushed via MQTT to **ThingsBoard**, where gauges and charts update in real time.

## Repository structure

```
fabric-smart-warehouse/
├── backend/            # Node.js / Express REST API, design patterns
├── frontend/           # React application
├── kubernetes/         # Kubernetes manifests (watched by ArgoCD)
├── infrastructure/     # Infrastructure as Code (OpenTofu — provisions the Azure VM)
├── ansible/            # Configuration management (7 roles: base-setup, vault, monitoring, jenkins, argocd, knative, infracost)
├── ci/                 # CI/CD pipeline (Jenkinsfile)
├── argocd/             # GitOps application manifests (ArgoCD)
├── serverless/         # Knative thumbnail-generation function
├── load-tests/         # Performance and SLA tests (k6)
├── scripts/            # Helper and deployment scripts
├── docs/               # Documentation hub (points to the LaTeX report repo)
├── docker-compose.yml  # Local development — brings up all services together
└── README.md
```

## Getting started

### Prerequisites
- An Azure subscription (for the full cloud-native deployment) or Ubuntu (native, VM, or cloud, for local development)
- MicroK8s, with addons enabled: `dns`, `storage`, `helm3`, `knative`, `community`
- Node.js and npm
- Docker

### Full automated deployment (Azure)

```bash
git clone https://github.com/drososkats/fabric-smart-warehouse.git
cd fabric-smart-warehouse

# 1. Provision the VM and networking (manual, one-time bootstrap step)
cd infrastructure && tofu init && tofu apply

# 2. Configure the VM and install the full stack
cd ../ansible && ansible-playbook -i inventory.ini playbook.yml
```

After this, **Jenkins** and **ArgoCD** take over: every `git push` to `main` automatically builds, tests, publishes new images, and syncs the cluster — no further manual steps are required.

### Local development

```bash
docker-compose up --build
```

### Verify

```bash
microk8s kubectl get pods
```

## Accessing the services

Services are exposed via NodePort. Replace `<VM_IP>` with the actual address of your deployment.

| Service | Access Point | Credentials Source |
| :--- | :--- | :--- |
| Frontend | `http://<VM_IP>:30002` | See demo accounts below |
| Backend API | `http://<VM_IP>:5000` | — |
| Jenkins | `http://<VM_IP>:30808` | Jenkins Credentials Store |
| ArgoCD | `http://<VM_IP>:30880` | `secret/fabric` (Vault) |
| MinIO Console | `http://<VM_IP>:9001` | `secret/fabric` (Vault) |
| Grafana | `http://<VM_IP>:<port>` | Helm-generated secret |
| Node-RED | `http://<VM_IP>:1880` | — |
| ThingsBoard | `http://<VM_IP>:9090` | See demo accounts below |
| RabbitMQ Management | `http://<VM_IP>:15672` | See demo accounts below |

## Demo accounts

These are **default local/demo credentials** intended only for evaluation purposes. In the cloud-native deployment, application secrets (MongoDB URI, MinIO keys, RabbitMQ credentials, ArgoCD admin password) are centrally managed through **HashiCorp Vault** and injected at runtime — never committed to this repository.

| System | Username | Password |
| :--- | :--- | :--- |
| Fabric App | `drosos@fabric.com` | `12345678` |
| RabbitMQ | `guest` | `guest` |
| ThingsBoard | `tenant@thingsboard.org` | `tenant` |
| MinIO | `admin` | `password123` |

MongoDB Atlas access is configured through a connection string injected via Vault (production) or environment variables (local development) — not stored in this repository.

## Design patterns implemented

- **Retry** — automatic reconnection to MongoDB on transient startup failures
- **Idempotency** — idempotency-key based rejection of duplicate product submissions
- **Claim Check** — large files (images, invoices) go to MinIO; only a lightweight URL travels through RabbitMQ and the database
- **Stateless** — no server-side session state; JWT-based authentication and MongoDB-backed persistence allow any backend replica to serve any request

## Documentation

The full technical report (architecture, automation, GitOps, design patterns, serverless, monitoring, SLAs) and the presentation slides are maintained in a dedicated repository. See [`docs/`](docs/) for links.

## Known limitations & future work

- **RabbitMQ secrets:** credentials are recorded in Vault for consistency, but the actual connection still relies on environment variables, due to a documented limitation of the official Docker image's credential handling at startup.
- **Circuit Breaker:** not implemented in the current phase; a natural extension of the existing Retry mechanism.
- **GET pagination:** the `GET /api/products` endpoint returns all records without pagination; under high load with a large dataset, this degrades response time. Pagination or caching is planned.
- **Pod-level cost tracking:** Infracost covers infrastructure-level cost estimation; per-pod, real-time cost breakdown would require an additional tool (e.g. OpenCost).

## License

Created for educational purposes.