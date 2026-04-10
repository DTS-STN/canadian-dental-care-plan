[← Back to main README](../README.md)

# Base Components

This directory contains environment-agnostic Kustomize base definitions for all services in the Canadian Dental Care
Plan platform. Each component is a self-contained Kustomize base that can be referenced by overlays.

## Components

### Frontend

Node.js/React web application serving the public-facing dental care plan site.

| Property        | Value                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| Port            | 3000                                                                                          |
| Image           | `dtsrhpdevscedacr.azurecr.io/canada-dental-care-plan/canada-dental-care-plan-frontend:latest` |
| Resources       | 500m–1000m CPU, 512–1024Mi memory                                                             |
| Update strategy | RollingUpdate (maxUnavailable: 0%, maxSurge: 100%)                                            |
| Probes          | TCP liveness on :3000, HTTP readiness on `/api/readyz`                                        |

**Generators:**

- `configMapGenerator`: `frontend` from `configs/config.conf`
- `secretGenerator`: `frontend` from `configs/secrets.conf`

### Backend

Java/Spring Boot API service.

| Property | Value                                         |
| -------- | --------------------------------------------- |
| Port     | 8080                                          |
| Probes   | `/actuator/health` for liveness and readiness |

### Redis

Redis with Sentinel for high-availability session storage.

| Property | Value                                             |
| -------- | ------------------------------------------------- |
| Ports    | 6379 (Redis), 26379 (Sentinel)                    |
| Storage  | 2Gi PVC per replica                               |
| Security | `readOnlyRootFilesystem`, no privilege escalation |

An init container runs `init.sh` to configure primary/replica modes and Sentinel discovery.

**Generators:**

- `configMapGenerator`: `redis` from `configs/init.sh`, `configs/primary.conf`, `configs/replica.conf`, `configs/sentinel.conf`
- `secretGenerator`: `redis` from `configs/secrets.conf`

### PostgreSQL (Crunchy Data)

PostgreSQL 16 cluster managed by the Crunchy Data Postgres Operator (PGO).

| Property           | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Version            | 16.3                                                              |
| Instances          | 3 replicas with pod anti-affinity                                 |
| Storage            | 265Gi per instance                                                |
| Backups            | pgBackRest — full backup every 8 hours, 3-backup retention        |
| Connection pooling | pgBouncer with 3 replicas                                         |
| Users              | `postgres` (superuser), `canadian-dental-care-plan` (application) |

### Postgres Operator

Crunchy Data Postgres Operator (v5.6.0) controller for managing PostgreSQL clusters. Includes RBAC resources
(Role, RoleBinding, ServiceAccount) with permissions to manage core Kubernetes resources.

### Fluentd Archiver

Centralized audit log aggregation using Fluentd.

| Property | Value                      |
| -------- | -------------------------- |
| Port     | 24224                      |
| Storage  | PVC (`audit-logs`)         |
| Security | fsGroup: 101 (fluent user) |

**Generators:**

- `configMapGenerator`: `fluentd-archiver` from `configs/fluentd.conf`

### Maintenance

Nginx-based 503 maintenance page served during planned downtime windows.

| Property | Value |
| -------- | ----- |
| Port     | 80    |

An init container preprocesses the HTML template by substituting maintenance window times (English/French) from
ConfigMap literals.

**Generators:**

- `configMapGenerator`: `maintenance` from `configs/503.html`, `configs/config.conf`, plus `startTimeEn`, `startTimeFr`, `endTimeEn`, `endTimeFr` literals

### Error Pages (404)

Custom nginx-based 404 error page.

**Generators:**

- `configMapGenerator`: `error-404` from `configs/404.html`, `configs/config.conf`

### Reloader

[Stakater Reloader](https://github.com/stakater/Reloader) (v1.4.1) automatically restarts pods when their referenced
ConfigMaps or Secrets change.

| Property | Value |
| -------- | ----- |
| Port     | 9090  |

### Squid Proxy

HTTP/HTTPS forward proxy for outbound traffic filtering.

| Property  | Value                            |
| --------- | -------------------------------- |
| Port      | 3128                             |
| Resources | 100m CPU, 32Mi memory (requests) |
