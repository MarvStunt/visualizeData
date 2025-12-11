/**
 * Map Metrics Component
 * Displays metric selection for map visualization (attacks vs kills)
 */
class MapMetrics {
    constructor(containerId, onMetricChange = null) {
        this.container = $('#' + containerId);
        this.onMetricChange = onMetricChange;
        this.currentMetric = "attacks";
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.attachMetricEvents();
    }

    /**
     * Attach events to metric radio buttons
     */
    attachMetricEvents() {
        const self = this;
        const radioButtons = this.container.find('input[name="metric"]');
        
        if (!radioButtons.length) return;
        
        radioButtons.on('change', function() {
            const selectedMetric = $(this).val();
            self.currentMetric = selectedMetric;
            self.notifyChange();
        });
    }

    /**
     * Notify parent of metric changes
     */
    notifyChange() {
        if (this.onMetricChange) {
            this.onMetricChange(this.currentMetric);
        }
    }

    /**
     * Get current metric
     * @returns {String} Current metric value ("attacks" or "kills")
     */
    getMetric() {
        return this.currentMetric;
    }

    /**
     * Set metric programmatically
     * @param {String} metric - Metric value to set
     */
    setMetric(metric) {
        if (metric !== "attacks" && metric !== "kills") {
            console.warn(`Invalid metric: ${metric}. Must be "attacks" or "kills"`);
            return;
        }
        
        this.currentMetric = metric;
        this.container.find(`input[name="metric"][value="${metric}"]`).prop('checked', true);
    }
}
