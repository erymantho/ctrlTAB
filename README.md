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
- 🎨 **Neon Cyberpunk UI** — Futuristic interface with grid backgrounds, scan lines, and RGB glow effects
- ⚡ **Full CRUD** — Create, read, update, and delete all resources through an intuitive dashboard
- 🐳 **Docker-ready** — Runs as a two-container stack (API + Nginx)
- 🪶 **Lightweight** — SQLite database, no external dependencies
- 🔒 **Self-hosted** — Your data stays on your server
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Deploy

```bash
git clone https://github.com/erymantho/ctrltab.git
cd ctrltab
docker compose up -d
```

CtrlTab will be available at `http://localhost:8090`.

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/collections` | List all collections |
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
| `GET` | `/api/health` | Health check |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `/app/data/ctrltab.db` | Path to SQLite database file |
| `NODE_ENV` | `production` | Node environment |

The default port is `8090`. Change it in `docker-compose.yml` under the `web` service.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
  - Neon Cyberpunk aesthetic with Orbitron, Rajdhani, and Share Tech Mono fonts
  - Grid backgrounds, scan lines, and RGB glow effects
  - Fully responsive with smooth animations
- **Backend:** Node.js, Express, better-sqlite3
- **Database:** SQLite with WAL mode
- **Proxy:** Nginx (Alpine)
- **Containerization:** Docker & Docker Compose

## Roadmap

- [x] Dashboard frontend UI with Neon Cyberpunk theme
- [x] Full CRUD for collections, sections, and links
- [x] Auto-fetched favicons
- [ ] Drag & drop reordering
- [ ] Search across all links
- [ ] Import/export (JSON, HTML bookmarks)
- [ ] Tags and filtering
- [ ] Authentication (or use behind Authentik/reverse proxy)
- [ ] Theme switcher (Cyberpunk / alternative themes)
- [ ] Browser extension for quick saving
- [ ] Keyboard shortcuts

## License

MIT — do whatever you want with it.

---

*Built with ☕ and `sudo` privileges.*