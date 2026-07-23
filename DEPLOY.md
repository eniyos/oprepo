# Deploy — OpRepo free hosting stack

Everything runs on Oracle Cloud's **Always Free** ARM VM (4 cores, 24 GB RAM,
permanent, no trial expiry). The frontend deploys to Vercel's free tier.

**Total cost: $0/month.**

## Architecture

```
Browser ─► Cloudflare DNS ─► Vercel (frontend, free)
                                │
                                ▼
                     Oracle Cloud ARM VM
                     ┌─────────────────────────┐
                     │  Caddy (auto HTTPS)      │
                     │    ├── api:4000          │
                     │    └── ml:8000           │
                     │  NestJS API               │
                     │  ML Service               │
                     │  PostgreSQL + pgvector    │
                     │  Redis                    │
                     │  Qdrant                  ─────────┘
```

## Prerequisites

- [Oracle Cloud account](https://signup.cloud.oracle.com/) (free tier)
- [Vercel account](https://vercel.com/signup) (free)
- [Cloudflare account](https://dash.cloudflare.com/signup) (free)
- A domain name (e.g. `oprepo.dev` — ~$10/year)

---

## Phase 1 — Provision the VM

1. Sign up for Oracle Cloud, go to **Compute → Instances**
2. Create an **"Always Free" ARM Ampere A1 instance**:
   - Image: **Ubuntu 24.04 LTS**
   - Shape: VM.Standard.A1.Flex (up to 4 OCPUs, 24 GB RAM)
   - Add your SSH public key
3. Note the public IP, add it to your SSH config:

```bash
# ~/.ssh/config
Host oprepo
  HostName <your-vm-ip>
  User ubuntu
  IdentityFile ~/.ssh/id_ed25519
```

---

## Phase 2 — Install Docker on the VM

```bash
ssh oprepo

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit

# Reconnect
ssh oprepo

# Verify
docker --version
docker compose version
```

---

## Phase 3 — Clone and configure

```bash
ssh oprepo
git clone https://github.com/eniyos/oprepo.git ~/oprepo
cd ~/oprepo

# Create production secrets
cp .env.production.example .env.production
nano .env.production   # add GITHUB_TOKEN and any other secrets
```

---

## Phase 4 — Start everything

```bash
cd ~/oprepo

# Start all services
docker compose \
  -f docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  up -d --build

# Verify health
curl http://localhost:4000/api/v1/health
# → {"status":"ok",...}

curl http://localhost:6333/collections
# → Qdrant is running

# Run the data migration (from pgvector to Qdrant)
docker compose exec -T api node scripts/migrate-to-qdrant.mjs
```

---

## Phase 5 — DNS + SSL

1. **Cloudflare**: Add your domain → Free plan
2. **DNS records**:
   - `A api.oprepo.dev` → your VM IP (proxied: orange cloud)
   - `CNAME @ oprepo.vercel.app` (or however Vercel sets it up)
3. **Caddy** auto-provisions Let's Encrypt certs within minutes once
   the DNS record propagates.

---

## Phase 6 — Deploy the frontend

1. Connect your GitHub repo to **Vercel** (free)
2. Set root directory to `apps/web`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://api.oprepo.dev`
4. Deploy
5. Configure the domain in Vercel's dashboard

---

## Phase 7 — CI/CD

The `.github/workflows/deploy.yml` workflow automatically:

1. Runs on every push to `main`
2. **Verify job**: typecheck + lint both API and web
3. **Deploy job**: SSHs into the VM, pulls, rebuilds, and restarts

**To enable it**, add these secrets to your GitHub repo:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | Your VM's public IP |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | Your private SSH key |

---

##

A cron job runs nightly `pg_dump` and optionally uploads to Backblaze B2:

```bash
# Set up the cron job on the VM
crontab -e
# Add:
0 4 * * * /home/ubuntu/oprepo/scripts/backup-db.sh >> /home/ubuntu/backups/backup.log 2>&1
```

For B2 backup, install the CLI and authorize:
```bash
pip install b2
b2 authorize-account <applicationKeyId> <applicationKey>
```

---

## Monitoring

| Service | Free tier | What to monitor |
|---------|-----------|-----------------|
| [UptimeRobot](https://uptimerobot.com/) | 50 monitors, 5-min intervals | `https://api.oprepo.dev/api/v1/health` |
| [Sentry](https://sentry.io/) | 5k events/month | Error tracking for API + frontend |
| VM metrics | Built into Oracle Cloud console | CPU, memory, disk |

---

## Maintenance

```bash
# View logs
docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml logs -f api

# Restart a single service
docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml restart api

# Full rebuild
docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d --build

# Manual deploy (if not using GH Actions)
rsync -az --delete --exclude='node_modules' --exclude='.git' ./ oprepo:~/oprepo/
ssh oprepo 'cd ~/oprepo && docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d --build'
```

## Troubleshooting

**Caddy SSL not provisioning?**
Check the DNS A record is proxied through Cloudflare (orange cloud) and
port 443 is reachable from the internet.

**Out of disk space?**
```bash
docker system prune -af
df -h
```
The Oracle free tier gives 200 GB block storage by default.

**ML service crashes on startup (OOM)?**
The cross-encoder uses ~600 MB RAM. Ensure you didn't limit the ML
container's memory below 1 GB, or switch to a smaller cross-encoder:
`cross-encoder/ms-marco-TinyBERT-L-2-v2` (~300 MB).
