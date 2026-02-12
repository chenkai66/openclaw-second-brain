// Enhanced Knowledge Graph Visualization
class KnowledgeGraph {
    constructor() {
        this.container = document.getElementById('knowledge-graph');
        this.data = null;
        this.simulation = null;
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.nodes = [];
        this.links = [];
        this.nodeElements = null;
        this.linkElements = null;
        this.tooltip = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupContainer();
        this.createSVG();
        this.createTooltip();
        this.renderGraph();
        this.addEventListeners();
    }

    async loadData() {
        try {
            const response = await fetch('/api/knowledge-graph');
            this.data = await response.json();
            console.log('Knowledge graph data loaded:', this.data);
        } catch (error) {
            console.error('Error loading knowledge graph data:', error);
            this.data = { nodes: [], edges: [] };
        }
    }

    setupContainer() {
        this.container.style.position = 'relative';
        this.container.style.height = '500px';
        this.container.style.width = '100%';
        this.container.style.borderRadius = '12px';
        this.container.style.overflow = 'hidden';
        this.container.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
        
        // Add loading indicator
        this.container.innerHTML = '<div class="graph-loading">Loading knowledge connections...</div>';
    }

    createSVG() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', [0, 0, this.width, this.height])
            .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');
    }

    createTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'graph-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(255, 255, 255, 0.95)')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
            .style('border', '1px solid #e2e8f0')
            .style('font-size', '14px')
            .style('pointer-events', 'none')
            .style('opacity', 0);
    }

    prepareGraphData() {
        if (!this.data || !this.data.nodes || !this.data.edges) {
            this.nodes = [];
            this.links = [];
            return;
        }

        // Create node map for quick lookup
        const nodeMap = new Map();
        this.data.nodes.forEach((node, index) => {
            nodeMap.set(node.id, index);
            this.nodes.push({
                id: node.id,
                label: node.label,
                type: node.type || 'topic',
                weight: node.weight || 1,
                x: Math.random() * this.width,
                y: Math.random() * this.height
            });
        });

        // Create links
        this.links = this.data.edges.map(edge => ({
            source: nodeMap.get(edge.source),
            target: nodeMap.get(edge.target),
            weight: edge.weight || 1,
            relationship: edge.relationship || 'related'
        })).filter(link => link.source !== undefined && link.target !== undefined);
    }

    renderGraph() {
        // Clear container
        this.container.innerHTML = '';
        this.createSVG();

        if (!this.data || this.data.nodes.length === 0) {
            this.container.innerHTML = '<div class="graph-empty">No knowledge connections yet</div>';
            return;
        }

        this.prepareGraphData();

        // Create force simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => 20 + d.weight * 5));

        // Create links
        this.linkElements = this.svg.append('g')
            .attr('stroke', '#94a3b8')
            .attr('stroke-opacity', 0.6)
            .selectAll('line')
            .data(this.links)
            .join('line')
            .attr('stroke-width', d => Math.max(1, d.weight * 2));

        // Create nodes
        this.nodeElements = this.svg.append('g')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .selectAll('circle')
            .data(this.nodes)
            .join('circle')
            .attr('r', d => 15 + d.weight * 3)
            .attr('fill', d => this.getNodeColor(d.type))
            .call(this.dragSimulation());

        // Add labels
        const labels = this.svg.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 12)
            .selectAll('text')
            .data(this.nodes)
            .join('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', '#1e293b')
            .attr('font-weight', '600')
            .text(d => d.label);

        // Update positions on tick
        this.simulation.on('tick', () => {
            this.linkElements
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            this.nodeElements
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        // Add click handlers
        this.nodeElements.on('click', (event, d) => this.handleNodeClick(event, d));
        labels.on('click', (event, d) => this.handleNodeClick(event, d));
    }

    getNodeColor(type) {
        const colors = {
            'topic': '#4f46e5',
            'project': '#7c3aed',
            'concept': '#0ea5e9',
            'person': '#10b981',
            'tool': '#f59e0b',
            'default': '#64748b'
        };
        return colors[type] || colors.default;
    }

    dragSimulation() {
        const dragstarted = (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        };

        const dragged = (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
        };

        const dragended = (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        };

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    handleNodeClick(event, node) {
        event.stopPropagation();
        console.log('Node clicked:', node);
        
        // Show articles related to this tag/node
        this.showRelatedArticles(node);
    }

    async showRelatedArticles(node) {
        try {
            // Get articles that contain this tag
            const response = await fetch(`/api/notes-by-tag/${encodeURIComponent(node.id)}`);
            const articles = await response.json();
            
            if (articles.length === 0) {
                this.showTooltip(`No articles found for tag: ${node.label}`, event);
                return;
            }

            // Create a modal or overlay to show the articles
            this.displayArticleList(node, articles);
        } catch (error) {
            console.error('Error fetching related articles:', error);
            this.showTooltip(`Error loading articles for: ${node.label}`, event);
        }
    }

    displayArticleList(node, articles) {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.className = 'article-overlay';
        overlay.innerHTML = `
            <div class="article-overlay-content">
                <div class="overlay-header">
                    <h3>Articles tagged with "${node.label}"</h3>
                    <button class="close-overlay">&times;</button>
                </div>
                <div class="articles-list">
                    ${articles.map(article => `
                        <div class="article-item" data-id="${article.id}">
                            <h4>${article.title}</h4>
                            <p>${article.summary}</p>
                            <div class="article-tags">
                                ${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close functionality
        overlay.querySelector('.close-overlay').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Click on article items
        overlay.querySelectorAll('.article-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const articleId = e.currentTarget.dataset.id;
                this.showArticleDetail(articleId);
            });
        });
    }

    async showArticleDetail(articleId) {
        try {
            const response = await fetch(`/api/notes/${articleId}`);
            const article = await response.json();
            
            // Use existing modal system or create new one
            const modal = document.getElementById('detail-modal') || document.createElement('div');
            modal.id = 'detail-modal';
            modal.className = 'modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${article.title}</h2>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        <pre>${article.content}</pre>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close functionality
            modal.querySelector('.close-button').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading article detail:', error);
        }
    }

    showTooltip(content, event) {
        this.tooltip
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(content);
    }

    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }

    addEventListeners() {
        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Hide tooltip on mouseout
        this.container.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    handleResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        if (this.svg) {
            this.svg.attr('width', this.width).attr('height', this.height);
            this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
            this.simulation.alpha(1).restart();
        }
    }
}

// Initialize knowledge graph when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if D3 is available, if not load it
    if (typeof d3 === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://d3js.org/d3.v7.min.js';
        script.onload = () => {
            new KnowledgeGraph();
        };
        document.head.appendChild(script);
    } else {
        new KnowledgeGraph();
    }
});