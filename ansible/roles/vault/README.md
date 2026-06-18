# Role: vault

## Purpose
Installs HashiCorp Vault via Helm (dev mode, exposed as a NodePort) and bootstraps
it for application use: stores the application's runtime secrets, enables the
Kubernetes auth method, and creates a least-privilege policy and role so the
backend pod can authenticate to Vault using its own service account token.

## What it does
1. Adds the HashiCorp Helm repository
2. Installs Vault via Helm (`server.dev.enabled=true`, exposed as NodePort)
3. Waits for the `vault-0` pod to become ready
4. Writes the application secrets (`mongo_uri`, `minio_access_key`,
   `minio_secret_key`) into Vault's KV store
5. Enables the `kubernetes` auth method in Vault
6. Configures the Kubernetes auth method (token reviewer JWT + CA cert), so Vault
   can validate Kubernetes service account tokens
7. Writes a read-only policy scoped to the application's secret path
8. Creates a Kubernetes role binding the policy to the backend's service account

## Variables (`defaults/main.yml`)

| Variable | Default | Description |
|---|---|---|
| `vault_user` | `azureuser` | User Ansible uses to run Helm/kubectl commands (`become_user`) |
| `vault_nodeport` | `30820` | NodePort the Vault UI/API is exposed on |
| `vault_addr` | `http://127.0.0.1:8200` | `VAULT_ADDR` used when writing secrets from inside the pod |
| `vault_root_token` | `root` | Dev-mode root token (Vault is running in `dev` mode — **not** for production use) |
| `vault_secret_path` | `secret/fabric` | KV path (CLI-style) where application secrets are stored |
| `vault_policy_path` | `secret/data/fabric` | KV path (API-style, `data/` segment) referenced inside the policy document |
| `vault_policy_name` | `fabric-policy` | Name of the read-only Vault policy |
| `vault_k8s_role_name` | `fabric-backend` | Name of the Vault Kubernetes auth role |
| `vault_bound_service_account_name` | `default` | Kubernetes service account allowed to assume the role |
| `vault_bound_service_account_namespace` | `default` | Namespace the bound service account must belong to |
| `vault_role_ttl` | `24h` | Token TTL issued when the backend authenticates via this role |

## Required variables (from `secrets.yml`, not part of this role)

| Variable | Description |
|---|---|
| `vault_mongo_uri` | MongoDB connection string stored in Vault |
| `vault_minio_access_key` | MinIO access key stored in Vault |
| `vault_minio_secret_key` | MinIO secret key stored in Vault |

## Dependencies
Requires `base-setup` to have run first (MicroK8s + Helm must be available).

## Example

```yaml
- hosts: local
  become: true
  roles:
    - base-setup
    - vault
```

## Notes
- **Dev mode:** Vault runs with `server.dev.enabled=true`, which auto-unseals and
  uses a fixed root token (`root`). This is intentional for this project's scope
  (MSc assignment, single VM) but is **not** a production-safe configuration —
  in production Vault would run with proper storage backend, auto-unseal via
  cloud KMS, and no static root token.
- **KV v2 path nuance:** `vault kv put` and `vault kv get` use the *logical*
  mount path (`secret/fabric`), while raw policy documents must reference the
  *API* path including the `data/` segment (`secret/data/fabric`). This is why
  the role exposes two separate path variables instead of deriving one from
  the other.
- **Idempotent:** safe to re-run. `helm upgrade --install` and the Vault writes
  are all safe to repeat; the auth-enable task tolerates "already enabled"
  responses via `failed_when: false`.