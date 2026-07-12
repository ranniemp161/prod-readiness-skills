# IaC Red Flags — Greppable Patterns

Concrete patterns to search for in infrastructure code. Hits are leads; confirm in context before reporting.

## Terraform / HCL

**Public exposure**
- `cidr_blocks\s*=\s*\["0.0.0.0/0"\]` — check the port: 80/443 on a public LB is fine; 22/3389/5432/6379/27017/9200 is critical
- `publicly_accessible\s*=\s*true` (RDS)
- `acl\s*=\s*"public` or `block_public_acls\s*=\s*false` (S3); missing `aws_s3_bucket_public_access_block` entirely
- `assign_public_ip\s*=\s*true` on services that only need egress

**IAM**
- `"Action"\s*:\s*"\*"` or `actions\s*=\s*\["\*"\]`; `Resource.*\*` on data-access actions
- `AdministratorAccess` attached to service roles
- `aws_iam_access_key` resources (long-lived keys in TF state — state also now contains the secret)

**Secrets & state**
- `default\s*=` on variables named like secrets/passwords (defaults end up in git)
- `*.tfvars` committed containing credentials
- No `backend "s3"`/`"gcs"`/remote backend block → state on laptops (critical: state contains secrets AND no locking)

**Reliability**
- Single instance resources without `multi_az = true` / replica config on the critical path
- `skip_final_snapshot = true` + `deletion_protection` absent on prod databases
- `force_destroy = true` on buckets holding real data
- Hardcoded AMI/zone strings that break region failover

## Kubernetes / Helm

**Security**
- `privileged: true`; `hostNetwork: true`; `hostPID: true`; `runAsUser: 0` or no `securityContext` at all
- `allowPrivilegeEscalation` not set to false; missing `readOnlyRootFilesystem` on stateless pods
- Secrets as env vars in plain manifests committed to git (base64 ≠ encryption)
- `image: .*:latest` or no tag — undeployable-rollback smell: you can't roll back to "latest"

**Reliability**
- No `resources.requests`/`limits` → node pressure evictions and noisy-neighbor
- `replicas: 1` on critical Deployments; no `PodDisruptionBudget` → voluntary disruptions take it down
- Missing `readinessProbe` (traffic hits unready pods on deploy) — and a `livenessProbe` that checks the database (restart-loops the fleet during a DB blip: probe anti-pattern)
- No `topologySpreadConstraints`/anti-affinity → all replicas on one node
- `terminationGracePeriodSeconds` default with an app that needs longer draining
- `imagePullPolicy: Always` + registry outage = can't reschedule pods

## Dockerfile
- No `USER` directive (runs as root); `ADD` of remote URLs; secrets via `ARG`/`ENV`
- No healthcheck; PID-1 shell wrapping the app (`sh -c` swallows SIGTERM — graceful shutdown never runs); missing `exec` form
- Unpinned base image (`FROM node` vs `FROM node:22.4-slim`)

## docker-compose (when used in prod)
- Default credentials: `POSTGRES_PASSWORD=postgres`, `MYSQL_ROOT_PASSWORD=root`
- `ports:` exposing DB/cache to host on a public server (5432:5432 on an internet-facing VM = public database)
- `restart:` policy absent; data services without named volumes (data dies with the container)

## Cost Smells (any provider)
- NAT gateway + heavy S3/registry traffic without VPC gateway endpoints (per-GB processing on free-able traffic)
- `gp2` volumes (gp3 is ~20% cheaper, same or better perf); unattached EBS/EIP resources in state
- CloudWatch/Stackdriver logs with no retention policy (`retention_in_days` unset = forever)
- Provisioned-IOPS or large instance classes on dev/staging environments; NAT gateway per environment where one suffices for non-prod
- Cross-AZ traffic between chatty services (data transfer often exceeds instance costs at scale)
- No lifecycle rules on buckets that accumulate (logs, artifacts, backups)

## Drift & Hygiene
- Resources referenced in app code (queue names, bucket names, topics) with no matching IaC definition → click-ops drift
- `terraform plan` not run in CI on PRs; applies from laptops (ask — not greppable)
- No environment separation: one state file / one account for dev+prod
