// Simple Knowledge Graph Visualization - Reliable and Lightweight
class SimpleKnowledgeGraph {
    constructor() {
        this.container = document.getElementById('knowledge-graph');
        this.data = null;
        this.svg = null;
        this.width = 800;
        this.height = 500;
        this.nodeRadius = 40;
        this.margin = 50;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupContainer();
        this.renderGraph();
        this.addEventListeners();
    }

    async loadData() {
        try {
            const response = await fetch('/api/knowledge-graph');
            this.data = await response.json();
            console.log('Simple Knowledge Graph data loaded:', this.data);
        } catch (error) {
            console.error('Error loading knowledge graph data:', error);
            this.data = { nodes: [], edges: [] };
        }
    }

    setupContainer() {
        if (!this.container) {
            console.error('Knowledge graph container not found');
            return;
        }
        
        this.container.innerHTML = '<div class="graph-loading">Loading knowledge connections...</div>';
        this.container.style.position = 'relative';
        this.container.style.height = '500px';
        this.container.style.width = '100%';
        this.container.style.borderRadius = '12px';
        this.container.style.overflow = 'hidden';
        this.container.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
        this.container.style.border = '1px solid #e2e8f0';
    }

    renderGraph() {
        if (!this.container || !this.data || this.data.nodes.length === 0) {
            this.container.innerHTML = '<div class="graph-empty">No knowledge connections yet</div>';
            return;
        }

        // Clear container
        this.container.innerHTML = '';

        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.style.backgroundColor = 'transparent';
        this.container.appendChild(this.svg);

        // Calculate node positions in a circular layout
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(centerX, centerY) - this.nodeRadius - this.margin;
        
        // Position nodes in a circle
        this.data.nodes.forEach((node, index) => {
            const angle = (index / this.data.nodes.length) * 2 * Math.PI;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });

        // Draw edges first (so they appear behind nodes)
        this.data.edges.forEach(edge => {
            const sourceNode = this.data.nodes.find(n => n.id === edge.source);
            const targetNode = this.data.nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', sourceNode.x);
                line.setAttribute('y1', sourceNode.y);
                line.setAttribute('x2', targetNode.x);
                line.setAttribute('y2', targetNode.y);
                line.setAttribute('stroke', '#94a3b8');
                line.setAttribute('stroke-width', Math.max(1, edge.weight * 2));
                line.setAttribute('stroke-opacity', '0.6');
                this.svg.appendChild(line);
            }
        });

        // Draw nodes
        this.data.nodes.forEach(node => {
            // Node circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', this.nodeRadius);
            circle.setAttribute('fill', this.getNodeColor(node.type));
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            circle.style.cursor = 'pointer';
            circle.style.transition = 'all 0.3s ease';
            
            // Node label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#1e293b');
            text.setAttribute('font-size', '12px');
            text.setAttribute('font-weight', '600');
            text.setAttribute('font-family', 'sans-serif');
            text.textContent = this.truncateLabel(node.label, 12);
            text.style.cursor = 'pointer';
            text.style.transition = 'all 0.3s ease';

            // Add hover effects
            const handleMouseEnter = () => {
                circle.setAttribute('r', this.nodeRadius + 5);
                circle.setAttribute('stroke', '#4f46e5');
                circle.setAttribute('stroke-width', '3');
            };
            
            const handleMouseLeave = () => {
                circle.setAttribute('r', this.nodeRadius);
                circle.setAttribute('stroke', '#fff');
                circle.setAttribute('stroke-width', '2');
            };

            circle.addEventListener('mouseenter', handleMouseEnter);
            circle.addEventListener('mouseleave', handleMouseLeave);
            text.addEventListener('mouseenter', handleMouseEnter);
            text.addEventListener('mouseleave', handleMouseLeave);

            // Add click handler
            circle.addEventListener('click', (e) => this.handleNodeClick(e, node));
            text.addEventListener('click', (e) => this.handleNodeClick(e, node));

            this.svg.appendChild(circle);
            this.svg.appendChild(text);
        });

        // Add legend
        this.addLegend();
    }

    getNodeColor(type) {
        const colors = {
            'system': '#4f46e5',
            'culture': '#7c3aed', 
            'entertainment': '#0ea5e9',
            'ai': '#10b981',
            'topic': '#f59e0b',
            'default': '#64748b'
        };
        return colors[type] || colors.default;
    }

    truncateLabel(label, maxLength) {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength - 3) + '...';
    }

    addLegend() {
        const legendItems = [
            { type: 'system', label: 'System' },
            { type: 'culture', label: 'Culture' },
            { type: 'entertainment', label: 'Entertainment' },
            { type: 'ai', label: 'AI/Tech' }
        ];

        const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legendGroup.setAttribute('transform', `translate(${this.width - 150}, 30)`);

        legendItems.forEach((item, index) => {
            const y = index * 25;
            
            // Color circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', 0);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 6);
            circle.setAttribute('fill', this.getNodeColor(item.type));
            
            // Label text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', 15);
            text.setAttribute('y', y + 4);
            text.setAttribute('fill', '#1e293b');
            text.setAttribute('font-size', '12px');
            text.setAttribute('font-family', 'sans-serif');
            text.textContent = item.label;

            legendGroup.appendChild(circle);
            legendGroup.appendChild(text);
        });

        this.svg.appendChild(legendGroup);
    }

    async handleNodeClick(event, node) {
        event.stopPropagation();
        console.log('Node clicked:', node);
        
        try {
            // Show tooltip with node info
            this.showNodeTooltip(node, event);
            
            // In the future, we can implement note filtering by tag
            // For now, just log the action
        } catch (error) {
            console.error('Error handling node click:', error);
        }
    }

    showNodeTooltip(node, event) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.graph-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'graph-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.95);
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid #e2e8f0;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
            max-width: 200px;
        `;
        
        tooltip.innerHTML = `
            <strong>${node.label}</strong><br>
            Type: ${node.type}<br>
            Weight: ${node.weight}
        `;
        
        // Position tooltip near mouse
        const rect = this.container.getBoundingClientRect();
        tooltip.style.left = (event.clientX + 10) + 'px';
        tooltip.style.top = (event.clientY - 10) + 'px';
        
        document.body.appendChild(tooltip);
        
        // Remove tooltip after delay
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 3000);
    }

    addEventListeners() {
        // Remove tooltip on container click
        this.container.addEventListener('click', () => {
            const tooltip = document.querySelector('.graph-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if knowledge graph container exists
    if (document.getElementById('knowledge-graph')) {
        new SimpleKnowledgeGraph();
    }
});