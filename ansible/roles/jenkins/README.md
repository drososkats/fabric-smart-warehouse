# Role: jenkins

## Purpose
Installs Jenkins via Helm, exposed as a NodePort, providing the CI server used
by this project's pipeline (lint → unit tests → build image → push to
Docker Hub).

## What it does
1. Adds the official Jenkins Helm repository
2. Updates Helm repositories
3. Installs or upgrades Jenkins with:
   - The controller exposed as a NodePort service
   - A fixed admin password (for assignment/demo convenience)
   - The config auto-reload sidecar disabled (pipeline config is managed via
     the Jenkinsfile in the application repo, not live-reloaded ConfigMaps)

## Variables (`defaults/main.yml`)

| Variable | Default | Description |
|---|---|---|
| `jenkins_user` | `azureuser` | User Ansible uses to run Helm commands (`become_user`) |
| `jenkins_release_name` | `jenkins` | Helm release name for the Jenkins chart |
| `jenkins_nodeport` | `30808` | NodePort the Jenkins controller UI is exposed on |
| `jenkins_admin_password` | `admin123` | Jenkins admin password |

## Dependencies
Requires `base-setup` to have run first (MicroK8s + Helm must be available).

## Example

```yaml
- hosts: local
  become: true
  roles:
    - base-setup
    - jenkins
```

## Notes
- **Demo-grade credentials:** the admin password is a fixed, simple value,
  appropriate for an isolated MSc assignment VM — not meant to be reused as-is
  in a production environment.
- **Idempotent:** safe to re-run. `helm upgrade --install` only reports a
  change when the release was actually installed or upgraded.