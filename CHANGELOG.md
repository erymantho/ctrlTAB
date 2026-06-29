# Changelog

All notable changes to ctrlTAB are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-29

### Added
- **Export** — download all collections, sections, and links as a JSON backup
  (internal favicon URLs stripped).
- **Import** — a single import modal supporting ctrlTAB backups, Linkwarden
  exports, and Netscape HTML browser bookmarks.
- **Search as you type** — live search in the sidebar with `/` to focus the
  search bar, type-to-search from anywhere, and `Enter` to open the first result.
- **YouTube video backgrounds** — set a video as the page background
  (mutually exclusive with an image background).
- `.gitignore` covering macOS, editor, and Node artifacts.

### Changed
- Redesigned the import flow into one modal with ctrlTAB / Linkwarden / bookmarks
  options and a per-type file picker.
- Redrew the favicon as a self-contained vector mark (no web-font dependency),
  with light/dark variants via `prefers-color-scheme`.
- Denser link grid (smaller card min-width); the two-column section layout no
  longer applies to empty states.
- Bumped the service worker cache (`ctrltab-v4` → `ctrltab-v5`) so clients pick
  up the refreshed assets.

### Fixed
- Export failure on certain datasets.
- Assorted small search and UI bugfixes.

### Internal
- Stopped tracking committed macOS `.DS_Store` files.

## [1.0.0] - 2026-03-10

### Added
- Initial release: self-hosted link manager organizing URLs into
  Collections → Sections → Links.
- JWT authentication with an admin-managed multi-user setup.
- Drag-and-drop ordering of links and sections, including cross-collection moves.
- Per-user preferences: accent color, background image, and dim overlay.
- Themes: light, dark, OLED, cyberpunk, and batman.
- Internationalization (English, Dutch, Spanish).
- Progressive Web App support (installable, offline-capable service worker).

[1.1.0]: https://github.com/erymantho/CtrlTab/releases/tag/v1.1.0
[1.0.0]: https://github.com/erymantho/CtrlTab/releases/tag/v1.0.0
