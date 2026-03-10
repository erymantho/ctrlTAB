// ═══════════════════════════════════════════════════════════════
// ctrlTAB - Application Logic
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// Theme System
// ═══════════════════════════════════════════════════════════════

function initTheme() {
    const saved = localStorage.getItem('ctrltab-theme') || 'light';
    applyTheme(saved);
}

function applyTheme(theme) {
    if (theme === 'light') {
        delete document.documentElement.dataset.theme;
    } else {
        document.documentElement.dataset.theme = theme;
    }
    // Cyberpunk and batman have their own fixed accent colors
    if (theme === 'cyberpunk' || theme === 'batman') {
        document.documentElement.style.removeProperty('--color-accent');
    } else {
        applyAccentColor(_accentColor);
    }
    // Update active state in settings view
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.themeValue === theme);
    });
}

function applyAccentColor(color) {
    const theme = document.documentElement.dataset.theme;
    if (theme === 'cyberpunk' || theme === 'batman') return;
    if (color) {
        document.documentElement.style.setProperty('--color-accent', color);
    } else {
        document.documentElement.style.removeProperty('--color-accent');
    }
}

async function loadUserPreferences() {
    try {
        const prefs = await apiRequest('/auth/preferences');
        _accentColor = prefs.accentColor || null;
        if (_accentColor) {
            localStorage.setItem('ctrltab-accent', _accentColor);
        } else {
            localStorage.removeItem('ctrltab-accent');
        }
        applyAccentColor(_accentColor);
        _backgroundImage = prefs.backgroundImage || null;
        if (_backgroundImage) {
            localStorage.setItem('ctrltab-bg', _backgroundImage);
        } else {
            localStorage.removeItem('ctrltab-bg');
        }
        _backgroundDim = prefs.backgroundDim !== false;
        localStorage.setItem('ctrltab-bg-dim', _backgroundDim ? '1' : '0');
        applyBackgroundImage(_backgroundImage);
        applyBackgroundDim(_backgroundDim);
    } catch {}
}

function applyBackgroundImage(url) {
    if (url) {
        document.documentElement.style.setProperty('--user-bg', `url("${url}")`);
        document.documentElement.classList.add('has-user-bg');
    } else {
        document.documentElement.style.removeProperty('--user-bg');
        document.documentElement.classList.remove('has-user-bg');
    }
}

function applyBackgroundDim(dim) {
    document.documentElement.classList.toggle('has-user-bg-dim', !!dim);
}

function applyShowLinkUrls(show) {
    document.documentElement.classList.toggle('show-link-urls', !!show);
}

function toggleShowLinkUrls(checked) {
    _showLinkUrls = checked;
    localStorage.setItem('ctrltab-show-url', checked ? '1' : '0');
    applyShowLinkUrls(checked);
}

function applyTwoColLayout(enabled) {
    document.documentElement.classList.toggle('two-col-layout', !!enabled);
}

function toggleTwoColLayout(checked) {
    _twoColLayout = checked;
    localStorage.setItem('ctrltab-two-col', checked ? '1' : '0');
    applyTwoColLayout(checked);
}

function updateAccentPreview(color) {
    applyAccentColor(color);
    const customBtn = document.querySelector('.accent-preset-custom');
    if (customBtn) {
        customBtn.style.background = color;
        customBtn.classList.add('active');
        const icon = customBtn.querySelector('.accent-preset-custom-icon');
        if (icon) icon.style.opacity = '0';
    }
    document.querySelectorAll('.accent-preset[data-color]').forEach(el => el.classList.remove('active'));
}

async function handleAccentColorChange(color) {
    _accentColor = color;
    localStorage.setItem('ctrltab-accent', color);
    applyAccentColor(color);
    const customBtn = document.querySelector('.accent-preset-custom');
    if (customBtn) {
        customBtn.style.background = color;
        customBtn.classList.add('active');
        const icon = customBtn.querySelector('.accent-preset-custom-icon');
        if (icon) icon.style.opacity = '0';
    }
    document.querySelectorAll('.accent-preset[data-color]').forEach(el => el.classList.remove('active'));
    try {
        await apiRequest('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify({ accentColor: color }),
        });
    } catch {}
}

async function selectAccentPreset(color) {
    _accentColor = color;
    localStorage.setItem('ctrltab-accent', color);
    applyAccentColor(color);
    document.querySelectorAll('.accent-preset[data-color]').forEach(el => {
        el.classList.toggle('active', el.dataset.color === color);
    });
    const customBtn = document.querySelector('.accent-preset-custom');
    if (customBtn) {
        customBtn.classList.remove('active');
        customBtn.style.background = '';
        const icon = customBtn.querySelector('.accent-preset-custom-icon');
        if (icon) icon.style.opacity = '';
    }
    try {
        await apiRequest('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify({ accentColor: color }),
        });
    } catch {}
}

function setTheme(theme) {
    localStorage.setItem('ctrltab-theme', theme);
    const overlay = document.getElementById('glitchOverlay');
    const currentTheme = document.documentElement.dataset.theme || 'light';

    if (theme === 'cyberpunk') {
        document.body.classList.add('cyberpunk-booting');
        if (overlay) overlay.classList.add('active');
        setTimeout(() => {
            document.body.classList.remove('cyberpunk-booting');
            if (overlay) overlay.classList.remove('active');
        }, 1500);
    } else if (theme === 'batman') {
        const batIntro = document.getElementById('batman-intro');
        if (batIntro) {
            batIntro.style.display = 'block';
            void batIntro.offsetHeight; // force reflow
            batIntro.classList.add('active');
            setTimeout(() => {
                batIntro.classList.remove('active');
                batIntro.style.display = 'none';
            }, 11800);
        }
        document.body.classList.add('batman-booting');
        setTimeout(() => {
            document.body.classList.remove('batman-booting');
        }, 11800);
    } else if (currentTheme === 'cyberpunk') {
        if (overlay) {
            overlay.classList.add('shutdown');
            setTimeout(() => overlay.classList.remove('shutdown'), 700);
        }
    } else if (currentTheme === 'batman') {
        if (overlay) {
            overlay.classList.add('batman-shutdown');
            setTimeout(() => overlay.classList.remove('batman-shutdown'), 600);
        }
    }

    applyTheme(theme);
    if (currentView === 'settings') showSettings();
}

function getOpenInNewTab() {
    const val = localStorage.getItem('ctrltab-newtab');
    return val === null ? true : val === 'true';
}

function setOpenInNewTab(enabled) {
    localStorage.setItem('ctrltab-newtab', enabled);
}

// Apply theme and accent color immediately to prevent flash
let _accentColor = null;
let _backgroundImage = null;
let _backgroundDim = true;
let _showLinkUrls = false;
let _twoColLayout = false;
let _searchQuery = '';
let _searchDebounceTimer = null;
const ACCENT_PRESETS = ['#e2003d', '#e8650a', '#d4a017', '#198754', '#0d6efd', '#6f42c1', '#d63384'];
initTheme();
_accentColor = localStorage.getItem('ctrltab-accent') || null;
applyAccentColor(_accentColor);
_showLinkUrls = localStorage.getItem('ctrltab-show-url') !== '0';
applyShowLinkUrls(_showLinkUrls);
_twoColLayout = localStorage.getItem('ctrltab-two-col') === '1';
applyTwoColLayout(_twoColLayout);

// ═══════════════════════════════════════════════════════════════
// Authentication
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';
let currentUser = null;

function getAuthToken() {
    return localStorage.getItem('ctrltab-token');
}

function getCurrentUser() {
    if (currentUser) return currentUser;
    const json = localStorage.getItem('ctrltab-user');
    if (json) currentUser = JSON.parse(json);
    return currentUser;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.is_admin;
}

function logout() {
    localStorage.removeItem('ctrltab-token');
    localStorage.removeItem('ctrltab-user');
    currentUser = null;
    window.location.href = '/login.html';
}

async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Invalid token');

        const data = await res.json();
        currentUser = data.user;
        localStorage.setItem('ctrltab-user', JSON.stringify(data.user));
        return true;
    } catch {
        logout();
        return false;
    }
}

// State
let currentCollectionId = null;
let currentView = 'collections';
let collections = [];

// DOM Elements
const elements = {
    collectionsList: document.getElementById('collectionsList'),
    collectionTitle: document.getElementById('collectionTitle'),
    sectionsContainer: document.getElementById('sectionsContainer'),
    addCollectionBtn: document.getElementById('addCollectionBtn'),
    editCollectionBtn: document.getElementById('editCollectionBtn'),
    addSectionBtn: document.getElementById('addSectionBtn'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    settingsBackBtn: document.getElementById('settingsBackBtn'),
    searchInput:     document.getElementById('searchInput'),
    searchClearBtn:  document.getElementById('searchClearBtn'),
};

// ═══════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════

async function apiRequest(endpoint, options = {}) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
            ...options,
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        // Invalidate search cache on any mutation
        if (options.method && options.method !== 'GET') {
            if (typeof invalidateSearchCache === 'function') invalidateSearchCache();
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Collections
async function getCollections() {
    return apiRequest('/collections');
}

async function createCollection(name) {
    return apiRequest('/collections', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

async function updateCollection(id, data) {
    return apiRequest(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteCollection(id) {
    return apiRequest(`/collections/${id}`, {
        method: 'DELETE',
    });
}

// Dashboard
async function getDashboard(collectionId) {
    return apiRequest(`/dashboard/${collectionId}`);
}

// Sections
async function createSection(collectionId, name) {
    return apiRequest(`/collections/${collectionId}/sections`, {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

async function updateSection(id, data) {
    return apiRequest(`/sections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteSection(id) {
    return apiRequest(`/sections/${id}`, {
        method: 'DELETE',
    });
}

// Links
async function createLink(sectionId, data) {
    return apiRequest(`/sections/${sectionId}/links`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function updateLink(id, data) {
    return apiRequest(`/links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteLink(id) {
    return apiRequest(`/links/${id}`, {
        method: 'DELETE',
    });
}

async function reorderLinks(sectionId, orderedIds) {
    return apiRequest(`/sections/${sectionId}/links/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order: orderedIds }),
    });
}

async function reorderSections(collectionId, orderedIds) {
    return apiRequest(`/collections/${collectionId}/sections/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order: orderedIds }),
    });
}

async function uploadIcon(file) {
    const formData = new FormData();
    formData.append('icon', file);
    const res = await fetch('/api/upload/icon', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
    }
    return (await res.json()).url;
}

// ═══════════════════════════════════════════════════════════════
// UI Functions
// ═══════════════════════════════════════════════════════════════

let loadingTimer = null;

function showLoading() {
    clearTimeout(loadingTimer);
    loadingTimer = setTimeout(() => {
        elements.loadingOverlay.classList.add('active');
    }, 150);
}

function hideLoading() {
    clearTimeout(loadingTimer);
    elements.loadingOverlay.classList.remove('active');
}

function showModal(title, bodyHTML) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = bodyHTML;
    elements.modal.classList.add('active');
}

function hideModal() {
    elements.modal.classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════
// Collections
// ═══════════════════════════════════════════════════════════════

async function loadCollections() {
    try {
        collections = await getCollections();
        renderCollections();

        // Auto-select last used collection, fall back to first
        if (collections.length > 0 && !currentCollectionId) {
            const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
            const last = lastId && collections.find(c => c.id === lastId);
            selectCollection(last ? last.id : collections[0].id);
        }
    } catch (error) {
        console.error('Failed to load collections:', error);
    }
}

function renderCollections() {
    elements.collectionsList.innerHTML = collections
        .map(collection => `
            <li class="collection-item">
                <button
                    data-collection-id="${collection.id}"
                    onclick="selectCollection(${collection.id})"
                    class="${currentView === 'collections' && currentCollectionId === collection.id ? 'active' : ''}"
                >
                    ${escapeHtml(collection.name)}
                </button>
            </li>
        `)
        .join('');

    // Update settings button active state
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.classList.toggle('active', currentView === 'settings');
    }
}

function goHome() {
    const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
    const target = (lastId && collections.find(c => c.id === lastId)) || collections[0];
    if (target) selectCollection(target.id);
}

async function selectCollection(id) {
    _searchQuery = '';
    clearTimeout(_searchDebounceTimer);
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';

    elements.sectionsContainer.classList.add('sections-exit');
    currentView = 'collections';
    currentCollectionId = id;
    localStorage.setItem('ctrltab-last-collection', id);
    renderCollections();
    await loadDashboard(id);

    // Show collection action buttons, hide settings back
    elements.editCollectionBtn.style.display = 'inline-flex';
    elements.addSectionBtn.style.display = 'inline-flex';
    elements.settingsBackBtn.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
// Settings View
// ═══════════════════════════════════════════════════════════════

function showSettings() {
    currentView = 'settings';
    currentCollectionId = null;
    renderCollections();

    elements.collectionTitle.textContent = 'Settings';
    elements.editCollectionBtn.style.display = 'none';
    elements.addSectionBtn.style.display = 'none';
    elements.settingsBackBtn.style.display = '';

    const currentTheme = localStorage.getItem('ctrltab-theme') || 'light';
    const user = getCurrentUser();

    let html = '';

    // Theme section
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">Theme</h3>
            <div class="theme-cards">
                <button class="theme-card ${currentTheme === 'light' ? 'active' : ''}" data-theme-value="light" onclick="setTheme('light')">
                    <div class="theme-preview theme-preview-light">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">Light</span>
                </button>
                <button class="theme-card ${currentTheme === 'dark' ? 'active' : ''}" data-theme-value="dark" onclick="setTheme('dark')">
                    <div class="theme-preview theme-preview-dark">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">Dark</span>
                </button>
                <button class="theme-card ${currentTheme === 'oled' ? 'active' : ''}" data-theme-value="oled" onclick="setTheme('oled')">
                    <div class="theme-preview theme-preview-oled">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">OLED</span>
                </button>
                <button class="theme-card ${currentTheme === 'cyberpunk' ? 'active' : ''}" data-theme-value="cyberpunk" onclick="setTheme('cyberpunk')">
                    <div class="theme-preview theme-preview-cyberpunk">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">Cyberpunk</span>
                </button>
                <button class="theme-card ${currentTheme === 'batman' ? 'active' : ''}" data-theme-value="batman" onclick="setTheme('batman')">
                    <div class="theme-preview theme-preview-batman">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">Batman</span>
                </button>
            </div>
            <div class="bg-image-section">
                <span class="accent-color-label">Background image</span>
                <div class="bg-image-controls">
                    ${_backgroundImage ? '' : `
                        <span class="bg-image-none">No background set</span>
                    `}
                    <label class="btn-secondary bg-upload-label">
                        ${_backgroundImage ? 'Change' : 'Upload'}
                        <input type="file" accept="image/jpeg,image/png,image/bmp,image/gif"
                               style="display:none" onchange="handleBgUpload(this)">
                    </label>
                    ${_backgroundImage ? `
                        <button class="btn-text-danger" onclick="removeBgImage()">Remove</button>
                    ` : ''}
                </div>
                ${_backgroundImage ? `
                    <div class="toggle-label" style="margin-top: var(--spacing-sm);">
                        <label class="toggle-switch">
                            <input type="checkbox" ${_backgroundDim ? 'checked' : ''} onchange="handleBgDimToggle(this.checked)">
                            <span class="toggle-track"></span>
                        </label>
                        <span>Dim background</span>
                    </div>
                ` : ''}
            </div>
            ${currentTheme !== 'cyberpunk' && currentTheme !== 'batman' ? `<div class="accent-color-section">
                <span class="accent-color-label">Accent color</span>
                <div class="accent-presets">
                    ${(() => {
                        const isCustom = !!_accentColor && !ACCENT_PRESETS.includes(_accentColor);
                        const effective = _accentColor || '#e2003d';
                        return ACCENT_PRESETS.map(color => `
                            <button class="accent-preset${!isCustom && color === effective ? ' active' : ''}"
                                    data-color="${color}"
                                    style="background:${color}"
                                    onclick="selectAccentPreset('${color}')"
                                    title="${color}"></button>
                        `).join('') + `
                            <label class="accent-preset accent-preset-custom${isCustom ? ' active' : ''}"
                                   title="Custom color"
                                   style="${isCustom ? `background:${_accentColor}` : ''}">
                                <span class="accent-preset-custom-icon"${isCustom ? ' style="opacity:0"' : ''}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                </span>
                                <input type="color" id="accentColorInput"
                                       value="${_accentColor || '#e2003d'}"
                                       style="position:absolute;opacity:0;width:0;height:0;pointer-events:none"
                                       oninput="updateAccentPreview(this.value)"
                                       onchange="handleAccentColorChange(this.value)">
                            </label>
                        `;
                    })()}
                </div>
            </div>` : ''}
        </div>
    `;

    // Preferences section
    const openInNewTab = getOpenInNewTab();
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">Preferences</h3>
            <div class="toggle-label">
                <label class="toggle-switch">
                    <input type="checkbox" id="openNewTabCheckbox" ${openInNewTab ? 'checked' : ''} onchange="setOpenInNewTab(this.checked)">
                    <span class="toggle-track"></span>
                </label>
                <span>Open links in new tab</span>
            </div>
            <div class="toggle-label">
                <label class="toggle-switch">
                    <input type="checkbox" ${_showLinkUrls ? 'checked' : ''} onchange="toggleShowLinkUrls(this.checked)">
                    <span class="toggle-track"></span>
                </label>
                <span>Show URL in link cards</span>
            </div>
            <div class="toggle-label">
                <label class="toggle-switch">
                    <input type="checkbox" ${_twoColLayout ? 'checked' : ''} onchange="toggleTwoColLayout(this.checked)">
                    <span class="toggle-track"></span>
                </label>
                <span>Two-column section layout</span>
            </div>
        </div>
    `;

    // Admin: User Management section
    if (isAdmin()) {
        html += `
            <div class="settings-section">
                <h3 class="settings-section-title">User Management</h3>
                <div id="usersTableContainer">
                    <div style="color: var(--color-text-muted);">Loading users...</div>
                </div>
            </div>
        `;
    }

    // Import / Export section
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">Import / Export</h3>
            <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px;">
                Import bookmarks from your browser or from Linkwarden.
            </p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn-secondary" onclick="openImportModal()" style="display:inline-flex;align-items:center;gap:6px;">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v8M5 7l3 3 3-3M2 12v1.5A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V12"
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Import Links
                </button>
            </div>
        </div>
    `;

    // Account section
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">Account</h3>
            <div class="settings-field">
                <span class="settings-field-label">Username</span>
                <span class="settings-field-value">${user ? escapeHtml(user.username) : ''}</span>
            </div>
            <div class="settings-field">
                <span class="settings-field-label">Role</span>
                <span class="settings-field-value">
                    <span class="badge ${user && user.is_admin ? 'badge-admin' : 'badge-user'}">
                        ${user && user.is_admin ? 'Admin' : 'User'}
                    </span>
                </span>
            </div>
            <div class="settings-account-actions">
                <button class="btn-secondary" onclick="showChangePasswordModal()">Change Password</button>
                <button class="btn-danger" onclick="logout()">Logout</button>
            </div>
        </div>
    `;

    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">Data</h3>
            <div class="settings-label">Import from Linkwarden</div>
            <div class="settings-hint">Upload a Linkwarden JSON export file. Each collection will be imported with one section ("Links").</div>
            <label class="btn-secondary import-label" id="importLinkwardenLabel" style="margin-top: var(--spacing-sm); display: inline-flex;">
                Choose file
                <input type="file" accept=".json,application/json" style="display:none" onchange="handleLinkwardenImport(this)">
            </label>
            <div id="importStatus" class="import-status" style="display:none;"></div>
        </div>
    `;

    html += `
        <div class="settings-footer">
            Built by Michael Smith, with Claude Code
            <a href="https://github.com/erymantho/ctrlTAB" target="_blank" rel="noopener" class="github-link">
                <img class="github-logo" src="icons/github-logo.svg" alt="GitHub" width="14" height="14">
                GitHub
            </a>
            <div class="settings-version">v0.2</div>
        </div>
    `;

    elements.sectionsContainer.innerHTML = html;

    // Load users table if admin
    if (isAdmin()) {
        loadUsersTable();
    }
}

async function loadUsersTable() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    try {
        const users = await apiRequest('/admin/users');

        const rows = users.map(user => `
            <tr>
                <td>${escapeHtml(user.username)}</td>
                <td>
                    <span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">
                        ${user.is_admin ? 'Admin' : 'User'}
                    </span>
                </td>
                <td style="font-size: 12px; color: var(--color-text-muted);">
                    ${new Date(user.created_at).toLocaleDateString()}
                </td>
                <td>
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <button class="btn-icon" onclick="showEditUserModal(${user.id})" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-icon-danger" onclick="confirmDeleteUser(${user.id}, '${escapeHtml(user.username)}')" title="Delete">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div style="margin-bottom: var(--spacing-lg);">
                <button class="btn-primary" onclick="showAddUserModal()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Add User
                </button>
            </div>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<div style="color: var(--color-text-muted);">Failed to load users</div>';
    }
}

async function loadDashboard(collectionId) {
    try {
        showLoading();
        const data = await getDashboard(collectionId);

        elements.collectionTitle.textContent = data.name;
        elements.collectionTitle.classList.add('title-flash');
        setTimeout(() => elements.collectionTitle.classList.remove('title-flash'), 500);
        renderSections(data.sections || []);
        initDragAndDrop();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Failed to load collection</p>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

function renderSections(sections) {
    elements.sectionsContainer.classList.remove('sections-exit');

    if (sections.length === 0) {
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📑</div>
                <p>No sections yet. Click "Add Section" to get started.</p>
            </div>
        `;
        elements.sectionsContainer.classList.add('sections-enter');
        setTimeout(() => elements.sectionsContainer.classList.remove('sections-enter'), 600);
        return;
    }

    elements.sectionsContainer.innerHTML = sections
        .map(section => {
            const links = section.links || [];
            return `
            <div class="section" data-section-id="${section.id}">
                <div class="section-header" draggable="true">
                    <h3 class="section-title">${escapeHtml(section.name)}</h3>
                    <div class="section-actions">
                        <button class="btn-icon btn-icon--labeled" onclick="showAddLinkModal(${section.id})" title="Add link">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span>Add link</span>
                        </button>
                        ${links.length > 1 ? `
                        <button class="btn-icon btn-icon--labeled" onclick="sortSectionAlpha(${section.id})" title="Sort A-Z">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h7M2 8h5M2 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M11 3l2 2 2-2M13 5V13M11 11l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Sort A-Z</span>
                        </button>` : ''}
                        <button class="btn-icon btn-icon--labeled" onclick="showEditSectionModal(${section.id}, '${escapeHtml(section.name)}')" title="Edit section">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Edit section</span>
                        </button>
                    </div>
                </div>
                <div class="links-grid" data-section-id="${section.id}">
                    ${renderLinks(links, section.id)}
                </div>
            </div>
        `;
        })
        .join('');

    elements.sectionsContainer.classList.add('sections-enter');
    setTimeout(() => elements.sectionsContainer.classList.remove('sections-enter'), 600);
}

function buildFaviconSources(link) {
    const seen = new Set();
    const sources = [];
    const add = url => { if (url && !seen.has(url)) { seen.add(url); sources.push(url); } };

    if (link.favicon) add(link.favicon);

    try {
        const { origin, hostname } = new URL(link.url);
        const m = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        const isLocal = hostname === 'localhost' || (m && (
            +m[1] === 10 || +m[1] === 127 ||
            (+m[1] === 172 && +m[2] >= 16 && +m[2] <= 31) ||
            (+m[1] === 192 && +m[2] === 168)
        ));

        // Browser-side fallback chain (works even when server couldn't reach local apps)
        add(`${origin}/favicon.ico`);
        add(`${origin}/favicon.png`);
        add(`${origin}/apple-touch-icon.png`);

        if (!isLocal) {
            add(`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`);
        }
    } catch {}

    return sources;
}

function onFaviconError(img) {
    const fallbacks = (img.dataset.fallbacks || '').split('|').filter(Boolean);
    if (fallbacks.length > 0) {
        img.dataset.fallbacks = fallbacks.slice(1).join('|');
        img.src = fallbacks[0];
        return;
    }
    // All sources exhausted: show letter initial
    const box = img.closest('.link-favicon');
    const initial = img.dataset.initial || '?';
    if (box) box.innerHTML = `<span class="link-favicon-initial">${initial}</span>`;
}

function renderLinks(links, sectionId) {
    if (links.length === 0) {
        return '<p style="color: var(--color-text-muted); font-size: 14px;">No links yet</p>';
    }

    const target = getOpenInNewTab() ? ' target="_blank"' : '';
    return links
        .map(link => {
            const sources = buildFaviconSources(link);
            const initial = escapeHtml((link.title || '?')[0].toUpperCase());
            let displayUrl = link.url;
            try { displayUrl = new URL(link.url).hostname.replace(/^www\./, ''); } catch {}
            const faviconHtml = sources.length > 0
                ? `<img src="${escapeHtml(sources[0])}" data-fallbacks="${escapeHtml(sources.slice(1).join('|'))}" data-initial="${initial}" alt="" draggable="false" onerror="onFaviconError(this)">`
                : `<span class="link-favicon-initial">${initial}</span>`;
            return `
            <a href="${escapeHtml(link.url)}"${target} class="link-card" draggable="true" data-link-id="${link.id}">
                <div class="link-favicon">
                    ${faviconHtml}
                </div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                    <div class="link-url">${escapeHtml(displayUrl)}</div>
                </div>
                <div class="link-actions" onclick="event.preventDefault(); event.stopPropagation();">
                    <button class="btn-icon" onclick="showEditLinkModal(${link.id}, ${link.section_id}, '${escapeHtml(link.title)}', '${escapeHtml(link.url)}', '${escapeHtml(link.favicon || '')}')" title="Edit link">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="copyLinkUrl('${escapeHtml(link.url)}', this)" title="Copy URL">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <rect x="5.5" y="2.5" width="8" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5.5 4.5H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h6.5a1 1 0 0 0 1-1V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </a>
        `;
        })
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// Search
// ═══════════════════════════════════════════════════════════════

function handleSearchInput(value) {
    _searchQuery = value.trim();

    if (elements.searchClearBtn) {
        elements.searchClearBtn.style.display = _searchQuery ? '' : 'none';
    }

    clearTimeout(_searchDebounceTimer);

    if (_searchQuery.length < 2) {
        if (_searchQuery.length === 0) clearSearch();
        return;
    }

    _searchDebounceTimer = setTimeout(() => performSearch(_searchQuery), 300);
}

async function performSearch(q) {
    try {
        const results = await apiRequest(`/search?q=${encodeURIComponent(q)}`);
        if (_searchQuery !== q) return;
        renderSearchResults(q, results);
    } catch (err) {
        console.error('Search failed:', err);
    }
}

function renderSearchResults(q, results) {
    currentView = 'search';
    renderCollections();

    elements.collectionTitle.textContent = `Search: "${q}"`;
    elements.editCollectionBtn.style.display = 'none';
    elements.addSectionBtn.style.display = 'none';
    elements.settingsBackBtn.style.display = 'none';

    if (results.length === 0) {
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>No results for "<strong>${escapeHtml(q)}</strong>"</p>
            </div>
        `;
        return;
    }

    const target = getOpenInNewTab() ? ' target="_blank"' : '';
    const cards = results.map(link => {
        const sources = buildFaviconSources(link);
        const initial = escapeHtml((link.title || '?')[0].toUpperCase());
        let displayUrl = link.url;
        try { displayUrl = new URL(link.url).hostname.replace(/^www\./, ''); } catch {}
        const faviconHtml = sources.length > 0
            ? `<img src="${escapeHtml(sources[0])}" data-fallbacks="${escapeHtml(sources.slice(1).join('|'))}" data-initial="${initial}" alt="" draggable="false" onerror="onFaviconError(this)">`
            : `<span class="link-favicon-initial">${initial}</span>`;

        return `
            <a href="${escapeHtml(link.url)}"${target} class="link-card search-result-card"
               draggable="false"
               data-link-id="${link.id}"
               onclick="selectCollection(${link.collection_id}); clearSearch();">
                <div class="link-favicon">${faviconHtml}</div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                    <div class="link-url">${escapeHtml(displayUrl)}</div>
                    <div class="search-breadcrumb">${escapeHtml(link.collection_name)} &rsaquo; ${escapeHtml(link.section_name)}</div>
                </div>
            </a>
        `;
    }).join('');

    elements.sectionsContainer.innerHTML = `
        <div class="search-results-container">
            <p class="search-results-count">${results.length} result${results.length === 1 ? '' : 's'}</p>
            <div class="links-grid">${cards}</div>
        </div>
    `;
}

function clearSearch() {
    _searchQuery = '';
    clearTimeout(_searchDebounceTimer);

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';

    if (currentView === 'search') {
        const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
        const target = (lastId && collections.find(c => c.id === lastId)) || collections[0];
        if (target) {
            selectCollection(target.id);
        } else {
            currentView = 'collections';
            renderCollections();
        }
    }
}

function openFirstSearchResult() {
    const first = elements.sectionsContainer.querySelector('.search-result-card');
    if (first) first.click();
}

// ═══════════════════════════════════════════════════════════════
// Import
// ═══════════════════════════════════════════════════════════════

async function handleLinkwardenImport(input) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;

    const statusEl = document.getElementById('importStatus');
    const labelEl = document.getElementById('importLinkwardenLabel');

    statusEl.style.display = '';
    statusEl.className = 'import-status import-status--loading';
    statusEl.textContent = 'Importing…';
    labelEl.style.pointerEvents = 'none';

    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/import/linkwarden`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');

        const { imported } = data;
        statusEl.className = 'import-status import-status--success';
        statusEl.textContent = `✓ Imported ${imported.collections} collection${imported.collections !== 1 ? 's' : ''}, ${imported.links} link${imported.links !== 1 ? 's' : ''}.`;

        await loadCollections();
    } catch (err) {
        statusEl.className = 'import-status import-status--error';
        statusEl.textContent = err.message || 'Import failed.';
    } finally {
        labelEl.style.pointerEvents = '';
    }
}

// ═══════════════════════════════════════════════════════════════
// Drag-and-Drop
// ═══════════════════════════════════════════════════════════════

let _dragLinkId = null;       // ID of the link being dragged
let _dragLinkCard = null;     // DOM reference to the card (kept during cross-col navigation)
let _dragSrcSectionId = null; // section the link originated from
let _dragCardHeight = 0;      // card height at dragstart (for placeholder sizing)
let _placeholder = null;      // drop-target indicator div that moves instead of the card
let _dragSection = null;      // section element being dragged
let _dragCtrl = null;         // AbortController for all drag event listeners
let _colHoverTimer = null;    // timer for hovering over a collection in the sidebar
let _colHoverCtrl = null;     // AbortController for collection hover listeners

const LINKS_EMPTY_HTML = '<p style="color: var(--color-text-muted); font-size: 14px;">No links yet</p>';

function _stopColHover() {
    if (_colHoverCtrl) { _colHoverCtrl.abort(); _colHoverCtrl = null; }
    clearTimeout(_colHoverTimer);
    _colHoverTimer = null;
    document.querySelectorAll('.collection-drop-hover').forEach(el => el.classList.remove('collection-drop-hover'));
}

function _startColHover() {
    _stopColHover();
    _colHoverCtrl = new AbortController();
    const { signal } = _colHoverCtrl;
    document.querySelectorAll('.collections-list button[data-collection-id]').forEach(btn => {
        const colId = parseInt(btn.dataset.collectionId);
        if (colId === currentCollectionId) return;
        btn.addEventListener('dragover', e => {
            e.preventDefault();
            btn.classList.add('collection-drop-hover');
            if (!_colHoverTimer) {
                _colHoverTimer = setTimeout(() => {
                    _colHoverTimer = null;
                    _stopColHover();
                    document.body.classList.remove('link-dragging');
                    // Park card on body so it survives the collection re-render
                    if (_dragLinkCard) {
                        _dragLinkCard.classList.remove('dragging');
                        _dragLinkCard.style.display = 'none';
                        document.body.appendChild(_dragLinkCard);
                    }
                    // Placeholder belongs to the old collection's grid — discard it
                    _placeholder?.remove();
                    _placeholder = null;
                    selectCollection(colId);
                }, 800);
            }
        }, { signal });
        btn.addEventListener('dragleave', () => {
            btn.classList.remove('collection-drop-hover');
            clearTimeout(_colHoverTimer);
            _colHoverTimer = null;
        }, { signal });
    });
}

function initDragAndDrop() {
    if (_dragCtrl) _dragCtrl.abort();
    _dragCtrl = new AbortController();
    const { signal } = _dragCtrl;

    // Cross-collection drag in progress: re-attach hover listeners for the new collection
    if (_dragLinkId) _startColHover();

    // ── Link drag ──────────────────────────────────────────────────────
    document.querySelectorAll('.links-grid').forEach(grid => {
        grid.addEventListener('dragstart', e => {
            const card = e.target.closest('.link-card[data-link-id]');
            if (!card) return;
            _dragLinkId = parseInt(card.dataset.linkId);
            _dragLinkCard = card;
            _dragSrcSectionId = parseInt(grid.dataset.sectionId);
            _dragCardHeight = card.offsetHeight;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.linkId);
            document.body.classList.add('link-dragging');
            // Create placeholder — it moves around grids; the card stays put
            _placeholder = document.createElement('div');
            _placeholder.className = 'drag-placeholder';
            _placeholder.style.height = _dragCardHeight + 'px';
            _startColHover();
        }, { signal });

        grid.addEventListener('dragover', e => {
            e.preventDefault();
            if (!_dragLinkId) return;
            // After cross-collection navigation the placeholder was discarded; recreate it
            if (!_placeholder) {
                _placeholder = document.createElement('div');
                _placeholder.className = 'drag-placeholder';
                _placeholder.style.height = (_dragCardHeight || 60) + 'px';
            }
            grid.querySelector(':scope > p')?.remove();
            const after = getDragAfterElement(grid, e.clientX, e.clientY);
            if (after && after !== _placeholder) grid.insertBefore(_placeholder, after);
            else if (!after) grid.appendChild(_placeholder);
        }, { signal });

        grid.addEventListener('drop', e => e.preventDefault(), { signal });
    });

    // ── Section drag ───────────────────────────────────────────────────
    const container = document.getElementById('sectionsContainer');
    if (!container) return;

    container.addEventListener('dragstart', e => {
        if (_dragLinkId) return;
        const header = e.target.closest('.section-header');
        const section = header?.closest('.section[data-section-id]');
        if (!section) return;
        _dragSection = section;
        section.classList.add('section-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', section.dataset.sectionId);
    }, { signal });

    container.addEventListener('dragover', e => {
        if (!_dragSection) return;
        e.preventDefault();
        const after = getSectionAfterElement(container, e.clientY);
        if (after) container.insertBefore(_dragSection, after);
        else container.appendChild(_dragSection);
    }, { signal });

    // ── Global dragend ─────────────────────────────────────────────────
    document.addEventListener('dragend', async () => {
        document.body.classList.remove('link-dragging');
        _stopColHover();

        // Section drag finished
        if (_dragSection) {
            _dragSection.classList.remove('section-dragging');
            const orderedIds = [...container.querySelectorAll('.section[data-section-id]')]
                .map(el => parseInt(el.dataset.sectionId));
            _dragSection = null;
            try {
                await reorderSections(currentCollectionId, orderedIds);
            } catch {
                loadDashboard(currentCollectionId);
            }
            return;
        }

        // Link drag finished
        if (!_dragLinkId) return;

        const card = _dragLinkCard;
        const linkId = _dragLinkId;
        const srcSectionId = _dragSrcSectionId;

        // Where is the placeholder? That's the drop target.
        const targetGrid = _placeholder?.isConnected ? _placeholder.parentElement : null;

        // Move card to placeholder position before removing placeholder
        if (targetGrid) targetGrid.insertBefore(card, _placeholder);
        _placeholder?.remove();
        _placeholder = null;

        _dragLinkId = null;
        _dragLinkCard = null;
        _dragSrcSectionId = null;
        _dragCardHeight = 0;

        card.classList.remove('dragging');
        card.style.display = '';

        if (!targetGrid || !targetGrid.classList.contains('links-grid')) {
            // Drag was cancelled or dropped outside any grid
            if (!card.isConnected) card.remove(); // was parked on body
            else loadDashboard(currentCollectionId);
            return;
        }

        const targetSectionId = parseInt(targetGrid.dataset.sectionId);
        const orderedIds = [...targetGrid.querySelectorAll('.link-card[data-link-id]')]
            .map(el => parseInt(el.dataset.linkId));

        try {
            if (targetSectionId !== srcSectionId) {
                await apiRequest(`/links/${linkId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ section_id: targetSectionId }),
                });
                // Restore "No links yet" in source section if it's now empty
                const srcGrid = document.querySelector(`.links-grid[data-section-id="${srcSectionId}"]`);
                if (srcGrid && !srcGrid.querySelector('.link-card[data-link-id]')) {
                    srcGrid.innerHTML = LINKS_EMPTY_HTML;
                }
            }
            await reorderLinks(targetSectionId, orderedIds);
        } catch {
            loadDashboard(currentCollectionId);
        }
    }, { signal });
}

async function copyLinkUrl(url, btn) {
    try {
        await navigator.clipboard.writeText(url);
        const original = btn.innerHTML;
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        setTimeout(() => { btn.innerHTML = original; }, 1200);
    } catch { /* clipboard not available */ }
}

function getSectionAfterElement(container, y) {
    const sections = [...container.querySelectorAll('.section[data-section-id]:not(.section-dragging)')];
    for (const section of sections) {
        const box = section.getBoundingClientRect();
        if (y < box.top + box.height / 2) return section;
    }
    return null;
}

function getDragAfterElement(grid, x, y) {
    const cards = [...grid.querySelectorAll('.link-card:not(.dragging)')];
    for (const card of cards) {
        const box = card.getBoundingClientRect();
        const onSameRow = y >= box.top && y <= box.bottom;
        const belowCursor = box.top > y;
        if (belowCursor || (onSameRow && x < box.left + box.width / 2)) {
            return card;
        }
    }
    return null;
}

async function sortSectionAlpha(sectionId) {
    const grid = document.querySelector(`.links-grid[data-section-id="${sectionId}"]`);
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.link-card[data-link-id]')];
    cards.sort((a, b) =>
        a.querySelector('.link-title').textContent.localeCompare(
            b.querySelector('.link-title').textContent, undefined, { sensitivity: 'base' }
        )
    );
    cards.forEach(card => grid.appendChild(card));
    const orderedIds = cards.map(card => parseInt(card.dataset.linkId));
    await reorderLinks(sectionId, orderedIds);
}

// ═══════════════════════════════════════════════════════════════
// Modal Actions - Collections
// ═══════════════════════════════════════════════════════════════

function showAddCollectionModal() {
    showModal('Add Collection', `
        <form onsubmit="handleAddCollection(event)">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" placeholder="e.g., Work Projects" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Create</button>
            </div>
        </form>
    `);
}

async function handleAddCollection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await createCollection(name);
        await loadCollections();
        hideModal();
    } catch (error) {
        alert('Failed to create collection');
    } finally {
        hideLoading();
    }
}

function showEditCollectionModal() {
    const collection = collections.find(c => c.id === currentCollectionId);
    if (!collection) return;

    showModal('Edit Collection', `
        <form onsubmit="handleEditCollection(event)">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" value="${escapeHtml(collection.name)}" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
        <div class="modal-danger-zone">
            <button type="button" class="btn-text-danger" onclick="confirmDeleteCollection()">Delete this collection</button>
        </div>
    `);
}

async function handleEditCollection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await updateCollection(currentCollectionId, { name });
        await loadCollections();
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to update collection');
    } finally {
        hideLoading();
    }
}

function confirmDeleteCollection() {
    const collection = collections.find(c => c.id === currentCollectionId);
    if (!collection) return;

    showModal('Delete Collection', `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            Are you sure you want to delete "<strong>${escapeHtml(collection.name)}</strong>"?
            <br><br>
            This will permanently delete all sections and links in this collection.
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
            <button type="button" class="btn-danger" onclick="handleDeleteCollection()">Delete</button>
        </div>
    `);
}

async function handleDeleteCollection() {
    try {
        showLoading();
        await deleteCollection(currentCollectionId);
        currentCollectionId = null;
        await loadCollections();
        elements.collectionTitle.textContent = 'ctrlTAB';
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌘</div>
                <p>Create your first collection</p>
                <button class="btn-primary" onclick="showAddCollectionModal()" style="margin-top: var(--spacing-lg);">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    New Collection
                </button>
            </div>
        `;
        elements.editCollectionBtn.style.display = 'none';
        elements.addSectionBtn.style.display = 'none';
        hideModal();
    } catch (error) {
        alert('Failed to delete collection');
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════
// Modal Actions - Sections
// ═══════════════════════════════════════════════════════════════

function showAddSectionModal() {
    showModal('Add Section', `
        <form onsubmit="handleAddSection(event)">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" placeholder="e.g., Documentation" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Create</button>
            </div>
        </form>
    `);
}

async function handleAddSection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await createSection(currentCollectionId, name);
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to create section');
    } finally {
        hideLoading();
    }
}

function showEditSectionModal(sectionId, currentName) {
    showModal('Edit Section', `
        <form onsubmit="handleEditSection(event, ${sectionId})">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" value="${currentName}" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
        <div class="modal-danger-zone">
            <button type="button" class="btn-text-danger" onclick="confirmDeleteSection(${sectionId})">Delete this section</button>
        </div>
    `);
}

async function handleEditSection(event, sectionId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await updateSection(sectionId, { name });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to update section');
    } finally {
        hideLoading();
    }
}

function confirmDeleteSection(sectionId) {
    showModal('Delete Section', `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            Are you sure you want to delete this section?
            <br><br>
            This will permanently delete all links in this section.
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
            <button type="button" class="btn-danger" onclick="handleDeleteSection(${sectionId})">Delete</button>
        </div>
    `);
}

async function handleDeleteSection(sectionId) {
    try {
        showLoading();
        await deleteSection(sectionId);
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to delete section');
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════
// Modal Actions - Links
// ═══════════════════════════════════════════════════════════════

function faviconFormGroup(currentValue = '') {
    const hasIcon = !!currentValue;
    const placeholderSvg = `<svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.5C8 1.5 6 4 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4 10 8s-2 6.5-2 6.5M1.5 8h13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
    return `
        <div class="form-group">
            <label class="form-label">Icon <span style="opacity:0.5;font-weight:400;">(optional)</span></label>
            <input type="hidden" name="favicon" id="faviconHiddenInput" value="${escapeHtml(currentValue)}">
            <input type="file" id="faviconFileInput" accept=".png,.svg,.ico" style="display:none" onchange="handleIconUpload(this)">
            <div class="icon-upload-group">
                <div class="icon-preview-box" id="faviconPreviewBox">
                    ${hasIcon
                        ? `<img id="faviconPreviewImg" src="${escapeHtml(currentValue)}" alt="" onerror="this.style.display='none'">`
                        : `<span id="faviconPreviewImg" class="icon-preview-placeholder">${placeholderSvg}</span>`}
                </div>
                <div class="icon-upload-actions">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('faviconFileInput').click()">Upload icon</button>
                    <button type="button" class="btn-text-danger" id="faviconRemoveBtn" style="${hasIcon ? '' : 'display:none'}" onclick="removeIcon()">Remove</button>
                    <p class="icon-upload-hint">PNG, SVG or ICO &middot; max 2 MB</p>
                </div>
            </div>
        </div>`;
}

const _faviconPlaceholderSvg = `<svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.5C8 1.5 6 4 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4 10 8s-2 6.5-2 6.5M1.5 8h13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;

async function handleIconUpload(input) {
    const file = input.files[0];
    if (!file) return;
    try {
        const url = await uploadIcon(file);
        document.getElementById('faviconHiddenInput').value = url;
        const wrap = document.getElementById('faviconPreviewBox');
        wrap.innerHTML = `<img id="faviconPreviewImg" src="${url}" alt="" onerror="this.style.display='none'">`;
        document.getElementById('faviconRemoveBtn').style.display = '';
    } catch (err) {
        console.error('[upload] error:', err);
        alert(err.message || 'Failed to upload icon');
    }
    input.value = '';
}

function removeIcon() {
    document.getElementById('faviconHiddenInput').value = '';
    const wrap = document.getElementById('faviconPreviewBox');
    wrap.innerHTML = `<span id="faviconPreviewImg" class="icon-preview-placeholder">${_faviconPlaceholderSvg}</span>`;
    document.getElementById('faviconRemoveBtn').style.display = 'none';
}

async function handleBgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    input.value = '';
    try {
        const formData = new FormData();
        formData.append('background', file);
        const res = await fetch('/api/upload/background', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
            body: formData,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Upload failed');
        }
        const { url } = await res.json();
        _backgroundImage = url;
        localStorage.setItem('ctrltab-bg', url);
        applyBackgroundImage(url);
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundImage: url }) });
        showSettings();
    } catch (err) {
        alert(err.message || 'Failed to upload background');
    }
}

async function handleBgDimToggle(checked) {
    _backgroundDim = checked;
    localStorage.setItem('ctrltab-bg-dim', checked ? '1' : '0');
    applyBackgroundDim(checked);
    try {
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundDim: checked }) });
    } catch {}
}

async function removeBgImage() {
    _backgroundImage = null;
    localStorage.removeItem('ctrltab-bg');
    applyBackgroundImage(null);
    try {
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundImage: null }) });
    } catch {}
    showSettings();
}

function showAddLinkModal(sectionId) {
    showModal('Add Link', `
        <form onsubmit="handleAddLink(event, ${sectionId})">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-input" name="title" placeholder="e.g., GitHub" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">URL</label>
                <input type="url" class="form-input" name="url" placeholder="https://github.com" required>
            </div>
            ${faviconFormGroup()}
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Create</button>
            </div>
        </form>
    `);
}

async function handleAddLink(event, sectionId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const title = formData.get('title');
    const url = formData.get('url');
    const favicon = formData.get('favicon') || undefined; // undefined = let server auto-fetch

    try {
        showLoading();
        await createLink(sectionId, { title, url, favicon });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to create link');
    } finally {
        hideLoading();
    }
}

function showEditLinkModal(linkId, sectionId, currentTitle, currentUrl, currentFavicon) {
    showModal('Edit Link', `
        <form onsubmit="handleEditLink(event, ${linkId})">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-input" name="title" value="${currentTitle}" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">URL</label>
                <input type="url" class="form-input" name="url" value="${currentUrl}" required>
            </div>
            ${faviconFormGroup(currentFavicon)}
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
        <div class="modal-danger-zone">
            <button type="button" class="btn-text-danger" onclick="confirmDeleteLink(${linkId})">Delete this link</button>
        </div>
    `);
}

async function handleEditLink(event, linkId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const title = formData.get('title');
    const url = formData.get('url');
    const favicon = formData.get('favicon'); // '' = removed (re-fetch), non-empty = custom icon

    try {
        showLoading();
        await updateLink(linkId, { title, url, favicon });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to update link');
    } finally {
        hideLoading();
    }
}

function confirmDeleteLink(linkId) {
    showModal('Delete Link', `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            Are you sure you want to delete this link?
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
            <button type="button" class="btn-danger" onclick="handleDeleteLink(${linkId})">Delete</button>
        </div>
    `);
}

async function handleDeleteLink(linkId) {
    try {
        showLoading();
        await deleteLink(linkId);
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to delete link');
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════
// Change Password
// ═══════════════════════════════════════════════════════════════

function showChangePasswordModal() {
    showModal('Change Password', `
        <form onsubmit="handleChangePassword(event)">
            <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" class="form-input" name="currentPassword" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" class="form-input" name="newPassword" required minlength="6">
                <small style="color: var(--color-text-muted); font-size: 12px;">Minimum 6 characters</small>
            </div>
            <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-input" name="confirmPassword" required minlength="6">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="submit" class="btn-primary">Change Password</button>
            </div>
        </form>
    `);
}

async function handleChangePassword(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    try {
        showLoading();
        await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        hideLoading();
        hideModal();
        alert('Password changed successfully');
    } catch (error) {
        hideLoading();
        alert('Failed to change password: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// Admin Panel
// ═══════════════════════════════════════════════════════════════

async function refreshUsersInSettings() {
    if (currentView === 'settings' && isAdmin()) {
        await loadUsersTable();
    }
}

function showAddUserModal() {
    showModal('Add User', `
        <form onsubmit="handleAddUser(event)">
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-input" name="username" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" name="password" required minlength="6">
                <small style="color: var(--color-text-muted); font-size: 12px;">Minimum 6 characters</small>
            </div>
            <div class="form-group">
                <label class="form-label" style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <input type="checkbox" name="is_admin">
                    Admin privileges
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="refreshUsersInSettings()">Back</button>
                <button type="submit" class="btn-primary">Create User</button>
            </div>
        </form>
    `);
}

async function handleAddUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
        showLoading();
        await apiRequest('/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password'),
                is_admin: formData.get('is_admin') === 'on'
            })
        });
        hideLoading();
        hideModal();
        refreshUsersInSettings();
    } catch (error) {
        hideLoading();
        alert('Failed to create user: ' + error.message);
    }
}

async function showEditUserModal(userId) {
    try {
        showLoading();
        const users = await apiRequest('/admin/users');
        const user = users.find(u => u.id === userId);
        hideLoading();

        if (!user) { alert('User not found'); return; }

        showModal('Edit User', `
            <form onsubmit="handleEditUser(event, ${userId})">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" name="username" value="${escapeHtml(user.username)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">New Password (leave empty to keep current)</label>
                    <input type="password" class="form-input" name="password" minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <input type="checkbox" name="is_admin" ${user.is_admin ? 'checked' : ''}>
                        Admin privileges
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="refreshUsersInSettings()">Back</button>
                    <button type="submit" class="btn-primary">Save</button>
                </div>
            </form>
        `);
    } catch (error) {
        hideLoading();
        alert('Failed to load user');
    }
}

async function handleEditUser(event, userId) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const data = {
        username: formData.get('username'),
        is_admin: formData.get('is_admin') === 'on'
    };

    const password = formData.get('password');
    if (password) data.password = password;

    try {
        showLoading();
        await apiRequest(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        hideLoading();
        refreshUsersInSettings();
    } catch (error) {
        hideLoading();
        alert('Failed to update user: ' + error.message);
    }
}

function confirmDeleteUser(userId, username) {
    showModal('Delete User', `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            Are you sure you want to delete "<strong>${escapeHtml(username)}</strong>"?
            <br><br>
            This will permanently delete all their collections, sections, and links.
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="refreshUsersInSettings()">Cancel</button>
            <button type="button" class="btn-danger" onclick="handleDeleteUser(${userId})">Delete</button>
        </div>
    `);
}

async function handleDeleteUser(userId) {
    try {
        showLoading();
        await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
        hideLoading();
        hideModal();
        refreshUsersInSettings();
    } catch (error) {
        hideLoading();
        alert('Failed to delete user: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════
// Search – Full-page search with filters, sort & relevance scoring
// ═══════════════════════════════════════════════════════════════

let _searchCache = null;
let _searchCacheTime = 0;
const SEARCH_CACHE_TTL = 30000;
let _searchQuery = '';
let _searchFilterCollection = 'all';
let _searchSortBy = 'relevance';
let _isSearchView = false;

function initSearch() {
    const input = document.getElementById('globalSearch');
    const clearBtn = document.getElementById('searchClear');
    if (!input || !clearBtn) return;

    let debounceTimer = null;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const q = input.value.trim();
        if (q.length === 0) {
            if (_isSearchView) exitSearchView();
            return;
        }
        debounceTimer = setTimeout(() => {
            _searchQuery = q;
            enterSearchView();
        }, 250);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            if (_isSearchView) exitSearchView();
            input.blur();
        }
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            _searchQuery = input.value.trim();
            if (_searchQuery.length > 0) enterSearchView();
        }
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        if (_isSearchView) exitSearchView();
        input.focus();
    });

    // Ctrl+K shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });
}

function enterSearchView() {
    _isSearchView = true;
    document.querySelectorAll('.collection-item button').forEach(b => b.classList.remove('active'));

    elements.editCollectionBtn.style.display = 'none';
    elements.addSectionBtn.style.display = 'none';
    elements.settingsBackBtn.style.display = 'none';
    elements.collectionTitle.textContent = 'Search Results';

    performSearch();
}

function exitSearchView() {
    _isSearchView = false;
    _searchQuery = '';
    _searchFilterCollection = 'all';

    const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
    if (lastId) {
        selectCollection(lastId);
    } else if (collections.length > 0) {
        selectCollection(collections[0].id);
    }
}

async function fetchAllLinksForSearch() {
    const now = Date.now();
    if (_searchCache && (now - _searchCacheTime) < SEARCH_CACHE_TTL) return _searchCache;

    const token = localStorage.getItem('ctrltab-token');
    if (!token) return [];

    try {
        const cols = await apiRequest('/collections');
        const allLinks = [];

        const dashboards = await Promise.all(
            cols.map(col =>
                apiRequest('/dashboard/' + col.id).catch(() => null)
            )
        );

        cols.forEach((col, i) => {
            const dashboard = dashboards[i];
            if (!dashboard) return;
            for (const section of (dashboard.sections || [])) {
                for (const link of (section.links || [])) {
                    allLinks.push({
                        collectionId: col.id,
                        collectionName: col.name,
                        sectionName: section.name,
                        title: link.title,
                        url: link.url,
                        favicon: link.favicon || null,
                    });
                }
            }
        });

        _searchCache = allLinks;
        _searchCacheTime = now;
        return allLinks;
    } catch {
        return [];
    }
}

function invalidateSearchCache() {
    _searchCache = null;
}

function scoreSearchLink(link, words) {
    let score = 0;
    const titleLow = link.title.toLowerCase();
    const urlLow = link.url.toLowerCase();
    const colLow = link.collectionName.toLowerCase();
    const secLow = link.sectionName.toLowerCase();

    for (const w of words) {
        if (titleLow.includes(w)) {
            score += 10;
            if (titleLow.startsWith(w)) score += 5;
        }
        if (urlLow.includes(w)) score += 4;
        if (colLow.includes(w)) score += 2;
        if (secLow.includes(w)) score += 2;
    }
    return score;
}

async function performSearch() {
    const container = elements.sectionsContainer;
    if (!container) return;

    container.innerHTML = '<div class="search-loading"><span>Searching...</span></div>';

    const allLinks = await fetchAllLinksForSearch();
    const words = _searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) { container.innerHTML = ''; return; }

    let matched = [];
    for (const link of allLinks) {
        const score = scoreSearchLink(link, words);
        if (score > 0) matched.push({ ...link, _score: score });
    }

    if (_searchFilterCollection !== 'all') {
        const fid = parseInt(_searchFilterCollection);
        matched = matched.filter(l => l.collectionId === fid);
    }

    if (_searchSortBy === 'relevance') {
        matched.sort((a, b) => b._score - a._score);
    } else if (_searchSortBy === 'name-asc') {
        matched.sort((a, b) => a.title.localeCompare(b.title));
    } else if (_searchSortBy === 'name-desc') {
        matched.sort((a, b) => b.title.localeCompare(a.title));
    } else if (_searchSortBy === 'collection') {
        matched.sort((a, b) => a.collectionName.localeCompare(b.collectionName) || a.title.localeCompare(b.title));
    }

    const collectionsInResults = {};
    for (const l of allLinks) {
        if (scoreSearchLink(l, words) > 0) collectionsInResults[l.collectionId] = l.collectionName;
    }

    renderSearchView(matched, Object.entries(collectionsInResults), words);
}

function renderSearchView(results, collectionFilters, words) {
    const container = elements.sectionsContainer;
    if (!container) return;

    let html = '<div class="search-view-header">'
        + '<div class="search-view-title">'
        + '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> '
        + 'Search Results '
        + '<span class="search-view-count">' + results.length + ' link' + (results.length !== 1 ? 's' : '') + ' found</span>'
        + '</div></div>';

    html += '<div class="search-filters">';
    html += '<span style="font-size:11px;color:var(--color-text-muted);font-weight:500;">Filter:</span>';
    html += '<span class="search-filter-tag' + (_searchFilterCollection === 'all' ? ' active' : '') + '" onclick="searchSetFilter(\'all\')">All</span>';
    for (const [id, name] of collectionFilters) {
        html += '<span class="search-filter-tag' + (_searchFilterCollection === String(id) ? ' active' : '') + '" onclick="searchSetFilter(\'' + id + '\')">' + escapeHtml(name) + '</span>';
    }
    html += '<select class="search-filter-select" onchange="searchSetSort(this.value)" style="margin-left:auto">'
        + '<option value="relevance"' + (_searchSortBy === 'relevance' ? ' selected' : '') + '>Relevance</option>'
        + '<option value="name-asc"' + (_searchSortBy === 'name-asc' ? ' selected' : '') + '>Name A-Z</option>'
        + '<option value="name-desc"' + (_searchSortBy === 'name-desc' ? ' selected' : '') + '>Name Z-A</option>'
        + '<option value="collection"' + (_searchSortBy === 'collection' ? ' selected' : '') + '>Collection</option>'
        + '</select>';
    html += '</div>';

    if (results.length === 0) {
        html += '<div class="search-empty">'
            + '<div class="search-empty-icon">\uD83D\uDD0D</div>'
            + '<div class="search-empty-text">No links found for "' + escapeHtml(_searchQuery) + '"</div>'
            + '<div class="search-empty-hint">Try different search terms or remove filters</div>'
            + '</div>';
    } else {
        const openInNewTab = getOpenInNewTab();
        const target = openInNewTab ? ' target="_blank" rel="noopener"' : '';

        html += '<div class="search-results-grid">';
        for (const link of results.slice(0, 100)) {
            const initial = (link.title || '?')[0].toUpperCase();
            const faviconHtml = link.favicon
                ? '<img src="' + escapeHtml(link.favicon) + '" alt="" onerror="this.parentElement.textContent=\'' + escapeHtml(initial) + '\'">'
                : escapeHtml(initial);

            let domain = '';
            try { domain = new URL(link.url).hostname; } catch {}

            html += '<a class="search-card" href="' + escapeHtml(link.url) + '"' + target + '>'
                + '<div class="search-card-body"><div class="search-card-top">'
                + '<div class="search-card-favicon">' + faviconHtml + '</div>'
                + '<div class="search-card-content">'
                + '<div class="search-card-title">' + highlightSearchWords(link.title, words) + '</div>'
                + '<div class="search-card-url">' + escapeHtml(domain) + '</div>'
                + '</div></div></div>'
                + '<div class="search-card-footer"><div class="search-card-meta">'
                + '<span class="search-card-badge search-card-badge-collection">\uD83D\uDCC1 ' + escapeHtml(link.collectionName) + '</span>'
                + '<span class="search-card-badge search-card-badge-section">\uD83D\uDCD1 ' + escapeHtml(link.sectionName) + '</span>'
                + '</div>'
                + '<button class="search-card-action" onclick="event.preventDefault();event.stopPropagation();searchGoToCollection(' + link.collectionId + ')" title="Go to collection">'
                + '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                + '</button></div></a>';
        }
        html += '</div>';

        if (results.length > 100) {
            html += '<div style="text-align:center;padding:16px;color:var(--color-text-muted);font-size:12px;">'
                + results.length + ' results \u2014 showing first 100. Refine your search for better results.</div>';
        }
    }

    container.innerHTML = html;
}

function highlightSearchWords(text, words) {
    let escaped = escapeHtml(text);
    for (const w of words) {
        const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        escaped = escaped.replace(re, '<mark class="search-hl">$1</mark>');
    }
    return escaped;
}

function searchSetFilter(val) {
    _searchFilterCollection = val;
    performSearch();
}

function searchSetSort(val) {
    _searchSortBy = val;
    performSearch();
}

function searchGoToCollection(collectionId) {
    const input = document.getElementById('globalSearch');
    if (input) input.value = '';
    _isSearchView = false;
    _searchQuery = '';
    _searchFilterCollection = 'all';
    selectCollection(collectionId);
}

// ═══════════════════════════════════════════════════════════════
// Import – Browser Bookmarks & Linkwarden JSON
// ═══════════════════════════════════════════════════════════════

let _importSource = null;
let _importParsedData = null;

function openImportModal() {
    _importSource = null;
    _importParsedData = null;
    showImportSourceSelection();
    document.getElementById('importOverlay').classList.add('active');
}

function closeImportModal() {
    document.getElementById('importOverlay').classList.remove('active');
}

function showImportSourceSelection() {
    const body = document.getElementById('importModalBody');
    document.getElementById('importModalTitle').textContent = 'Import Links';
    body.innerHTML = `
        <div class="import-sources">
            <div class="import-source-card" onclick="selectImportSource('browser', this)">
                <div class="import-source-icon">\uD83C\uDF10</div>
                <div class="import-source-title">Browser Bookmarks</div>
                <div class="import-source-desc">HTML file from Chrome, Firefox, Edge or Safari</div>
            </div>
            <div class="import-source-card" onclick="selectImportSource('linkwarden', this)">
                <div class="import-source-icon">\uD83D\uDD17</div>
                <div class="import-source-title">Linkwarden</div>
                <div class="import-source-desc">JSON export from Linkwarden</div>
            </div>
        </div>
        <div class="import-actions">
            <button class="btn-secondary" onclick="closeImportModal()">Cancel</button>
        </div>
    `;
}

function selectImportSource(source, el) {
    _importSource = source;
    document.querySelectorAll('.import-source-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    setTimeout(() => showImportFileUpload(), 200);
}

function showImportFileUpload() {
    const body = document.getElementById('importModalBody');
    const accept = _importSource === 'browser' ? '.html,.htm' : '.json';
    const hint = _importSource === 'browser'
        ? 'Export your bookmarks as HTML from your browser (Chrome: Bookmark Manager \u2192 \u22EE \u2192 Export)'
        : 'Export your links as JSON from Linkwarden (Settings \u2192 Data \u2192 Export)';

    document.getElementById('importModalTitle').textContent =
        _importSource === 'browser' ? 'Import Browser Bookmarks' : 'Import from Linkwarden';

    body.innerHTML = `
        <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px;">${hint}</p>
        <div class="import-dropzone" id="importDropzone" onclick="document.getElementById('importFileInput').click()">
            <div class="import-dropzone-icon">\uD83D\uDCC2</div>
            <div class="import-dropzone-text">
                <strong>Click here</strong> or drag and drop your file
            </div>
            <input type="file" id="importFileInput" accept="${accept}">
        </div>
        <div id="importPreviewArea"></div>
        <div class="import-actions">
            <button class="btn-secondary" onclick="showImportSourceSelection()">Back</button>
            <button class="btn-primary" id="importStartBtn" disabled onclick="startImport()">Import</button>
        </div>
    `;

    const dropzone = document.getElementById('importDropzone');
    const fileInput = document.getElementById('importFileInput');

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleImportFile(e.target.files[0]);
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleImportFile(e.dataTransfer.files[0]);
    });
}

function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            if (_importSource === 'browser') {
                _importParsedData = parseBrowserBookmarks(e.target.result);
            } else {
                _importParsedData = parseLinkwardenExport(e.target.result);
            }
            showImportPreview();
        } catch (err) {
            alert('Could not read file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function parseBrowserBookmarks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const folders = [];

    function processNode(dl, folderName) {
        const links = [];
        if (!dl) return;
        const items = dl.children;
        for (let i = 0; i < items.length; i++) {
            const dt = items[i];
            if (dt.tagName !== 'DT') continue;
            const h3 = dt.querySelector(':scope > H3');
            const a = dt.querySelector(':scope > A');
            const subDl = dt.querySelector(':scope > DL');
            if (h3 && subDl) {
                processNode(subDl, h3.textContent.trim());
            } else if (a && a.href) {
                const url = a.getAttribute('HREF') || a.href;
                if (url && url.startsWith('http')) {
                    links.push({ title: a.textContent.trim() || url, url: url });
                }
            }
        }
        if (links.length > 0) folders.push({ name: folderName || 'Bookmarks', links: links });
    }

    const rootDl = doc.querySelector('DL');
    if (rootDl) {
        const items = rootDl.children;
        let rootLinks = [];
        for (let i = 0; i < items.length; i++) {
            const dt = items[i];
            if (dt.tagName !== 'DT') continue;
            const h3 = dt.querySelector(':scope > H3');
            const a = dt.querySelector(':scope > A');
            const subDl = dt.querySelector(':scope > DL');
            if (h3 && subDl) {
                processNode(subDl, h3.textContent.trim());
            } else if (a) {
                const url = a.getAttribute('HREF') || a.href;
                if (url && url.startsWith('http')) {
                    rootLinks.push({ title: a.textContent.trim() || url, url: url });
                }
            }
        }
        if (rootLinks.length > 0) folders.push({ name: 'Bookmarks', links: rootLinks });
    }

    if (folders.length === 0) throw new Error('No bookmarks found in this file');
    return { folders };
}

function parseLinkwardenExport(json) {
    const data = JSON.parse(json);
    const folders = [];

    if (Array.isArray(data)) {
        const byCollection = {};
        for (const item of data) {
            const colName = (item.collection && item.collection.name) || 'Linkwarden';
            if (!byCollection[colName]) byCollection[colName] = [];
            byCollection[colName].push({
                title: item.name || item.title || item.url || 'Untitled',
                url: item.url || item.link || '',
            });
        }
        for (const [name, links] of Object.entries(byCollection)) {
            if (links.length > 0) folders.push({ name, links });
        }
    } else if (data.collections && Array.isArray(data.collections)) {
        for (const col of data.collections) {
            const links = (col.links || []).map(l => ({
                title: l.name || l.title || l.url || 'Untitled',
                url: l.url || l.link || '',
            })).filter(l => l.url);
            if (links.length > 0) folders.push({ name: col.name || 'Linkwarden', links });
        }
    } else if (data.links && Array.isArray(data.links)) {
        const links = data.links.map(l => ({
            title: l.name || l.title || l.url || 'Untitled',
            url: l.url || l.link || '',
        })).filter(l => l.url);
        if (links.length > 0) folders.push({ name: 'Linkwarden', links });
    } else {
        throw new Error('Unknown Linkwarden export format');
    }

    if (folders.length === 0) throw new Error('No links found in this file');
    return { folders };
}

async function showImportPreview() {
    const area = document.getElementById('importPreviewArea');
    if (!_importParsedData || _importParsedData.folders.length === 0) {
        area.innerHTML = '<div class="import-preview">No data found</div>';
        return;
    }

    let totalLinks = 0;
    let html = '<div class="import-preview">';
    for (const folder of _importParsedData.folders) {
        html += '<div class="import-preview-folder">\uD83D\uDCC1 ' + escapeHtml(folder.name)
            + ' <span style="font-weight:400;color:var(--color-text-muted)">(' + folder.links.length + ' links)</span></div>';
        for (const link of folder.links.slice(0, 5)) {
            html += '<div class="import-preview-link">\uD83D\uDD17 ' + escapeHtml(link.title) + '</div>';
        }
        if (folder.links.length > 5) {
            html += '<div class="import-preview-link" style="opacity:0.5">\u2026 and ' + (folder.links.length - 5) + ' more</div>';
        }
        totalLinks += folder.links.length;
    }
    html += '</div>';
    html += '<div class="import-preview-count">'
        + _importParsedData.folders.length + ' folders, ' + totalLinks + ' links found</div>';

    html += `
        <div class="import-option">
            <label>Import as:</label>
            <select id="importMode">
                <option value="new-collection">Create new collection(s)</option>
                <option value="existing">Into existing collection</option>
            </select>
        </div>
        <div id="existingCollectionSelect" style="display:none">
            <div class="import-option">
                <label>Collection:</label>
                <select id="importTargetCollection"></select>
            </div>
        </div>
    `;

    area.innerHTML = html;
    document.getElementById('importStartBtn').disabled = false;

    document.getElementById('importMode').addEventListener('change', async function() {
        const div = document.getElementById('existingCollectionSelect');
        if (this.value === 'existing') {
            div.style.display = 'block';
            const sel = document.getElementById('importTargetCollection');
            if (sel.options.length <= 0) {
                try {
                    const cols = await apiRequest('/collections');
                    sel.innerHTML = cols.map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
                } catch {}
            }
        } else {
            div.style.display = 'none';
        }
    });
}

async function startImport() {
    if (!_importParsedData) return;

    const mode = document.getElementById('importMode').value;
    const body = document.getElementById('importModalBody');

    body.innerHTML = `
        <div class="import-progress active">
            <div class="import-progress-bar">
                <div class="import-progress-fill" id="importProgressFill"></div>
            </div>
            <div class="import-progress-text" id="importProgressText">Preparing...</div>
        </div>
    `;

    const fill = document.getElementById('importProgressFill');
    const text = document.getElementById('importProgressText');

    let importedLinks = 0;
    let failedLinks = 0;
    let totalLinks = _importParsedData.folders.reduce((s, f) => s + f.links.length, 0);
    let processed = 0;

    try {
        for (const folder of _importParsedData.folders) {
            let collectionId;

            if (mode === 'existing') {
                collectionId = parseInt(document.getElementById('importTargetCollection').value);
            } else {
                text.textContent = 'Creating collection: ' + folder.name + '...';
                try {
                    const col = await apiRequest('/collections', { method: 'POST', body: JSON.stringify({ name: folder.name }) });
                    collectionId = col.id;
                } catch {
                    failedLinks += folder.links.length;
                    continue;
                }
            }

            text.textContent = 'Creating section: ' + folder.name + '...';
            let section;
            try {
                section = await apiRequest('/collections/' + collectionId + '/sections', { method: 'POST', body: JSON.stringify({ name: folder.name }) });
            } catch {
                failedLinks += folder.links.length;
                continue;
            }

            for (const link of folder.links) {
                try {
                    await apiRequest('/sections/' + section.id + '/links', { method: 'POST', body: JSON.stringify({ title: link.title, url: link.url }) });
                    importedLinks++;
                } catch {
                    failedLinks++;
                }
                processed++;
                const pct = Math.round((processed / totalLinks) * 100);
                fill.style.width = pct + '%';
                text.textContent = processed + ' / ' + totalLinks + ' links processed...';
            }
        }

        invalidateSearchCache();

        const icon = failedLinks === 0 ? '\u2705' : '\u26A0\uFE0F';
        body.innerHTML = `
            <div class="import-result">
                <div class="import-result-icon">${icon}</div>
                <div class="import-result-text">${importedLinks} links imported</div>
                ${failedLinks > 0 ? '<div class="import-result-detail">' + failedLinks + ' links could not be imported</div>' : ''}
                <div style="margin-top: 16px">
                    <button class="btn-primary" onclick="closeImportModal(); loadCollections();">Close</button>
                </div>
            </div>
        `;
    } catch (err) {
        body.innerHTML = `
            <div class="import-result">
                <div class="import-result-icon">\u274C</div>
                <div class="import-result-text">Import failed</div>
                <div class="import-result-detail">${escapeHtml(err.message)}</div>
                <div style="margin-top: 16px">
                    <button class="btn-secondary" onclick="closeImportModal()">Close</button>
                </div>
            </div>
        `;
    }
}

// Close import modal on Escape
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('importOverlay');
    if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
        closeImportModal();
    }
});

// Close import modal on backdrop click
document.getElementById('importOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'importOverlay') closeImportModal();
});

// ═══════════════════════════════════════════════════════════════

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════════

elements.addCollectionBtn.addEventListener('click', showAddCollectionModal);
elements.editCollectionBtn.addEventListener('click', showEditCollectionModal);
elements.addSectionBtn.addEventListener('click', showAddSectionModal);
elements.modalClose.addEventListener('click', hideModal);
elements.modalBackdrop.addEventListener('click', hideModal);

// Settings button
document.getElementById('settingsBtn').addEventListener('click', showSettings);
elements.settingsBackBtn.addEventListener('click', () => {
    if (collections.length > 0) {
        selectCollection(collections[0].id);
    }
});

// Close modal on Escape key, search shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
        hideModal();
        return;
    }
    if (e.key === 'Escape' && currentView === 'search') {
        clearSearch();
        return;
    }
    if (e.key === '/' && !elements.modal.classList.contains('active')) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            elements.searchInput?.focus();
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// Service Worker
// ═══════════════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
}

// ═══════════════════════════════════════════════════════════════
// Initialize
// ═══════════════════════════════════════════════════════════════

(async function init() {
    const authenticated = await checkAuth();
    if (!authenticated) return;

    loadUserPreferences();
    loadCollections();
    initSearch();
})();
