// ═══════════════════════════════════════════════════════════════
// CtrlTab - Application Logic
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
    // Update active state in dropdown
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeValue === theme);
    });
}

function setTheme(theme) {
    localStorage.setItem('ctrltab-theme', theme);
    applyTheme(theme);
    // Close dropdown
    document.getElementById('settingsDropdown').classList.remove('open');
}

// Apply theme immediately to prevent flash
initTheme();

const API_BASE = '/api';

// State
let currentCollectionId = null;
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
};

// ═══════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

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

function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
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
                    class="${currentCollectionId === collection.id ? 'active' : ''}"
                >
                    ${escapeHtml(collection.name)}
                </button>
            </li>
        `)
        .join('');
}

async function selectCollection(id) {
    currentCollectionId = id;
    renderCollections();
    await loadDashboard(id);

    // Show collection action buttons
    elements.editCollectionBtn.style.display = 'inline-flex';
    elements.addSectionBtn.style.display = 'inline-flex';
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

    return links
        .map(link => `
            <a href="${escapeHtml(link.url)}" target="_blank" class="link-card">
                <div class="link-favicon">
                    ${link.favicon ? `<img src="${escapeHtml(link.favicon)}" alt="" onerror="this.style.display='none'">` : ''}
                </div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                    <div class="link-url">${extractDomain(link.url)}</div>
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
        elements.collectionTitle.textContent = 'Select a collection';
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌘</div>
                <p>Select a collection to view your links</p>
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
// Utility Functions
// ═══════════════════════════════════════════════════════════════

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

// ═══════════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════════

elements.addCollectionBtn.addEventListener('click', showAddCollectionModal);
elements.editCollectionBtn.addEventListener('click', showEditCollectionModal);
elements.addSectionBtn.addEventListener('click', showAddSectionModal);
elements.modalClose.addEventListener('click', hideModal);
elements.modalBackdrop.addEventListener('click', hideModal);

// Settings dropdown toggle
document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsDropdown').classList.toggle('open');
});

// Close settings dropdown when clicking outside
document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.settings-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById('settingsDropdown').classList.remove('open');
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
        hideModal();
    }
    if (e.key === 'Escape') {
        document.getElementById('settingsDropdown').classList.remove('open');
    }
});

// ═══════════════════════════════════════════════════════════════
// Initialize
// ═══════════════════════════════════════════════════════════════

loadCollections();
