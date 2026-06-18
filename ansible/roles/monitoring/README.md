# Role: monitoring

## Purpose
Sets up the observability stack for the cluster: enables the MicroK8s
`metrics-server` addon (required for resource metrics and autoscaling) and
installs the `kube-prometheus-stack` Helm chart, which bundles Prometheus
(metrics collection) and Grafana (dashboards), both exposed as NodePorts.

## What it does
1. Enables the MicroK8s `metrics-server` addon
2. Adds the `prometheus-community` Helm repository
3. Installs or upgrades `kube-prometheus-stack` with:
   - Grafana and Prometheus both exposed as NodePort services
   - A fixed Grafana admin password (for assignment/demo convenience)
   - Grafana dashboard/datasource sidecars disabled (no auto-discovery ConfigMaps in use)
   - Grafana persistence enabled, backed by a PersistentVolumeClaim

## Variables (`defaults/main.yml`)

| Variable | Default | Description |
|---|---|---|
| `monitoring_user` | `azureuser` | User Ansible uses to run Helm/MicroK8s commands (`become_user`) |
| `monitoring_release_name` | `monitoring` | Helm release name for the `kube-prometheus-stack` chart |
| `monitoring_grafana_nodeport` | `30300` | NodePort Grafana is exposed on |
| `monitoring_prometheus_nodeport` | `30909` | NodePort Prometheus is exposed on |
| `monitoring_grafana_admin_password` | `admin123` | Grafana admin password |
| `monitoring_grafana_persistence_enabled` | `true` | Whether Grafana dashboards/settings persist across pod restarts |
| `monitoring_grafana_persistence_size` | `1Gi` | Size of the Grafana PersistentVolumeClaim |

## Dependencies
Requires `base-setup` to have run first (MicroK8s + Helm must be available).

## Example

```yaml
- hosts: local
  become: true
  roles:
    - base-setup
    - monitoring
```

## Notes
- **Sidecars disabled by design:** Grafana's dashboard/datasource sidecars
  (which auto-import resources from labeled ConfigMaps) are explicitly turned
  off, since this project does not provision such ConfigMaps. Leaving them
  enabled would have no effect other than extra background polling.
- **Demo-grade credentials:** the Grafana admin password is a fixed, simple
  value, appropriate for an isolated MSc assignment VM — not meant to be
  reused as-is in a production environment.
- **Idempotent:** safe to re-run. `helm upgrade --install` and the addon-enable
  task only report a change when something actually changed.