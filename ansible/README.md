# Fabric Smart Warehouse — Infrastructure Automation

![Ansible](https://img.shields.io/badge/Ansible-2.x-EE0000?logo=ansible&logoColor=white)
![Idempotent](https://img.shields.io/badge/Idempotent-yes-success)
![Structure](https://img.shields.io/badge/Structure-Roles-blue)
![MicroK8s](https://img.shields.io/badge/Kubernetes-MicroK8s-326CE5?logo=kubernetes&logoColor=white)

Ansible automation that provisions and configures the full platform layer for the
Fabric Smart Warehouse project: container runtime, Kubernetes, secrets management,
observability, serverless, CI/CD, and FinOps tooling. Designed to be re-run safely
after every VM restart.

## Architecture

This playbook is organized into seven independent, ordered roles:

| Order | Role | Responsibility |
|---|---|---|
| 1 | base-setup | Docker, MicroK8s, core addons (dns, storage) |
| 2 | vault | HashiCorp Vault - secrets, Kubernetes auth, policies |
| 3 | monitoring | Prometheus + Grafana (kube-prometheus-stack) |
| 4 | jenkins | Jenkins CI server |
| 5 | argocd | ArgoCD GitOps continuous deployment |
| 6 | knative | Knative Serving addon + MinIO Client (mc) install |
| 7 | infracost | Infracost CLI install (FinOps cost estimation) |

Each role lives under roles/<name>/ and follows the standard Ansible role layout
(tasks/main.yml, optionally defaults/main.yml).

## Usage

```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

secrets.yml is loaded automatically via the playbook's vars_files directive.

### When to run this

- First-time setup of a fresh VM.
- After every VM restart (az vm deallocate / az vm start) - most roles are
  fully idempotent and safe to re-run. Exception: Vault. Vault uses persistent
  file storage (not dev mode), so its data survives pod restarts, but Vault itself
  comes back up sealed after every restart and requires a manual unseal step
  before this playbook's vault role tasks (which write secrets, policies, and
  auth config) can succeed. See the manual unseal procedure below.
- After any change to a role's tasks or defaults - safe to re-run any number of
  times (every task is idempotent).

### Manual Vault unseal (required after every VM restart)

```bash
microk8s kubectl exec -n default vault-0 -- vault operator unseal <unseal-key>
```

This must be run before ansible-playbook if the vault role tasks are to
succeed - a sealed Vault rejects all vault kv / vault write operations.

## Project structure

```
ansible/
├── README.md                    ← you are here
├── playbook.yml                  ← entry point, declares role order
├── inventory.ini                  ← target host (local)
├── secrets.yml                    ← sensitive variables (gitignored, never committed)
└── roles/
    ├── base-setup/
    │   ├── tasks/main.yml
    │   └── defaults/main.yml
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
    ├── argocd/
    │   ├── tasks/main.yml
    │   ├── defaults/main.yml
    │   └── README.md
    ├── knative/
    │   ├── tasks/main.yml
    │   └── defaults/main.yml
    └── infracost/
        ├── tasks/main.yml
        └── defaults/main.yml
```

## Design decisions & trade-offs

- Vault uses persistent file storage with a Shamir seal, not dev mode. This
  gives durable secrets across pod restarts, at the cost of requiring a manual
  vault operator unseal after every VM restart - there is no auto-unseal
  mechanism configured (would require a cloud KMS integration, out of scope for
  this coursework deployment).
- All Helm-based tasks use the command module rather than the dedicated
  kubernetes.core.helm Ansible module, to avoid an additional collection
  dependency in a time-constrained coursework environment. As a result, these
  tasks always report changed (since helm upgrade --install always prints
  "upgraded"/"installed" regardless of whether anything actually changed) -
  a known cosmetic limitation, not a functional one.
- Infracost CLI is installed but not auto-authenticated. Running
  infracost breakdown requires a one-time, interactive infracost auth login
  (browser-based) or infracost configure set api_key <key>, tied to a personal
  free account. This step is intentionally left manual - committing a personal
  API key to the playbook would leak it into version control.
- NodePort services everywhere, no Ingress controller or TLS - appropriate
  for a single-VM coursework deployment, not representative of a production
  setup.

## Security note

`secrets.yml` contains sensitive values (database URIs, access keys) and should
never be committed in cleartext. In this repository it is excluded via
`.gitignore` / encrypted separately — confirm this before pushing changes.