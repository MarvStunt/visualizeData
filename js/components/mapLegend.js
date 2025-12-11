/**
 * Map Legend Component
 * Displays a gradient legend with metric title and value range
 */
class MapLegend {
    constructor(containerId) {
        this.container = $('#' + containerId);
        this.legendTitle = this.container.find('.map-legend-title');
        this.legendMaxValue = this.container.find('.map-legend-max-value');
        this.currentMetric = "attacks";
        this.maxValue = 0;
    }

    /**
     * Update legend with new values
     * @param {String} metric - Metric type ("attacks" or "kills")
     * @param {Number} maxValue - Maximum value for the range
     */
    updateLegend(metric, maxValue) {
        this.currentMetric = metric;
        this.maxValue = maxValue;

        // Determine title based on metric
        const title = metric === "attacks" ? "Nombre d'attaques" : "Nombre de victimes";
        
        // Update title
        this.legendTitle.text(title);
        
        // Update max value
        this.legendMaxValue.text(maxValue.toLocaleString());
    }

    /**
     * Get current metric
     * @returns {String} Current metric ("attacks" or "kills")
     */
    getMetric() {
        return this.currentMetric;
    }

    /**
     * Get current max value
     * @returns {Number} Maximum value displayed
     */
    getMaxValue() {
        return this.maxValue;
    }

    /**
     * Hide the legend
     */
    hide() {
        this.container.addClass('hidden');
    }

    /**
     * Show the legend
     */
    show() {
        this.container.removeClass('hidden');
    }
}
