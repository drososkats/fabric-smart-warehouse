# Role: base-setup

## Purpose
Prepares a fresh Ubuntu VM with the foundational dependencies required by every
other role in this play: Docker, MicroK8s, and the core MicroK8s addons
(`dns`, `storage`). This is the first role in the playbook and everything else
builds on top of it.

## What it does
1. Updates the apt package cache
2. Installs base dependencies (`ca-certificates`, `curl`, `apt-transport-https`,
   `software-properties-common`)
3. Installs Docker and adds the target user to the `docker` group
4. Installs MicroK8s via snap (classic confinement) and adds the target user to
   the `microk8s` group
5. Enables the core MicroK8s addons

## Variables (`defaults/main.yml`)

| Variable | Default | Description |
|---|---|---|
| `base_setup_user` | `azureuser` | System user added to the `docker` and `microk8s` groups |
| `base_setup_apt_cache_valid_time` | `3600` | Max age (seconds) of the apt cache before it is refreshed |
| `base_setup_microk8s_addons` | `"dns storage"` | Space-separated list of MicroK8s addons to enable |

## Dependencies
None. This role has no dependency on the other roles in this project and should
run first.

## Example

```yaml
- hosts: local
  become: true
  roles:
    - base-setup
```

## Notes
- **Idempotent:** safe to re-run. The `apt`, `snap`, and `user` modules are
  idempotent by design, and the addon task only reports a change when an addon
  was not already enabled.
- Group membership changes (`docker`, `microk8s`) require a new login session
  (or `newgrp`) to take effect in **interactive** shells. This does not affect
  Ansible itself, since `become` is used for privilege escalation regardless of
  group membership.