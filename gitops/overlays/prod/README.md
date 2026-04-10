[← Back to main README](../../README.md)

# Prod Overlay

Production environment for the Canadian Dental Care Plan.

| Property       | Value                               |
| -------------- | ----------------------------------- |
| Cluster        | `dts-prod-sced-rhp-spoke-aks`       |
| Tier           | prod                                |
| Name suffix    | _(none)_                            |
| Image registry | `dtsrhpprodscedspokeacr.azurecr.io` |

## Base Components

- Error Pages (404)
- Frontend
- Fluentd Archiver
- Maintenance
- Redis
- Reloader

## Additional Resources

- External secrets (HashiCorp Vault)
- Horizontal Pod Autoscaler (HPA) — Frontend scales from 2 to 64 replicas at 75% CPU
- Ingress (public and internal)

## Patches

- `patches/deployments-frontend.yaml` — Adds OAuth proxy and fluentd sidecars, pins production image versions
- `patches/deployments-error-404.yaml` — Error page deployment overrides
- `patches/deployments-maintenance.yaml` — Maintenance page deployment overrides
- `patches/pvcs.yaml` — Persistent volume claim overrides
- `patches/services.yaml` — Service customizations
- `patches/stateful-sets.yaml` — Redis StatefulSet overrides (3 replicas, pinned image versions)

## Configuration Overrides

- `configs/frontend/config.conf` — Production frontend settings
- `configs/frontend-fluentd/fluentd.conf` — Fluentd audit log forwarding rules
- `configs/redis/` — Redis configuration overrides
- OAuth proxy secret created via `secretGenerator`
- Maintenance ConfigMap with time window literals (`startTimeEn`, `startTimeFr`, `endTimeEn`, `endTimeFr`)

## Ingress

- **Public**: `srv024.service.canada.ca`
- **Internal**: `canada-dental-care-plan.prod-dp-internal.dts-stn.com`
- Maintenance and error page ingresses available as commented alternatives for switchover

## Notes

This is the only overlay targeting the production cluster and tier. All images use pinned version tags.
Secret rotation is handled automatically via Reloader annotations.
