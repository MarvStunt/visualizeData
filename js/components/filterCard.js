/**
 * Filter Card Component
 * Displays colored filter buttons and a dual-range year slider
 */
class FilterCard {
    constructor(containerId, filters = [], onFilterChange = null) {
        this.container = $('#' + containerId);
        this.filters = filters; // Array of {label, color, value}
        this.onFilterChange = onFilterChange;
        this.selectedFilters = new Set();
        this.yearRange = { min: 1970, max: 2017 };
        
        this.sliderMin = null;
        this.sliderMax = null;
        this.labelMin = null;
        this.labelMax = null;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.attachSliderEvents();
    }

    /**
     * Attach events to range sliders
     */
    attachSliderEvents() {
        this.sliderMin = $('#filter-slider-min');
        this.sliderMax = $('#filter-slider-max');
        this.labelMin = $('#filter-year-min');
        this.labelMax = $('#filter-year-max');
        this.sliderRange = $('.filter-slider-range');
        
        if (!this.sliderMin.length || !this.sliderMax.length) return;
        
        const updateSliders = () => {
            let min = parseInt(this.sliderMin.val());
            let max = parseInt(this.sliderMax.val());
            
            // Swap if min > max
            if (min > max) {
                [min, max] = [max, min];
                this.sliderMin.val(min);
                this.sliderMax.val(max);
            }
            
            this.yearRange = { min, max };
            this.labelMin.text(min);
            this.labelMax.text(max);
            
            // Update slider range fill
            this.updateSliderRange();
            
            this.notifyChange();
        };
        
        // Disable animation while dragging
        this.sliderMin.on('mousedown touchstart', () => {
            this.sliderRange.removeClass('transitioning');
        });
        this.sliderMax.on('mousedown touchstart', () => {
            this.sliderRange.removeClass('transitioning');
        });
        
        // Re-enable animation after dragging
        $(document).on('mouseup touchend', () => {
            this.sliderRange.addClass('transitioning');
        });
        
        this.sliderMin.on('input', updateSliders);
        this.sliderMax.on('input', updateSliders);
        
        // Initialize on load
        updateSliders();
    }

    /**
     * Update the slider range fill
     */
    updateSliderRange() {
        if (!this.sliderRange.length) return;
        
        const min = parseInt(this.sliderMin.val());
        const max = parseInt(this.sliderMax.val());
        const minSlider = parseInt(this.sliderMin.attr('min'));
        const maxSlider = parseInt(this.sliderMax.attr('max'));
        
        const minPercent = ((min - minSlider) / (maxSlider - minSlider)) * 100;
        const maxPercent = ((max - minSlider) / (maxSlider - minSlider)) * 100;
        
        this.sliderRange.css('left', minPercent + '%');
        this.sliderRange.css('right', (100 - maxPercent) + '%');
    }

    /**
     * Notify parent of changes
     */
    notifyChange() {
        if (this.onFilterChange) {
            this.onFilterChange({
                filters: Array.from(this.selectedFilters),
                yearRange: this.yearRange
            });
        }
    }

    /**
     * Get current selected filters and year range
     * @returns {Object}
     */
    getState() {
        return {
            filters: Array.from(this.selectedFilters),
            yearRange: this.yearRange
        };
    }

    /**
     * Set filters programmatically
     * @param {Array} filterValues
     */
    setSelectedFilters(filterValues) {
        // Clear all
        $('.filter-button').removeClass('active');
        this.selectedFilters.clear();
        
        // Set new
        filterValues.forEach(value => {
            const button = $(`[data-value="${value}"]`);
            if (button.length) {
                button.addClass('active');
                this.selectedFilters.add(value);
            }
        });
        
        this.notifyChange();
    }

    /**
     * Set year range programmatically
     * @param {Number} min
     * @param {Number} max
     */
    setYearRange(min, max) {
        if (this.sliderMin.length && this.sliderMax.length) {
            this.sliderMin.val(min);
            this.sliderMax.val(max);
            this.yearRange = { min, max };
            this.labelMin.text(min);
            this.labelMax.text(max);
            this.updateSliderRange();
            this.notifyChange();
        }
    }
}
