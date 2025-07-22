// LinkTree Clone - JavaScript
class LinkTreeApp {
    constructor() {
        this.data = {
            profile: {
                name: 'Seu Nome',
                bio: 'Sua biografia aqui',
                image: 'https://via.placeholder.com/120/4f46e5/ffffff?text=👤'
            },
            links: [],
            theme: 'default'
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderProfile();
        this.renderLinks();
        this.applyTheme();
    }

    // Event Listeners
    bindEvents() {
        // Admin modal
        document.getElementById('adminBtn').addEventListener('click', () => this.openAdminModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeAdminModal());
        document.getElementById('saveChanges').addEventListener('click', () => this.saveChanges());

        // Profile editing
        document.getElementById('editProfileBtn').addEventListener('click', () => this.openAdminModal());

        // Link management
        document.getElementById('addLinkBtn').addEventListener('click', () => this.addLink());
        document.getElementById('linkTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addLink();
        });
        document.getElementById('linkUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addLink();
        });

        // Theme selection
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTheme(e.target.closest('.theme-btn')));
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // Modal click outside to close
        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target.id === 'adminModal') {
                this.closeAdminModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAdminModal();
            }
        });
    }

    // Data Management
    loadData() {
        const savedData = localStorage.getItem('linktree-data');
        if (savedData) {
            try {
                this.data = { ...this.data, ...JSON.parse(savedData) };
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem('linktree-data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.showNotification('Erro ao salvar dados', 'error');
        }
    }

    // Profile Management
    renderProfile() {
        document.getElementById('profileName').textContent = this.data.profile.name;
        document.getElementById('profileBio').textContent = this.data.profile.bio;
        document.getElementById('profileImg').src = this.data.profile.image;

        // Update form inputs
        document.getElementById('nameInput').value = this.data.profile.name;
        document.getElementById('bioInput').value = this.data.profile.bio;
        document.getElementById('imageInput').value = this.data.profile.image;
    }

    updateProfile() {
        this.data.profile.name = document.getElementById('nameInput').value || 'Seu Nome';
        this.data.profile.bio = document.getElementById('bioInput').value || 'Sua biografia aqui';
        this.data.profile.image = document.getElementById('imageInput').value || 'https://via.placeholder.com/120/4f46e5/ffffff?text=👤';
        
        this.renderProfile();
    }

    // Links Management
    renderLinks() {
        const container = document.getElementById('linksContainer');
        const emptyState = document.getElementById('emptyState');
        const linksList = document.getElementById('linksList');

        // Clear containers
        container.innerHTML = '';
        linksList.innerHTML = '';

        if (this.data.links.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Render public links
        this.data.links.forEach((link, index) => {
            const linkElement = this.createLinkElement(link, index);
            container.appendChild(linkElement);

            const editElement = this.createEditLinkElement(link, index);
            linksList.appendChild(editElement);
        });
    }

    createLinkElement(link, index) {
        const linkEl = document.createElement('a');
        linkEl.className = 'link-item';
        linkEl.href = link.url;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';

        linkEl.innerHTML = `
            <div class="link-icon">
                <i class="${this.getLinkIcon(link.url)}"></i>
            </div>
            <div class="link-content">
                <div class="link-title">${this.escapeHtml(link.title)}</div>
                <div class="link-url">${this.formatUrl(link.url)}</div>
            </div>
            <div class="link-arrow">
                <i class="fas fa-arrow-right"></i>
            </div>
        `;

        return linkEl;
    }

    createEditLinkElement(link, index) {
        const editEl = document.createElement('div');
        editEl.className = 'link-edit-item';
        editEl.draggable = true;

        editEl.innerHTML = `
            <div class="drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <input type="text" value="${this.escapeHtml(link.title)}" placeholder="Título" data-field="title" data-index="${index}">
            <input type="url" value="${this.escapeHtml(link.url)}" placeholder="URL" data-field="url" data-index="${index}">
            <button class="btn btn-danger" onclick="app.removeLink(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Add event listeners for editing
        const inputs = editEl.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => this.updateLink(e));
            input.addEventListener('blur', () => this.saveData());
        });

        // Add drag and drop functionality
        this.addDragAndDrop(editEl, index);

        return editEl;
    }

    addLink() {
        const title = document.getElementById('linkTitle').value.trim();
        const url = document.getElementById('linkUrl').value.trim();

        if (!title || !url) {
            this.showNotification('Por favor, preencha título e URL', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showNotification('Por favor, insira uma URL válida', 'error');
            return;
        }

        this.data.links.push({ title, url });
        
        // Clear inputs
        document.getElementById('linkTitle').value = '';
        document.getElementById('linkUrl').value = '';

        this.renderLinks();
        this.saveData();
        this.showNotification('Link adicionado com sucesso!', 'success');
    }

    updateLink(event) {
        const index = parseInt(event.target.dataset.index);
        const field = event.target.dataset.field;
        const value = event.target.value;

        if (this.data.links[index]) {
            this.data.links[index][field] = value;
            this.renderLinks();
        }
    }

    removeLink(index) {
        if (confirm('Tem certeza que deseja remover este link?')) {
            this.data.links.splice(index, 1);
            this.renderLinks();
            this.saveData();
            this.showNotification('Link removido com sucesso!', 'success');
        }
    }

    // Drag and Drop
    addDragAndDrop(element, index) {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            element.style.opacity = '0.5';
        });

        element.addEventListener('dragend', () => {
            element.style.opacity = '1';
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const targetIndex = index;

            if (draggedIndex !== targetIndex) {
                this.reorderLinks(draggedIndex, targetIndex);
            }
        });
    }

    reorderLinks(fromIndex, toIndex) {
        const item = this.data.links.splice(fromIndex, 1)[0];
        this.data.links.splice(toIndex, 0, item);
        this.renderLinks();
        this.saveData();
    }

    // Theme Management
    selectTheme(button) {
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const theme = button.dataset.theme;
        this.data.theme = theme;
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.data.theme);
        
        // Update active theme button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.data.theme);
        });
    }

    // Modal Management
    openAdminModal() {
        document.getElementById('adminModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.renderLinks(); // Refresh the edit links list
    }

    closeAdminModal() {
        document.getElementById('adminModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    saveChanges() {
        this.updateProfile();
        this.saveData();
        this.showNotification('Alterações salvas com sucesso!', 'success');
        this.closeAdminModal();
    }

    // Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `linktree-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Dados exportados com sucesso!', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (this.validateImportData(importedData)) {
                    this.data = { ...this.data, ...importedData };
                    this.saveData();
                    this.renderProfile();
                    this.renderLinks();
                    this.applyTheme();
                    this.showNotification('Dados importados com sucesso!', 'success');
                } else {
                    this.showNotification('Arquivo de backup inválido', 'error');
                }
            } catch (error) {
                this.showNotification('Erro ao importar dados', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    validateImportData(data) {
        return data && 
               typeof data === 'object' &&
               data.profile &&
               Array.isArray(data.links);
    }

    // Utility Functions
    getLinkIcon(url) {
        const domain = this.getDomain(url);
        const iconMap = {
            'instagram.com': 'fab fa-instagram',
            'facebook.com': 'fab fa-facebook',
            'twitter.com': 'fab fa-twitter',
            'x.com': 'fab fa-x-twitter',
            'linkedin.com': 'fab fa-linkedin',
            'youtube.com': 'fab fa-youtube',
            'tiktok.com': 'fab fa-tiktok',
            'github.com': 'fab fa-github',
            'spotify.com': 'fab fa-spotify',
            'apple.com': 'fab fa-apple',
            'whatsapp.com': 'fab fa-whatsapp',
            'telegram.org': 'fab fa-telegram',
            'discord.com': 'fab fa-discord',
            'twitch.tv': 'fab fa-twitch',
            'pinterest.com': 'fab fa-pinterest',
            'snapchat.com': 'fab fa-snapchat',
            'reddit.com': 'fab fa-reddit',
            'medium.com': 'fab fa-medium',
            'behance.net': 'fab fa-behance',
            'dribbble.com': 'fab fa-dribbble'
        };

        return iconMap[domain] || 'fas fa-link';
    }

    getDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return '';
        }
    }

    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LinkTreeApp();
});

// Add some sample data for demonstration
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.app && window.app.data.links.length === 0) {
            // Add sample links if no data exists
            window.app.data.links = [
                {
                    title: 'Meu Instagram',
                    url: 'https://instagram.com/seuusuario'
                },
                {
                    title: 'Canal do YouTube',
                    url: 'https://youtube.com/seucanal'
                },
                {
                    title: 'Meu Site',
                    url: 'https://seusite.com'
                },
                {
                    title: 'LinkedIn',
                    url: 'https://linkedin.com/in/seuusuario'
                }
            ];
            window.app.renderLinks();
        }
    }, 100);
});

