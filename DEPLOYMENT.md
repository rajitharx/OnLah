# Deployment

The stack runs on three free tiers:

| Part | Host | Source |
|---|---|---|
| API (ASP.NET Core, Docker) | Render web service, Singapore | `Dockerfile`, `render.yaml` |
| Database (PostgreSQL) | Neon, SSL required | Connection string from the Neon console |
| Web board (Vite, static) | Cloudflare Pages | `apps/web` |

Render deploys the API from `main` automatically. Cloudflare Pages deploys the web app from its own Git connection to the same repository.

## Setup order

1. Create the Neon database and copy its connection string.
2. Apply migrations to Neon (see [Running migrations](#running-migrations)).
3. Create the Render service from `render.yaml`, then enter its environment variables.
4. Deploy the API and note its URL, for example `https://onlah-api.onrender.com`.
5. Create the Cloudflare Pages project, then set its build settings and `VITE_API_BASE_URL`.
6. Note the Pages URL, for example `https://onlah.pages.dev`, and set it as `Cors__AllowedOrigins` on Render. Render redeploys.

## Render (API)

Set these in the service's Environment tab. `render.yaml` marks each one `sync: false`, so Render asks for the value and never stores it in Git.

| Variable | Value | Notes |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Neon connection string | Must include `Ssl Mode=Require`. Copy it from the Neon console. |
| `Cors__AllowedOrigins` | Web origins, comma-separated | Exact origins, no trailing slash, for example `https://onlah.pages.dev`. |
| `Lta__AccountKey` | LTA DataMall account key | The app will not start without it. |
| `Admin__ApiKey` | Random string for the admin sync endpoints | Generate a long random value. |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Set in `render.yaml`. |
| `RateLimiting__Enabled` | Optional, default `false` | Turns on the per-client limit for `/api/v1`. Read [Client IPs and rate limiting](#client-ips-and-rate-limiting) first. |
| `RateLimiting__PermitLimit` | Optional, default `120` | Requests each client IP may make to `/api/v1` per window. |
| `RateLimiting__WindowSeconds` | Optional, default `60` | Length of the rate-limit window. |
| `RateLimiting__LogClientIp` | Optional, default `false` | Logs the client IP headers of the first 50 `/api/v1` requests after each start (`/health` polls are not counted). |
| `ForwardedHeaders__KnownNetworks` | Optional, default loopback only | Comma-separated CIDRs of proxies allowed to set the client IP. |
| `ForwardedHeaders__ForwardedForHeaderName` | Optional, default `X-Forwarded-For` | Header to read the client IP from, for example `CF-Connecting-IP`. |
| `ForwardedHeaders__ForwardLimit` | Optional, default `1` | How many proxy hops to read back from the end of the header. |
| `Lta__TrainAlertCacheSeconds` | Optional, default `30` | How long one LTA train-alert response is shared by all callers. |

Render sets `PORT` itself. The container listens on it.

### Client IPs and rate limiting

Rate limiting is off by default. When `RateLimiting__Enabled=true`, `/api/v1` allows each client IP `RateLimiting__PermitLimit` requests per window and returns 429 with `Retry-After` past that. `/health` is never limited.

The API takes the client IP from the forwarded header only when the connection comes from a network in `ForwardedHeaders__KnownNetworks`. Otherwise it uses the connection's own address. It reads `ForwardedHeaders__ForwardLimit` hops back from the end of the header, so with the default of 1 it trusts only the entry the nearest proxy added.

We have not confirmed what Render sends. Render sits behind Cloudflare, and a proxy that appends to `X-Forwarded-For` can leave a Cloudflare edge address as the last entry. If the API keys the limit on a proxy or edge address, every user behind it shares one bucket, and they all get 429 together. Do not enable the limiter until the client IP is confirmed.

To find the right settings:

1. Set `RateLimiting__LogClientIp=true` and redeploy.
2. Open the app from two different networks, for example home Wi-Fi and mobile data.
3. In the Render logs, find the `Client IP diagnostic` lines. Each shows the connection's peer address, the resolved client IP, and the raw `X-Forwarded-For`, `CF-Connecting-IP` and `True-Client-IP` values. Only the first 50 `/api/v1` requests after each start are logged. `/health` polls are not counted, so Render's health checks do not use up the slots.
4. Pick the source that holds your real public IP on each network:
   - If `CF-Connecting-IP` does, set `ForwardedHeaders__ForwardedForHeaderName=CF-Connecting-IP`.
   - If the real IP sits further back in `X-Forwarded-For`, set `ForwardedHeaders__ForwardLimit` to the number of entries from the end, and add every proxy hop between it and the API to `ForwardedHeaders__KnownNetworks`.
   - Either way, set `ForwardedHeaders__KnownNetworks` to the CIDR that covers the peer addresses you saw. Without it the API ignores the headers.
5. Redeploy, check that the resolved client IP now matches your real IP on both networks, then set `RateLimiting__LogClientIp=false`.
6. Set `RateLimiting__Enabled=true`.

Avoid `0.0.0.0/0` in `ForwardedHeaders__KnownNetworks` unless the peer addresses change too often to pin. It lets anyone who reaches the service directly choose their own client IP.

If clients get 429 together after enabling, set `RateLimiting__Enabled=false` and repeat the steps above.

Health check path: `/health`. It returns 503 when the database cannot be reached within 5 seconds.

## Cloudflare Pages (web)

| Setting | Value |
|---|---|
| Framework preset | None (Vite) |
| Root directory | `apps/web` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node version | 22 (set `NODE_VERSION=22` if the build picks an older default) |

The production URL is committed in `apps/web/.env.production`, so the build works without any dashboard variable. To point a build somewhere else, set `VITE_API_BASE_URL` in the Pages build environment. Process variables override the file.

Vite bakes the value in at build time. Changing it needs a new build. The build fails if neither the file nor the variable provides a URL, so a deploy cannot ship pointing at localhost.

## Running migrations

The API does not migrate on startup. Run migrations from a machine with the .NET 10 SDK:

```bash
dotnet tool install --global dotnet-ef --version 10.*
scripts/migrate.sh "<Neon connection string>"
```

The script also reads `ConnectionStrings__DefaultConnection` when no argument is passed. On Windows, use `scripts/migrate.ps1 -Connection "<Neon connection string>"`.

Run migrations before deploying a version that needs a schema change. Migrations are applied from the local machine, so the connection string never reaches the image.

## Free-tier behaviour

- Render free web services sleep after a period without traffic. The first request after a sleep can take a while, and the web board shows "Waking up the server…" in that case.
- Neon computes sleep when idle. The API retries failed connections (up to 5 attempts), which covers most cold starts.

## Local development

See the root `README.md`. Local runs use `appsettings.Development.json` and user secrets. The production variables above are not needed locally.
