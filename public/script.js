// Simple Second Brain Frontend
class SecondBrainApp {
    constructor() {
        this.currentTab = 'summary';
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadContent();
    }

    bindEvents() {
        // Tab switching
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                this.updateThemeIcon(isDark);
            });
        }
    }

    async loadContent() {
        try {
            // Load logs for history tab
            const logsResponse = await fetch('/api/logs');
            const logs = await logsResponse.json();
            this.renderLogs(logs);

            // Load notes for summary tab  
            const notesResponse = await fetch('/api/notes');
            const notes = await notesResponse.json();
            this.renderNotes(notes);

            // Load research reports for research tab
            const researchResponse = await fetch('/api/reports');
            const research = await researchResponse.json();
            this.renderResearch(research);

            // Update loading states
            document.getElementById('summary-loading').style.display = 'none';
            document.getElementById('history-loading').style.display = 'none';
            document.getElementById('research-loading').style.display = 'none';
            
            if (notes.length === 0) {
                document.getElementById('summary-list').innerHTML = '<div class="empty-state">No summaries available</div>';
            }
            if (logs.length === 0) {
                document.getElementById('history-list').innerHTML = '<div class="empty-state">No history available</div>';
            }
            if (research.length === 0) {
                document.getElementById('research-list').innerHTML = '<div class="empty-state">No research reports available</div>';
            }
        } catch (error) {
            console.error('Error loading content:', error);
            document.getElementById('summary-loading').textContent = 'Error loading summaries';
            document.getElementById('history-loading').textContent = 'Error loading history';
            document.getElementById('research-loading').textContent = 'Error loading research reports';
        }
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show correct content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');

        this.currentTab = tabName;
    }

    renderLogs(logs) {
        const container = document.getElementById('history-list');
        container.innerHTML = '';
        
        // Sort logs by date (newest first)
        logs.sort((a, b) => new Date(b.id) - new Date(a.id));
        
        logs.forEach(log => {
            const logElement = this.createLogCard(log);
            container.appendChild(logElement);
        });
    }

    renderNotes(notes) {
        const container = document.getElementById('summary-list');
        container.innerHTML = '';
        
        notes.forEach(note => {
            const noteElement = this.createNoteCard(note);
            container.appendChild(noteElement);
        });
    }

    createLogCard(log) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${log.id}</h3>
            </div>
            <div class="card-content">
                <p>${this.extractSummary(log.content)}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.showModal('Log Details', log.content);
        });
        
        return card;
    }

    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'content-card';
        const title = this.extractTitle(note.content) || note.id;
        const summary = this.extractSummary(note.content);
        const tags = this.extractTags(note.content);
        
        let tagsHtml = '';
        if (tags.length > 0) {
            tagsHtml = '<div class="tags">' + 
                tags.map(tag => `<span class="tag">#${tag}</span>`).join('') + 
                '</div>';
        }
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${title}</h3>
            </div>
            <div class="card-content">
                <p>${summary}</p>
                ${tagsHtml}
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.showModal(title, note.content);
        });
        
        return card;
    }

    extractTitle(content) {
        const match = content.match(/title:\s*["']?([^"'\n]+)/i);
        return match ? match[1] : null;
    }

    extractSummary(content) {
        const match = content.match(/summary:\s*["']?([^"'\n]+)/i);
        if (match) return match[1];
        
        // Fallback to first few lines of content
        const lines = content.split('\n').filter(line => line.trim() !== '');
        for (let line of lines) {
            if (line.startsWith('#') || line.trim().length > 20) {
                return line.replace(/^#+\s*/, '').substring(0, 150) + '...';
            }
        }
        return 'No summary available';
    }

    extractTags(content) {
        const match = content.match(/tags:\s*\[([^\]]+)\]/i);
        if (match) {
            return match[1].split(',').map(tag => tag.trim().replace(/["']/g, ''));
        }
        return [];
    }

    showModal(title, content) {
        // Create modal container if it doesn't exist
        let modal = document.getElementById('detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'detail-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        // Parse markdown-like content for display
        const formattedContent = this.formatContentForDisplay(content);
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <pre>${formattedContent}</pre>
                </div>
            </div>
        `;
        
        // Close modal functionality
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        modal.style.display = 'block';
    }

    formatContentForDisplay(content) {
        // Remove frontmatter
        const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
        return contentWithoutFrontmatter.trim();
    }

    updateThemeIcon(isDark) {
        const icon = document.querySelector('.theme-toggle-icon');
        if (icon) {
            icon.textContent = isDark ? '🌙' : '☀️';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecondBrainApp();
});