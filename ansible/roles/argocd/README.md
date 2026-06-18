# ArgoCD Role

## Purpose
Installs ArgoCD (GitOps continuous deployment controller) via Helm, exposed through
a NodePort service for browser access. ArgoCD continuously monitors a Git repository
and automatically reconciles the live cluster state to match the desired state
defined in version control.

## What this role does
1. Adds the official ArgoCD Helm repository (`argo/argo-cd`)
2. Runs `helm upgrade --install` (idempotent — safe to re-run on every playbook execution)
3. Exposes the ArgoCD server UI as a NodePort service
4. Disables the mandatory HTTPS redirect (`server.insecure=true`), since no TLS
   certificate is configured in this environment

## Configuration
| Variable | Default | Description |
|---|---|---|
| `argocd_nodeport_http` | `30880` | NodePort exposing the ArgoCD web UI |

Override any variable by setting it in `inventory.ini`, `secrets.yml`, or via `-e` on the CLI.

## Accessing ArgoCD

- **URL**: `http://<VM_IP>:30880`
- **Username**: `admin`
- **Password**: auto-generated on first install — retrieve with:

```bash
microk8s kubectl -n default get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

## Dependencies
Requires `base-setup` to have run first (MicroK8s + Helm must be available).
No other role depends on this one.

## Known limitations
- Dev/coursework setup: no TLS, default admin credentials are not rotated.
- The application sync is configured manually via the ArgoCD UI (not declared as
  code in this repo) — see `argocd/` folder at the project root for the
  Application manifest.