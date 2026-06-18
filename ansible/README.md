# Fabric Smart Warehouse — Infrastructure Automation

![Ansible](https://img.shields.io/badge/Ansible-2.x-EE0000?logo=ansible&logoColor=white)
![Idempotent](https://img.shields.io/badge/Idempotent-yes-success)
![Structure](https://img.shields.io/badge/Structure-Roles-blue)
![MicroK8s](https://img.shields.io/badge/Kubernetes-MicroK8s-326CE5?logo=kubernetes&logoColor=white)

Ansible automation that provisions and configures the full platform layer for the
Fabric Smart Warehouse project: container runtime, Kubernetes, secrets management,
observability, and CI/CD tooling. Designed to be re-run safely after every VM restart.

## Architecture

This playbook is organized into five independent, ordered roles:

| Order | Role | Responsibility |
|---|---|---|
| 1 | [`base-setup`](roles/base-setup/README.md) | Docker, MicroK8s, core addons (dns, storage) |
| 2 | [`vault`](roles/vault/README.md) | HashiCorp Vault — secrets, Kubernetes auth, policies |
| 3 | [`monitoring`](roles/monitoring/README.md) | Prometheus + Grafana (kube-prometheus-stack) |
| 4 | [`jenkins`](roles/jenkins/README.md) | Jenkins CI server |
| 5 | [`argocd`](roles/argocd/README.md) | ArgoCD GitOps continuous deployment |

Each role lives under `roles/<name>/` and follows the standard Ansible role layout
(`tasks/main.yml`, optionally `defaults/main.yml`). See each role's own README for
configuration details, access credentials, and known limitations.

## Usage

```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml -e @secrets.yml
```

### When to run this

- **First-time setup** of a fresh VM.
- **After every VM restart** (`az vm deallocate` / `az vm start`) — required because
  Vault runs in dev mode (in-memory storage) and loses its secrets, auth config, and
  policies on every restart. Re-running this playbook restores them.
- **After any change** to a role's tasks or defaults — safe to re-run any number of
  times (every task is idempotent).

## Project structure

```
ansible/
├── README.md                  ← you are here
├── playbook.yml                ← entry point, declares role order
├── inventory.ini                ← target host (local)
├── secrets.yml                  ← sensitive variables (not committed in cleartext — see note below)
└── roles/
    ├── base-setup/
    │   └── tasks/main.yml
    ├── vault/
    │   ├── tasks/main.yml
    │   └── README.md
    ├── monitoring/
    │   ├── tasks/main.yml
    │   ├── defaults/main.yml
    │   └── README.md
    ├── jenkins/
    │   ├── tasks/main.yml
    │   ├── defaults/main.yml
    │   └── README.md
    └── argocd/
        ├── tasks/main.yml
        ├── defaults/main.yml
        └── README.md
```

## Design decisions & trade-offs

- **Vault runs in dev mode** (in-memory storage) rather than a production-grade
  persistent backend. This avoids the complexity of an unsealing ceremony, at the
  cost of losing all secrets on every pod restart. This playbook is the mitigation:
  it re-seeds Vault's secret, policy, role, and Kubernetes auth configuration on
  every run, acting as a declarative source of truth.
- **All Helm-based tasks use the `command` module** rather than the dedicated
  `kubernetes.core.helm` Ansible module, to avoid an additional collection
  dependency in a time-constrained coursework environment. As a result, these
  tasks always report `changed` (since `helm upgrade --install` always prints
  "upgraded"/"installed" regardless of whether anything actually changed) —
  a known cosmetic limitation, not a functional one.
- **NodePort services everywhere**, no Ingress controller or TLS — appropriate
  for a single-VM coursework deployment, not representative of a production
  setup.

## Security note

`secrets.yml` contains sensitive values (database URIs, access keys) and should
never be committed in cleartext. In this repository it is excluded via
`.gitignore` / encrypted separately — confirm this before pushing changes.