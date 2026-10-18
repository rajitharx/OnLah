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

Render sets `PORT` itself. The container listens on it.

Health check path: `/health`. It returns 503 when the database cannot be reached within 5 seconds.

## Cloudflare Pages (web)

| Setting | Value |
|---|---|
| Framework preset | None (Vite) |
| Root directory | `apps/web` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node version | 22 (set `NODE_VERSION=22` if the build picks an older default) |

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Render API URL, for example `https://onlah-api.onrender.com` |

The production build fails when `VITE_API_BASE_URL` is missing, so a deploy cannot ship pointing at localhost. Vite bakes the value in at build time. Changing it needs a new build.

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
