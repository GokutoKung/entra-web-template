# Entra Web Template

A minimal web app template to **sign in with Microsoft Entra ID (Azure AD)** and
inspect the tokens, claims, and Microsoft Graph data you get back — a starting
point and debugging tool for Azure AD integrations.

- 🔐 Sign in with Microsoft (SPA + MSAL, PKCE flow — **no client secret**)
- 👤 Show the account + **ID token claims** returned by Entra ID
- 🎫 **Acquire token** to view the access token (raw + decoded JWT + copy button)
- 🌐 **Call /me** against Microsoft Graph to view real user data
- 🚪 **Sign out** (also clears the Entra ID server session)

> This is a **public SPA client**. Every config value is public and safe to
> commit to a public repo. There is no secret — and you must **never add one**.

## Configuration at a glance

The app reads a single **`config.yaml`** at runtime (fetched from `/config.yaml`):

- **Local dev** — copy `config/config.yaml.example` to `config/config.yaml` and edit it.
- **Docker** — the container renders `config.yaml` from `AZURE_*` environment
  variables at startup (or mount your own `config.yaml`).

No build-time env vars, no `VITE_` prefixes — one file, resolved at runtime.
The serve port lives in the same file (`server.port`); the `PORT` env var
overrides it.

---

## Tech stack

| Layer                     | Choice                                          |
| ------------------------- | ----------------------------------------------- |
| Runtime / package manager | **Bun**                                         |
| Build tool                | **Vite**                                        |
| UI                        | **React + TypeScript**                          |
| Auth                      | **@azure/msal-browser** + **@azure/msal-react** |
| Config                    | **YAML** (`config.yaml`, parsed at runtime)     |
| Lint / format             | **ESLint + Prettier**                           |
| Tests                     | **Vitest + Testing Library**                    |

Why a SPA (not Next.js / a server): this is a public client using PKCE that runs
entirely in the browser — no backend, no secret — the best fit for a debugging
tool and a public repo.

---

## 1) Register an app in Azure

1. Go to **Azure Portal → Microsoft Entra ID → App registrations → New registration**.
2. Give it a name (e.g. `entra-web-template`).
3. **Redirect URI** → choose platform **Single-page application (SPA)** → enter `http://localhost:5173`.
4. Click **Register**.
5. On the **Overview** page, copy the **Application (client) ID** and **Directory (tenant) ID** into your `config.yaml`.
6. (Recommended) On **API permissions**, add **Microsoft Graph → Delegated → User.Read**, then **Grant admin consent** (or let the user consent at sign-in).

> The redirect URI must be registered under the **Single-page application**
> platform. If it is registered as a **Web** platform instead, MSAL fails with
> `AADSTS9002326: Cross-origin token redemption ...`.

---

## 2) Configure (local dev)

```bash
cp config/config.yaml.example config/config.yaml
```

Then edit `config/config.yaml`:

```yaml
server:
  port: 5173 # dev/container port (env PORT overrides)
azure:
  clientId: '<application-client-id>' # required
  tenantId: '<directory-tenant-id>' # required (or common / organizations / consumers)
  authorityHost: 'login.microsoftonline.com'
  redirectUri: '' # empty = current origin
  postLogoutRedirectUri: '' # empty = same as redirectUri
  scopes:
    - User.Read
```

`config/config.yaml` is gitignored — only `config.yaml.example` is committed.

---

## 3) Run

```bash
bun install
bun run dev
```

Open http://localhost:5173 and click **Sign in with Microsoft**. (The dev port
comes from `server.port` in `config.yaml`; the `PORT` env var overrides it.)

Production build:

```bash
bun run build
bun run preview
```

---

## Docker

The image is configured at **runtime**, so one published image works for any
tenant — set `AZURE_*` environment variables at compose / `docker run` time
(no rebuild, no secrets). They are rendered into `/config.yaml` on startup.

### Use the published image (docker compose)

In [`docker-compose.yml`](docker-compose.yml), set `image:` to your Docker Hub
repo and fill in `AZURE_CLIENT_ID` / `AZURE_TENANT_ID`, then:

```bash
docker compose up -d
```

Open http://localhost:8080. (Keep values out of the file by putting them in a
`.env` next to it — Compose auto-loads it.)

Or run the image directly:

```bash
docker run --rm -p 8080:8080 \
  -e AZURE_CLIENT_ID=<client-id> \
  -e AZURE_TENANT_ID=<tenant-id> \
  YOUR_DOCKERHUB_USER/entra-web-template:latest
```

You can also **mount your own YAML** instead of using env (leave `AZURE_*` unset):

```bash
docker run --rm -p 8080:8080 \
  -v "$(pwd)/config.yaml:/usr/share/nginx/html/config.yaml:ro" \
  YOUR_DOCKERHUB_USER/entra-web-template:latest
```

### Runtime variables

| Variable                         | Required | Default                                                                                           |
| -------------------------------- | :------: | ------------------------------------------------------------------------------------------------- |
| `AZURE_CLIENT_ID`                |    ✅    | —                                                                                                 |
| `AZURE_TENANT_ID`                |    ✅    | —                                                                                                 |
| `AZURE_REDIRECT_URI`             |    —     | current origin (e.g. `http://localhost:8080`)                                                     |
| `AZURE_POST_LOGOUT_REDIRECT_URI` |    —     | the redirect URI                                                                                  |
| `AZURE_AUTHORITY_HOST`           |    —     | `login.microsoftonline.com`                                                                       |
| `AZURE_SCOPES`                   |    —     | `User.Read` (space- or comma-separated)                                                           |
| `PORT`                           |    —     | overrides `server.port` in config.yaml; `8080` if neither is set (in compose, also the host port) |

> Register the URL you serve from (e.g. `http://localhost:8080`) as a **SPA
> redirect URI** in the App registration. All values are public (PKCE) — never
> pass a secret.
>
> **Port** resolves as `PORT` env > `server.port` in config.yaml > `8080`. The
> `PORT` env var is compatible with Azure Container Apps / Cloud Run (which inject
> it). In `docker-compose.yml` the same value also maps the host port, so
> `PORT=9090` serves the app on `http://localhost:9090`.

### Build & publish to Docker Hub (maintainers)

```bash
docker build -t YOUR_DOCKERHUB_USER/entra-web-template:latest .
docker push YOUR_DOCKERHUB_USER/entra-web-template:latest
```

### CI (GitHub Actions)

Pushing a `v*.*.*` tag triggers [`.github/workflows/docker.yml`](.github/workflows/docker.yml),
which builds a multi-arch image (`linux/amd64,linux/arm64`) and pushes it to
Docker Hub as `<user>/entra-web-template:<tag>` and `:latest`. Set the repo secrets
`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

### How runtime config works

The app fetches `/config.yaml` on startup and parses it. At container startup
`docker/40-configure.sh` renders that file from the `AZURE_*` environment
variables (or leaves a mounted file untouched), resolves the port (`PORT` env >
`server.port` in config.yaml > `8080`), and renders `nginx.conf.template` with it.

---

## Scripts

| Command                 | What it does                         |
| ----------------------- | ------------------------------------ |
| `bun run dev`           | Dev server (Vite)                    |
| `bun run build`         | Typecheck (`tsc`) + production build |
| `bun run preview`       | Serve the production build locally   |
| `bun run typecheck`     | Typecheck only                       |
| `bun run test`          | Run tests once (Vitest)              |
| `bun run test:watch`    | Run tests in watch mode              |
| `bun run test:coverage` | Run tests with coverage              |
| `bun run lint`          | Lint (ESLint)                        |
| `bun run lint:fix`      | Lint and auto-fix (ESLint)           |
| `bun run format`        | Format all files (Prettier)          |
| `bun run format:check`  | Check formatting (Prettier)          |

## Testing

Unit tests run on **Vitest** (happy-dom). The pure logic is covered:
`src/auth/config.ts` (config parsing + validation) and `src/utils/jwt.ts` (JWT
decoding). Run `bun run test` or `bun run test:coverage`.

## Git hooks

`husky` installs two hooks (via the `prepare` script that runs on `bun install`):

- **pre-commit** → `lint-staged` runs ESLint (`--fix`) + Prettier on staged files.
- **commit-msg** → `commitlint` enforces Conventional Commits.

Bypass in a pinch with `git commit --no-verify`.

---

## Project structure

```
├─ eslint.config.js      # ESLint (flat config)
├─ .prettierrc           # Prettier config
├─ commitlint.config.js  # Conventional Commits rules
├─ .husky/               # pre-commit (lint-staged) + commit-msg (commitlint)
├─ .github/workflows/    # docker.yml — build & push to Docker Hub on v* tags
├─ index.html
├─ public/favicon.svg     # app icon
├─ config/
│  ├─ config.yaml.example # template — copy to config/config.yaml (gitignored) for dev
│  └─ config.yaml         # your local config (gitignored; generated in Docker)
├─ docker/40-configure.sh # renders config.yaml + nginx port at startup
├─ Dockerfile             # Bun build -> nginx serve (runtime-configured)
├─ docker-compose.yml     # run the published image + set AZURE_* / PORT env
├─ nginx.conf.template    # nginx SPA config (port filled in at startup)
src/
├─ main.tsx               # bootstrap: load config.yaml, init MSAL, handle redirect
├─ App.tsx                # layout + authenticated/unauthenticated switch
├─ index.css
├─ auth/
│  ├─ config.ts           # fetch + parse /config.yaml -> AuthConfig (validated)
│  ├─ config.test.ts
│  ├─ msal.ts             # create the PublicClientApplication
│  └─ context.tsx         # provide config/scopes to components via React context
├─ components/
│  ├─ LoginScreen.tsx     # sign-in button
│  ├─ LogoutButton.tsx    # sign-out button
│  ├─ Dashboard.tsx       # composes the three panels below
│  ├─ AccountCard.tsx     # account + ID token claims
│  ├─ TokenPanel.tsx      # access token (raw + decoded + copy)
│  ├─ GraphPanel.tsx      # calls Graph /me
│  ├─ JsonBlock.tsx       # renders JSON + copy
│  ├─ CopyButton.tsx
│  └─ ConfigError.tsx     # friendly error page when config is missing
├─ utils/
│  ├─ jwt.ts              # decode JWT (does NOT verify the signature — debug only)
│  ├─ jwt.test.ts
│  └─ error.ts
└─ test/setup.ts          # Vitest setup (jest-dom matchers)
```

---

## Security notes

- This is a **public client** — no secret is used or needed; sign-in uses PKCE.
- Tokens are cached in `sessionStorage` (cleared when the tab closes).
- `decodeJwt` only decodes a token to display it — it does **not** verify the
  signature. Never reuse this logic to validate tokens on a production backend.
- `config/config.yaml` is gitignored — only `config.yaml.example` is committed.
- `config.yaml` is served to the browser, so its values are public by design —
  never put a secret in it.

## Troubleshooting

| Symptom                                                     | Cause / fix                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `AADSTS9002326` cross-origin                                | The redirect URI is not registered as a **SPA** platform.                                |
| `AADSTS50011` redirect mismatch                             | The served origin does not match a registered SPA redirect URI in the portal.            |
| Popup blocked on token acquire                              | The popup must be triggered by a user gesture — click the button again.                  |
| "Configuration error" — could not load `/config.yaml`       | In dev, copy `config/config.yaml.example` to `config/config.yaml`.                       |
| "Configuration error" — `azure.clientId` / `azure.tenantId` | Fill those keys in `config.yaml`, or set `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` (Docker). |
