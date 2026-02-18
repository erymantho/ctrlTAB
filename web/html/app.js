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
    // Cyberpunk has its own fixed accent color; restore or remove custom accent on theme switch
    if (theme === 'cyberpunk') {
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
    if (theme === 'cyberpunk') return;
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
    } catch {}
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
    applyTheme(theme);
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
const ACCENT_PRESETS = ['#e2003d', '#e8650a', '#d4a017', '#198754', '#0d6efd', '#6f42c1', '#d63384'];
initTheme();
_accentColor = localStorage.getItem('ctrltab-accent') || null;
applyAccentColor(_accentColor);

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

async function uploadIcon(file) {
    const formData = new FormData();
    formData.append('icon', file);
    const res = await fetch('/api/upload/icon', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
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
            </div>
            <div class="accent-color-section">
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
            </div>
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
        <div class="settings-footer">
            Built by Michael Smith, with ☕ and sudo privileges
            <div class="settings-version">v1.0.0</div>
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
    if (sections.length === 0) {
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📑</div>
                <p>No sections yet. Click "Add Section" to get started.</p>
            </div>
        `;
        return;
    }

    elements.sectionsContainer.innerHTML = sections
        .map(section => {
            const links = section.links || [];
            return `
            <div class="section" data-section-id="${section.id}">
                <div class="section-header">
                    <h3 class="section-title">${escapeHtml(section.name)}</h3>
                    <div class="section-actions">
                        ${links.length > 1 ? `
                        <button class="btn-icon btn-sort-alpha" onclick="sortSectionAlpha(${section.id})" title="Sort A-Z">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h7M2 8h5M2 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M11 3l2 2 2-2M13 5V13M11 11l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>` : ''}
                        <button class="btn-icon" onclick="showAddLinkModal(${section.id})" title="Add link">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="showEditSectionModal(${section.id}, '${escapeHtml(section.name)}')" title="Edit section">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        ${links.length > 0 ? `
                        <button class="btn-icon btn-edit-order" onclick="toggleSectionEdit(${section.id})" title="Edit order">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="6" cy="4" r="1.2" fill="currentColor"/>
                                <circle cx="10" cy="4" r="1.2" fill="currentColor"/>
                                <circle cx="6" cy="8" r="1.2" fill="currentColor"/>
                                <circle cx="10" cy="8" r="1.2" fill="currentColor"/>
                                <circle cx="6" cy="12" r="1.2" fill="currentColor"/>
                                <circle cx="10" cy="12" r="1.2" fill="currentColor"/>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
                <div class="links-grid" data-section-id="${section.id}">
                    ${renderLinks(links, section.id)}
                </div>
            </div>
        `;
        })
        .join('');
}

function getFaviconSrc(link) {
    if (link.favicon) return link.favicon;
    try {
        const parsed = new URL(link.url);
        const h = parsed.hostname;
        const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        const isLocal = h === 'localhost' || (m && (+m[1] === 10 || +m[1] === 127
            || (+m[1] === 172 && +m[2] >= 16 && +m[2] <= 31)
            || (+m[1] === 192 && +m[2] === 168)));
        if (isLocal) return `${parsed.origin}/favicon.ico`;
    } catch {}
    return null;
}

function renderLinks(links, sectionId) {
    if (links.length === 0) {
        return '<p style="color: var(--color-text-muted); font-size: 14px;">No links yet</p>';
    }

    const target = getOpenInNewTab() ? ' target="_blank"' : '';
    return links
        .map(link => {
            const faviconSrc = getFaviconSrc(link);
            return `
            <a href="${escapeHtml(link.url)}"${target} class="link-card" draggable="false" data-link-id="${link.id}">
                <div class="link-favicon">
                    ${faviconSrc ? `<img src="${escapeHtml(faviconSrc)}" alt="" onerror="this.style.display='none'">` : ''}
                </div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                </div>
                <div class="link-actions" onclick="event.preventDefault(); event.stopPropagation();">
                    <button class="btn-icon" onclick="showEditLinkModal(${link.id}, ${link.section_id}, '${escapeHtml(link.title)}', '${escapeHtml(link.url)}', '${escapeHtml(link.favicon || '')}')" title="Edit link">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </a>
        `;
        })
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// Drag-and-Drop Link Reordering
// ═══════════════════════════════════════════════════════════════

function toggleSectionEdit(sectionId) {
    const sectionEl = document.querySelector(`.section[data-section-id="${sectionId}"]`);
    if (!sectionEl) return;
    const isEditing = sectionEl.classList.toggle('section--editing');
    sectionEl.querySelectorAll('.link-card[data-link-id]').forEach(card => {
        card.draggable = isEditing;
    });
    const btn = sectionEl.querySelector('.btn-edit-order');
    if (btn) {
        btn.classList.toggle('active', isEditing);
        btn.title = isEditing ? 'Done' : 'Edit order';
    }
}

let _draggingCard = null;

function initDragAndDrop() {
    _draggingCard = null;

    document.querySelectorAll('.links-grid').forEach(grid => {
        grid.addEventListener('dragstart', e => {
            const card = e.target.closest('.link-card[data-link-id]');
            if (!card) return;
            _draggingCard = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        grid.addEventListener('dragover', e => {
            e.preventDefault();
            if (!_draggingCard) return;
            const after = getDragAfterElement(grid, e.clientX, e.clientY);
            if (after) grid.insertBefore(_draggingCard, after);
            else grid.appendChild(_draggingCard);
        });

        grid.addEventListener('dragend', async () => {
            if (!_draggingCard) return;
            _draggingCard.classList.remove('dragging');
            const sectionId = parseInt(grid.dataset.sectionId);
            const orderedIds = [...grid.querySelectorAll('.link-card[data-link-id]')]
                .map(el => parseInt(el.dataset.linkId));
            _draggingCard = null;
            await reorderLinks(sectionId, orderedIds);
        });
    });
}

function getDragAfterElement(grid, x, y) {
    const cards = [...grid.querySelectorAll('.link-card:not(.dragging)')];
    return cards.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offsetY = y - box.top - box.height / 2;
        if (offsetY < 0 && offsetY > closest.offset) return { offset: offsetY, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
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
    } catch {
        alert('Failed to upload icon');
    }
    input.value = '';
}

function removeIcon() {
    document.getElementById('faviconHiddenInput').value = '';
    const wrap = document.getElementById('faviconPreviewBox');
    wrap.innerHTML = `<span id="faviconPreviewImg" class="icon-preview-placeholder">${_faviconPlaceholderSvg}</span>`;
    document.getElementById('faviconRemoveBtn').style.display = 'none';
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

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
        hideModal();
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
})();
