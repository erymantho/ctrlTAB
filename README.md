# ⌨️ CtrlTab

**Your links. Your rules. Self-hosted.**

A lightweight, self-hosted bookmark and link manager to organize your links into collections and sections. Built for nerds who want full control over their bookmarks without relying on browser extensions or third-party services.

![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-database-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

- 📁 **Collections** — Group your links by project, client, or topic
- 📑 **Sections** — Organize links within collections under named headings
- 🔗 **Links** — Store URLs with auto-fetched favicons
- 🎨 **Themes** — Light (default), Dark, and Neon Cyberpunk with grid backgrounds, scan lines, and RGB glow effects
- ⚙️ **Settings Page** — Dedicated settings view with theme switcher, account management, and admin user management
- 👤 **User Accounts** — Multi-user with admin panel, JWT authentication, and per-user data isolation
- ⚡ **Full CRUD** — Create, read, update, and delete all resources through an intuitive dashboard
- 🐳 **Docker-ready** — Runs as a two-container stack (API + Nginx)
- 🪶 **Lightweight** — SQLite database, no external dependencies
- 🔒 **Self-hosted** — Your data stays on your server
- 📱 **PWA** — Installable as app, works offline for static assets
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Deploy

```bash
git clone https://github.com/erymantho/ctrltab.git
cd ctrltab

# Set your credentials (or use defaults: admin / admin123)
export JWT_SECRET="your-secret-key"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="your-secure-password"

docker compose up -d
```

CtrlTab will be available at `http://localhost:8090`. Log in with your admin credentials.

### Deploy with Portainer

1. Go to **Stacks → Add Stack → Repository**
2. Enter the repository URL
3. Set the Compose path to `docker-compose.yml`
4. Deploy the stack

## Architecture

```
┌──────────────────────────────────────────┐
│                  Nginx                    │
│          (frontend + reverse proxy)       │
│                port 8090                  │
│                                           │
│   Static files ──── /api/ ──► proxy       │
└──────────────────────┬───────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────┐
│              Node.js + Express            │
│              (REST API, port 3000)        │
│                                           │
│              SQLite database              │
│          (persistent Docker volume)       │
└──────────────────────────────────────────┘
```

## API Endpoints

All data endpoints require a valid JWT token via `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `GET` | `/api/auth/verify` | Verify token validity |
| `POST` | `/api/auth/change-password` | Change own password |
| `GET` | `/api/admin/users` | List all users (admin only) |
| `POST` | `/api/admin/users` | Create a user (admin only) |
| `PUT` | `/api/admin/users/:id` | Update a user (admin only) |
| `DELETE` | `/api/admin/users/:id` | Delete a user (admin only) |
| `GET` | `/api/collections` | List own collections |
| `POST` | `/api/collections` | Create a collection |
| `PUT` | `/api/collections/:id` | Update a collection |
| `DELETE` | `/api/collections/:id` | Delete a collection |
| `GET` | `/api/collections/:id/sections` | List sections in a collection |
| `POST` | `/api/collections/:id/sections` | Create a section |
| `PUT` | `/api/sections/:id` | Update a section |
| `DELETE` | `/api/sections/:id` | Delete a section |
| `GET` | `/api/sections/:id/links` | List links in a section |
| `POST` | `/api/sections/:id/links` | Create a link |
| `PUT` | `/api/links/:id` | Update a link |
| `DELETE` | `/api/links/:id` | Delete a link |
| `GET` | `/api/dashboard/:collectionId` | Full collection with sections and links |
| `GET` | `/api/health` | Health check (public) |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `please-change-this-secret` | Secret key for JWT signing (change in production!) |
| `ADMIN_USERNAME` | `admin` | Initial admin username |
| `ADMIN_PASSWORD` | `admin123` | Initial admin password |
| `DB_PATH` | `/app/data/ctrltab.db` | Path to SQLite database file |
| `NODE_ENV` | `production` | Node environment |

The default port is `8090`. Change it in `docker-compose.yml` under the `web` service.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
  - Theme switcher with Light (default), Dark, and Cyberpunk themes
  - Fully responsive
- **Auth:** JWT tokens, bcrypt password hashing, admin/user roles
- **Backend:** Node.js, Express, better-sqlite3
- **Database:** SQLite with WAL mode
- **Proxy:** Nginx (Alpine)
- **Containerization:** Docker & Docker Compose

## Roadmap

- [x] Dashboard frontend UI
- [x] Full CRUD for collections, sections, and links
- [x] Auto-fetched favicons
- [x] Theme switcher (Light / Dark / Cyberpunk)
- [x] Improve offline mode (PWA)
- [ ] New logo
- [x] User accounts and authentication
- [ ] Drag & drop reordering
- [ ] Search across all links
- [ ] Import/export (JSON, HTML bookmarks)
- [ ] Tags and filtering
- [ ] Browser extension for quick saving
- [ ] Keyboard shortcuts

## License

MIT — do whatever you want with it.

---

*Built with ☕ and `sudo` privileges.*