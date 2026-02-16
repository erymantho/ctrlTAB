const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'ctrltab.db');

// Middleware
app.use(cors());
app.use(express.json());

// ─── Database Setup ───────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    favicon TEXT DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
  );
`);

// ─── Collections ──────────────────────────────────────────────────
app.get('/api/collections', (req, res) => {
  const collections = db.prepare('SELECT * FROM collections ORDER BY sort_order, id').all();
  res.json(collections);
});

app.post('/api/collections', (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM collections').get();
  const result = db.prepare('INSERT INTO collections (name, icon, sort_order) VALUES (?, ?, ?)').run(name, icon || null, maxOrder.next);
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(collection);
});

app.put('/api/collections/:id', (req, res) => {
  const { name, icon, sort_order } = req.body;
  db.prepare('UPDATE collections SET name = COALESCE(?, name), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order) WHERE id = ?')
    .run(name, icon, sort_order, req.params.id);
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!collection) return res.status(404).json({ error: 'Not found' });
  res.json(collection);
});

app.delete('/api/collections/:id', (req, res) => {
  const result = db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ─── Sections ─────────────────────────────────────────────────────
app.get('/api/collections/:collectionId/sections', (req, res) => {
  const sections = db.prepare('SELECT * FROM sections WHERE collection_id = ? ORDER BY sort_order, id').all(req.params.collectionId);
  res.json(sections);
});

app.post('/api/collections/:collectionId/sections', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM sections WHERE collection_id = ?').get(req.params.collectionId);
  const result = db.prepare('INSERT INTO sections (collection_id, name, sort_order) VALUES (?, ?, ?)').run(req.params.collectionId, name, maxOrder.next);
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(section);
});

app.put('/api/sections/:id', (req, res) => {
  const { name, sort_order } = req.body;
  db.prepare('UPDATE sections SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?')
    .run(name, sort_order, req.params.id);
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  if (!section) return res.status(404).json({ error: 'Not found' });
  res.json(section);
});

app.delete('/api/sections/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ─── Favicon Helper ──────────────────────────────────────────────
async function fetchFavicon(siteUrl) {
  try {
    const parsed = new URL(siteUrl);

    // Try fetching the page and parsing icon from HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(siteUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'CtrlTab/1.0' }
      });
      clearTimeout(timeout);

      if (response.ok) {
        const html = await response.text();
        // Match <link rel="icon" href="..."> or <link rel="shortcut icon" href="...">
        const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i)
          || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i);

        if (iconMatch) {
          const iconHref = iconMatch[1];
          // Resolve relative URLs
          return new URL(iconHref, siteUrl).href;
        }
      }
    } catch {
      clearTimeout(timeout);
    }

    // Fallback: try /favicon.ico directly
    try {
      const icoUrl = `${parsed.origin}/favicon.ico`;
      const icoController = new AbortController();
      const icoTimeout = setTimeout(() => icoController.abort(), 3000);
      const icoResponse = await fetch(icoUrl, {
        method: 'HEAD',
        signal: icoController.signal
      });
      clearTimeout(icoTimeout);

      if (icoResponse.ok) {
        return icoUrl;
      }
    } catch {
      // ignore
    }

    // Last fallback: Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return null;
  }
}

// ─── Links ────────────────────────────────────────────────────────
app.get('/api/sections/:sectionId/links', (req, res) => {
  const links = db.prepare('SELECT * FROM links WHERE section_id = ? ORDER BY sort_order, id').all(req.params.sectionId);
  res.json(links);
});

app.post('/api/sections/:sectionId/links', async (req, res) => {
  const { title, url, favicon } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title and url are required' });

  const faviconUrl = favicon || await fetchFavicon(url);
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM links WHERE section_id = ?').get(req.params.sectionId);
  const result = db.prepare('INSERT INTO links (section_id, title, url, favicon, sort_order) VALUES (?, ?, ?, ?, ?)').run(req.params.sectionId, title, url, faviconUrl, maxOrder.next);
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(link);
});

app.put('/api/links/:id', (req, res) => {
  const { title, url, favicon, sort_order } = req.body;
  db.prepare('UPDATE links SET title = COALESCE(?, title), url = COALESCE(?, url), favicon = COALESCE(?, favicon), sort_order = COALESCE(?, sort_order) WHERE id = ?')
    .run(title, url, favicon, sort_order, req.params.id);
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).json({ error: 'Not found' });
  res.json(link);
});

app.delete('/api/links/:id', (req, res) => {
  const result = db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ─── Full dashboard endpoint (alles in één keer) ─────────────────
app.get('/api/dashboard/:collectionId', (req, res) => {
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.collectionId);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const sections = db.prepare('SELECT * FROM sections WHERE collection_id = ? ORDER BY sort_order, id').all(req.params.collectionId);

  const sectionsWithLinks = sections.map(section => ({
    ...section,
    links: db.prepare('SELECT * FROM links WHERE section_id = ? ORDER BY sort_order, id').all(section.id)
  }));

  res.json({
    ...collection,
    sections: sectionsWithLinks
  });
});

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ctrltab API running on port ${PORT}`);
});