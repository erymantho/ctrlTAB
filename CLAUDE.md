# ctrlTAB — Technical Reference for Claude Code

Self-hosted link manager. Users organize URLs into **Collections → Sections → Links**.

---

## Stack & Structure

```
CtrlTab/
├── api/              Node.js + Express + better-sqlite3 (internal port 3000)
│   ├── server.js     Single backend file — all routes, DB setup, auth
│   └── Dockerfile
├── web/
│   ├── html/         Vanilla JS frontend (no framework, no build step)
│   │   ├── app.js         All frontend logic (~1600 lines)
│   │   ├── style.css      Main stylesheet + light/dark theme variables
│   │   ├── index.html     App shell + inline flash-prevention script
│   │   ├── login.html     Login page
│   │   ├── manifest.json  PWA manifest
│   │   ├── service-worker.js
│   │   └── themes/
│   │       ├── cyberpunk/cyberpunk.css
│   │       ├── batman/batman.css
│   │       └── oled/oled.css
│   └── Dockerfile    Nginx Alpine
└── docker-compose.yml
```

**Docker Compose:** two containers — `ctrltab-api` (Node) and `ctrltab-web` (Nginx reverse proxy). Frontend exposed on port 8090. Volume `ctrltab-data` for SQLite + uploads.

---

## Database (SQLite, WAL mode)

File: `/app/data/ctrltab.db`
Uploads dir: `/app/data/uploads/`

```sql
users        (id, username, password_hash, is_admin, preferences JSON, created_at)
collections  (id, name, icon, sort_order, user_id → users, created_at)
sections     (id, collection_id → collections, name, sort_order, created_at)
links        (id, section_id → sections, title, url, favicon, sort_order, created_at)
```

**`users.preferences`** is a JSON column:
```json
{ "accentColor": "#ff6b00", "backgroundImage": "/api/uploads/uuid.jpg", "backgroundDim": true }
```

Cascading deletes: deleting a collection removes its sections and links.

---

## API Endpoints (`api/server.js`)

All routes except `/api/auth/login` and `/api/health` require a JWT Bearer token.

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login → `{ token, user }` |
| GET | `/api/auth/verify` | Validate token |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/preferences` | Get user preferences |
| PUT | `/api/auth/preferences` | `{ accentColor, backgroundImage, backgroundDim }` |

### Admin (requires `is_admin`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |

### Collections
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/collections` | All collections for the logged-in user |
| POST | `/api/collections` | Create collection `{ name, icon? }` |
| PUT | `/api/collections/:id` | Update collection |
| DELETE | `/api/collections/:id` | Delete collection |

### Sections
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/collections/:collectionId/sections` | Sections in a collection |
| POST | `/api/collections/:collectionId/sections` | Create section `{ name }` |
| PUT | `/api/sections/:id` | Update section |
| DELETE | `/api/sections/:id` | Delete section |
| PUT | `/api/collections/:collectionId/sections/reorder` | `{ order: [id, ...] }` |

### Links
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/sections/:sectionId/links` | Links in a section |
| POST | `/api/sections/:sectionId/links` | Create link `{ title, url, favicon? }` |
| PUT | `/api/links/:id` | Update link — also accepts `{ section_id }` to move it |
| DELETE | `/api/links/:id` | Delete link |
| PUT | `/api/sections/:sectionId/links/reorder` | `{ order: [id, ...] }` |

### Other
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/:collectionId` | All-in-one: collection + sections + links |
| GET | `/api/search?q=...` | Search links by title/URL across all user's collections (min 2 chars, max 200 results) |
| POST | `/api/upload/icon` | Custom link icon (PNG/SVG/ICO, max 2 MB) |
| POST | `/api/upload/background` | Background image (JPG/PNG/GIF, max 5 MB) |
| GET | `/api/uploads/:filename` | Serve uploaded files |
| GET | `/api/health` | Health check |

---

## Frontend (`web/html/app.js`)

### Global state variables
```js
let currentCollectionId = null;    // active collection
let currentView = 'dashboard';     // 'dashboard' | 'settings' | 'search'
let _accentColor = null;           // user accent color
let _backgroundImage = null;       // user background URL
let _backgroundDim = true;         // dim overlay toggle
let _showLinkUrls = false;         // show URL under link title
let _searchQuery = '';             // current search query
let _searchDebounceTimer = null;   // debounce timer for search input

// Drag & Drop state
let _dragLinkId, _dragLinkCard, _dragSrcSectionId;
let _dragCardHeight, _placeholder;
let _dragSection, _dragCtrl;
let _colHoverTimer, _colHoverCtrl;
```

### Key functions
| Function | Description |
|----------|-------------|
| `loadDashboard(collectionId)` | Fetches dashboard from API, renders sections + links |
| `renderLinks(links, grid)` | Renders link cards with favicon fallback chain |
| `initDragAndDrop()` | Re-registers all DnD event listeners (AbortController pattern) |
| `showSettings()` | Renders settings view in the main content area |
| `applyTheme(theme)` | Sets `data-theme` attribute on `<html>` |
| `setTheme(theme)` | Saves to localStorage + triggers boot animations |
| `applyAccentColor(color)` | Sets `--color-accent` CSS variable on `:root` |
| `applyBackgroundImage(url)` | Sets `--user-bg` + class `has-user-bg` on `<html>` |
| `applyShowLinkUrls(show)` | Toggles class `show-link-urls` on `<html>` |
| `toggleShowLinkUrls(checked)` | Saves preference to localStorage + calls `applyShowLinkUrls` |
| `loadUserPreferences()` | Fetches prefs from API, caches in localStorage |
| `apiRequest(path, options)` | Fetch wrapper with JWT Authorization header |
| `handleSearchInput(value)` | Debounced input handler — shows/hides clear button, calls `performSearch` |
| `performSearch(q)` | Calls `GET /api/search?q=...` with stale-request guard |
| `renderSearchResults(q, results)` | Sets `currentView='search'`, renders link cards with breadcrumbs |
| `clearSearch()` | Resets search state, navigates back to last collection |
| `openFirstSearchResult()` | Clicks the first `.search-result-card` in the results |

### Favicon fallback chain
When loading a link favicon, multiple sources are tried in order:
1. Stored favicon URL (may be `/api/uploads/` for custom icons)
2. Google Favicon API
3. DuckDuckGo Favicon API
4. Initial-letter fallback (rendered as text)

Custom icons from `/api/uploads/` are not cached as aggressively as external CDN favicons. This is why drag & drop uses a **placeholder approach** (see below).

---

## Drag & Drop

**Approach: placeholder** — the card never moves during drag; only a lightweight placeholder div does.

**Why:** when a custom icon `<img>` is moved in the DOM via `insertBefore` (called dozens of times/sec on `dragover`), the browser re-requests the `/api/uploads/` URL → `onerror` fires → fallback chain runs → icon replaced with initial letter.

**How it works:**
- `dragstart`: create `<div class="drag-placeholder">` at card height, card stays in place with `.dragging` class (35% opacity)
- `dragover`: move only the placeholder (card never moves)
- `dragend`: insert card at placeholder position, remove placeholder, save order via API

**Cross-collection drag:** hover a sidebar collection button for 800ms → card is parked on `document.body` (`display:none`), placeholder discarded, `selectCollection()` called → new collection renders → `initDragAndDrop()` re-attaches listeners with `_dragLinkId` still set → user drags over new grid → placeholder recreated on first `dragover` → `dragend` inserts card.

**AbortController pattern:** `_dragCtrl` is an AbortController. `initDragAndDrop()` always starts with `_dragCtrl.abort()` to remove old listeners, then creates a fresh `_dragCtrl = new AbortController()`.

---

## Theme System

Themes are applied via the `data-theme` attribute on `<html>`. Light theme = no attribute.

| Theme | File | Accent locked? | Boot animation |
|-------|------|---------------|----------------|
| light | `style.css` `:root` | No | None |
| dark | `style.css` `[data-theme="dark"]` | No | None |
| oled | `themes/oled/oled.css` | No | None |
| cyberpunk | `themes/cyberpunk/cyberpunk.css` | **Yes** | Glitch overlay (1.5s) |
| batman | `themes/batman/batman.css` | **Yes** | Cinematic intro (9.3s) |

**Flash prevention:** inline `<script>` in `index.html` reads `localStorage` before first render and immediately sets `data-theme`, `--user-bg`, and `has-user-bg` on `<html>`.

**CSS variables (light theme defaults):**
```css
--color-accent:         #e2003d
--color-bg-primary:     #ffffff
--color-bg-secondary:   #f8f9fa
--color-bg-tertiary:    #e9ecef
--color-text-primary:   #212529
--color-text-secondary: #495057
--color-text-muted:     #868e96
```

---

## Auth Flow

1. Login via `POST /api/auth/login` → JWT token (valid 7 days)
2. Token stored in `localStorage` as `ctrltab-token`
3. All API calls send `Authorization: Bearer <token>`
4. On 401/403 response → redirect to `/login.html`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `please-change-this-secret` | Always change in production |
| `ADMIN_USERNAME` | `admin` | Initial admin username |
| `ADMIN_PASSWORD` | `admin123` | Initial admin password |
| `DB_PATH` | `/app/data/ctrltab.db` | SQLite database path |

Admin credentials are checked and updated on every startup if env vars have changed.

---

## Development Notes

- **No build step** — changes to `/web/html/` are immediately visible via the `volumes` mount in docker-compose
- **API changes** require a container restart (`docker compose restart api`)
- **Service worker** uses network-first for static assets, network-only for `/api/`
- **Ownership checks** in the API: every route verifies the logged-in user owns the collection/section/link via helper functions `ownsCollection`, `ownsSection`, `ownsLink`
- **`sort_order`** is used for ordering; reorder endpoints save the new order as integer indices
- **Keyboard shortcuts:** `/` focuses the search input (when no input/modal is active), `Escape` clears search when `currentView === 'search'`
- **Search:** sidebar search bar above the collections header; `Enter` in the search input opens the first result; clicking a collection always clears the search state
