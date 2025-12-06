/**
 * TooltipManager - Centralized tooltip system
 * Single tooltip instance shared across all components
 */
class TooltipManager {
    constructor() {
        this.isVisible = false;
        this.createTooltip();
    }

    /**
     * Create the tooltip DOM element (only once)
     */
    createTooltip() {
    console.log('Creating tooltip...');

        d3.select('.global-tooltip').remove();

        const body = d3.select("body");
        if (body.empty()) {
            console.error('Body element not found!');
            return;
        }

        this.tooltip = body
            .append("div")
            .attr("class", "global-tooltip")
            .style("position", "absolute")
            .style("padding", "10px 12px")
            .style("background", "rgba(0, 0, 0, 0.85)")
            .style("color", "white")
            .style("border-radius", "6px")
            .style("pointer-events", "none")
            .style("font-size", "13px")
            .style("line-height", "1.4")
            .style("opacity", "0")
            .style("z-index", "10000")
            .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.3)")
            .style("max-width", "300px");
        
        console.log('Tooltip created:', this.tooltip, 'node:', this.tooltip.node());
    }

    /**
     * Show tooltip with data
     * @param {Object} data - Data to display { title, items: [{label, value}], footer }
     * @param {number} x - X position (pageX)
     * @param {number} y - Y position (pageY)
     */
    show(data, x, y) {
        if (!this.tooltip) {
            console.error('Tooltip element not created!');
            return;
        }
        
        let html = '';

        // Title (bold)
        if (data.title) {
            html += `<div style="font-weight: bold; margin-bottom: 6px;">${data.title}</div>`;
        }

        // Items (label: value pairs)
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                html += `<div style="margin: 2px 0;">`;
                if (item.label) {
                    html += `<span style="color: #aaa;">${item.label}:</span> `;
                }
                html += `<span style="color: white; font-weight: 500;">${item.value}</span>`;
                html += `</div>`;
            });
        }

        // Footer (smaller text)
        if (data.footer) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #999;">${data.footer}</div>`;
        }

        // Simple text (fallback)
        if (!data.title && !data.items && data.text) {
            html = data.text;
        }

        this.tooltip.html(html);
        
        // Set position first
        this.tooltip
            .style("left", (x + 15) + "px")
            .style("top", (y - 10) + "px");
        
        // Then make visible
        this.tooltip.style("opacity", 0.95);
        this.isVisible = true;
    }

    /**
     * Move tooltip to new position
     * @param {number} x - X position (pageX)
     * @param {number} y - Y position (pageY)
     */
    move(x, y) {
        if (!this.tooltip || !this.tooltip.node()) return;

        // Offset to avoid cursor overlap
        const offsetX = 15;
        const offsetY = -10;

        // Get tooltip dimensions
        const tooltipNode = this.tooltip.node();
        const tooltipRect = tooltipNode.getBoundingClientRect();
        
        // Calculate position
        let left = x + offsetX;
        let top = y + offsetY;

        // Prevent tooltip from going off-screen (right edge)
        if (left + tooltipRect.width > window.innerWidth) {
            left = x - tooltipRect.width - offsetX;
        }

        // Prevent tooltip from going off-screen (bottom edge)
        if (top + tooltipRect.height > window.innerHeight) {
            top = y - tooltipRect.height - offsetY;
        }

        // Prevent negative positions
        left = Math.max(5, left);
        top = Math.max(5, top);

        this.tooltip
            .style("left", left + "px")
            .style("top", top + "px");
    }

    /**
     * Hide tooltip
     */
    hide() {
        this.tooltip.style("opacity", 0);
        this.isVisible = false;
    }

    /**
     * Update tooltip content without changing position
     * @param {Object} data - Data to display
     */
    update(data) {
        if (!this.isVisible) return;
        
        let html = '';
        if (data.title) {
            html += `<div style="font-weight: bold; margin-bottom: 6px;">${data.title}</div>`;
        }
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                html += `<div style="margin: 2px 0;">`;
                if (item.label) {
                    html += `<span style="color: #aaa;">${item.label}:</span> `;
                }
                html += `<span style="color: white; font-weight: 500;">${item.value}</span>`;
                html += `</div>`;
            });
        }
        if (data.footer) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #999;">${data.footer}</div>`;
        }
        if (!data.title && !data.items && data.text) {
            html = data.text;
        }

        this.tooltip.html(html);
    }

    /**
     * Check if tooltip is currently visible
     * @returns {boolean}
     */
    get visible() {
        return this.isVisible;
    }
}

// Create a global instance when DOM is ready
let tooltipManager = null;

// Initialize immediately if DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        tooltipManager = new TooltipManager();
    });
} else {
    tooltipManager = new TooltipManager();
}
