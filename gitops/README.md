# Canadian Dental Care Plan GitOps Manifests

This repository contains the Kustomize configuration and application manifests used to manage both the production and
non-production Canadian Dental Care Plan Kubernetes clusters.

All resources deploy to the `canada-dental-care-plan` namespace. Environments are distinguished by a `nameSuffix`
(e.g., `-dev`, `-prod`) applied to every resource name.

## Repository Structure

```text
gitops/
├── base/                   # Environment-agnostic resource definitions
│   ├── backend/            # Java/Spring Boot API service
│   ├── error-pages/404/    # Custom nginx 404 error page
│   ├── fluentd-archiver/   # Centralized audit log aggregation
│   ├── frontend/           # Node.js/React web application
│   ├── maintenance/        # 503 maintenance page
│   ├── postgres/           # Crunchy Data PostgreSQL HA cluster
│   ├── postgres-operator/  # Crunchy Data Postgres Operator
│   ├── redis/              # Redis with Sentinel high availability
│   ├── reloader/           # Stakater Reloader (auto-restart on config changes)
│   └── squid-proxy/        # HTTP/HTTPS forward proxy
├── overlays/               # Environment-specific customizations
│   ├── dev/                # Development environment
│   ├── int1/               # Integration environment 1
│   ├── int2/               # Integration environment 2
│   ├── otto/               # Otto integration environment
│   ├── perf/               # Performance testing environment
│   ├── prod/               # Production environment
│   ├── prototype/          # Prototype environment
│   ├── shared/             # Shared non-prod services (maintenance, reloader, squid-proxy)
│   ├── staging/            # Staging (production-like) environment
│   ├── training/           # Training environment
│   ├── uat1/               # User acceptance testing 1
│   └── uat2/               # User acceptance testing 2
```

See [base/README.md](base/README.md) for details on each base component and the individual overlay READMEs for
environment-specific configuration.

## Quick Links

- [Base components](base/README.md)
- Overlays: [Dev](overlays/dev/README.md) · [Int1](overlays/int1/README.md) · [Int2](overlays/int2/README.md) · [Otto](overlays/otto/README.md) · [Perf](overlays/perf/README.md) · [Prod](overlays/prod/README.md) · [Prototype](overlays/prototype/README.md) · [Shared](overlays/shared/README.md) · [Staging](overlays/staging/README.md) · [Training](overlays/training/README.md) · [UAT1](overlays/uat1/README.md) · [UAT2](overlays/uat2/README.md)

## Environment Feature Matrix

| Environment | Tier | Frontend | Redis | OAuth Proxy | Fluentd Logging | HPA (Auto-scaling) | Error Pages (404) | Maintenance Page | Reloader | Squid Proxy |
| ----------- | ---- | -------- | ----- | ----------- | --------------- | ------------------ | ----------------- | ---------------- | -------- | ----------- |
| Dev         | np   | ✅       | ❌    | ✅          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |
| Int1        | np   | ✅       | ✅    | ✅          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |
| Int2        | np   | ✅       | ✅    | ✅          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |
| Otto        | np   | ✅       | ✅    | ❌          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |
| Perf        | np   | ✅       | ✅    | ✅          | ✅              | ✅                 | ❌                | ❌               | ❌       | ❌          |
| Prod        | prod | ✅       | ✅    | ✅          | ✅              | ✅                 | ✅                | ✅               | ✅       | ❌          |
| Prototype   | np   | ✅       | ❌    | ❌          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |
| Shared      | np   | ❌       | ❌    | ❌          | ❌              | ❌                 | ❌                | ✅               | ✅       | ✅          |
| Staging     | np   | ✅       | ✅    | ✅          | ✅              | ✅                 | ✅                | ❌               | ❌       | ❌          |
| Training    | np   | ✅       | ❌    | ❌          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |
| UAT1        | np   | ✅       | ✅    | ✅          | ❌              | ❌                 | ❌                | ✅               | ❌       | ❌          |
| UAT2        | np   | ✅       | ✅    | ✅          | ❌              | ❌                 | ❌                | ❌               | ❌       | ❌          |

> **np** = nonprod

## Key Patterns

- **External Secrets** — Overlays use `ExternalSecret` resources to pull secrets from HashiCorp Vault
  (`secretStoreRef: vault-backend`), refreshing every hour.
- **Reloader** — Deployments annotated with `secret.reloader.stakater.com/auto: 'true'` automatically restart
  when their referenced secrets change.
- **Strategic Merge Patches** — Overlays inject sidecars (oauth2-proxy, fluentd) and override images/resources
  via patch files in `patches/`.
- **ConfigMap/Secret Generators** — Base components define generators; overlays use `behavior: merge` or
  `behavior: replace` to override values per environment.
- **Image Registries** — Nonprod uses `dtsrhpdevscedacr.azurecr.io`; prod uses `dtsrhpprodscedspokeacr.azurecr.io`
  with pinned image versions.

> **⚠️ Warning:** Changes to `base/` affect **all** environments, including production. Review base changes carefully
> before merging. Some projects mitigate this risk by maintaining separate bases for nonprod and prod; this project
> uses a single shared base with overlay patches to differentiate environments.

## Requirements

This project has been tested with the following toolchain:

| Tool                                               | Version  |
| -------------------------------------------------- | -------- |
| [Kubectl](https://kubernetes.io/docs/tasks/tools/) | ≥ 1.25.x |
| [Kustomize](https://kustomize.io/)                 | ≥ 5.0.x  |

## Usage

### Preview rendered manifests

```shell
kustomize build ./overlays/{target-environment}
```

### Apply manifests to a cluster

```shell
kubectl --kubeconfig {path-to-kubeconfig} -n canada-dental-care-plan apply --kustomize ./overlays/{target-environment}
```

### Validate manifests without applying

```shell
kubectl --kubeconfig {path-to-kubeconfig} -n canada-dental-care-plan apply --kustomize ./overlays/{target-environment} --dry-run=client
```
