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
    // Update active state in settings view
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.themeValue === theme);
    });
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

// Apply theme immediately to prevent flash
initTheme();

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

// ═══════════════════════════════════════════════════════════════
// UI Functions
// ═══════════════════════════════════════════════════════════════

let loadingTimer = null;

function showLoading() {
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

        // Auto-select first collection if available
        if (collections.length > 0 && !currentCollectionId) {
            selectCollection(collections[0].id);
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

async function selectCollection(id) {
    currentView = 'collections';
    currentCollectionId = id;
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
        .map(section => `
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title">${escapeHtml(section.name)}</h3>
                    <div class="section-actions">
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
                    </div>
                </div>
                <div class="links-grid">
                    ${renderLinks(section.links || [])}
                </div>
            </div>
        `)
        .join('');
}

function renderLinks(links) {
    if (links.length === 0) {
        return '<p style="color: var(--color-text-muted); font-size: 14px;">No links yet</p>';
    }

    const target = getOpenInNewTab() ? ' target="_blank"' : '';
    return links
        .map(link => `
            <a href="${escapeHtml(link.url)}"${target} class="link-card">
                <div class="link-favicon">
                    ${link.favicon ? `<img src="${escapeHtml(link.favicon)}" alt="" onerror="this.style.display='none'">` : ''}
                </div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                </div>
                <div class="link-actions" onclick="event.preventDefault(); event.stopPropagation();">
                    <button class="btn-icon" onclick="showEditLinkModal(${link.id}, ${link.section_id}, '${escapeHtml(link.title)}', '${escapeHtml(link.url)}')" title="Edit link">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </a>
        `)
        .join('');
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

    try {
        showLoading();
        await createLink(sectionId, { title, url });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert('Failed to create link');
    } finally {
        hideLoading();
    }
}

function showEditLinkModal(linkId, sectionId, currentTitle, currentUrl) {
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

    try {
        showLoading();
        await updateLink(linkId, { title, url });
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

    loadCollections();
})();
