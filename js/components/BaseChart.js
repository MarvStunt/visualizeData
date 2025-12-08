/**
 * BaseChart - Abstract base class for all chart components
 * Provides common functionality for data filtering, normalization, and UI messaging
 */

class BaseChart {
    /**
     * Constructor for BaseChart
     * @param {String} containerId - The ID or class of the main container
     * @param {String} chartContainerClass - The class of the chart container
     * @param {Array} data - The raw data array
     * @param {String|Array|null} countries - Country or countries to filter by
     * @param {Number|null} startYear - Start year for filtering
     * @param {Number|null} endYear - End year for filtering
     */
    constructor(containerId, chartContainerClass, data, countries = null, startYear = null, endYear = null) {
        // Container setup
        this.$container = $('#' + containerId).length ? $('#' + containerId) : $('.' + containerId);
        this.container = this.$container.length ? this.$container[0] : null;
        this.$chartContainer = $('.' + chartContainerClass);
        this.chartContainer = this.$chartContainer.length ? this.$chartContainer[0] : null;

        // Data
        this.rawData = data;
        this.startYear = startYear;
        this.endYear = endYear;
        this.countries = this.normalizeCountries(countries);
        this.data = this.filterData(data, this.countries, startYear, endYear);

        // Dimensions
        this.margin = { top: 20, right: 100, bottom: 60, left: 100 };
        this.width = this.$chartContainer.width() || this.$container.width() || 400;
        this.height = this.$chartContainer.height() || this.$container.height() || 300;

        // SVG references
        this.svg = null;
        this.g = null;
    }

    /**
     * Normalize countries input to an array
     * @param {String|Array|null} countries - Single country, array of countries, or null
     * @returns {Array} Array of countries or empty array if null
     */
    normalizeCountries(countries) {
        if (!countries || countries === '') {
            return [];
        }

        if (Array.isArray(countries)) {
            return countries.filter(c => c && c !== '');
        }

        return [countries];
    }

    /**
     * Filter data by countries and year range
     * @param {Array} rawData - Array of data objects
     * @param {Array} countries - Array of country names to filter by
     * @param {Number|null} startYear - Start year for filtering
     * @param {Number|null} endYear - End year for filtering
     * @returns {Array} Filtered data
     */
    filterData(rawData, countries, startYear = null, endYear = null) {
        let filtered = rawData;

        // Filter by countries
        if (countries && countries.length > 0) {
            filtered = filtered.filter(d => countries.includes(d.country_txt));
        }

        // Filter by year range
        if (startYear !== null || endYear !== null) {
            const start = startYear !== null ? parseInt(startYear) : null;
            const end = endYear !== null ? parseInt(endYear) : null;

            filtered = filtered.filter(d => {
                const year = parseInt(d.iyear);

                // If only startYear is provided, filter to exactly that year
                if (start !== null && end === null) {
                    return year === start;
                }

                // If both years are provided, filter to range
                if (start !== null && year < start) {
                    return false;
                }
                if (end !== null && year > end) {
                    return false;
                }
                return true;
            });
        }

        return filtered;
    }

    /**
     * Update dimensions based on container size
     */
    updateDimensions() {
        const containerElement = this.chartContainer || this.container;
        this.width = (containerElement && containerElement.clientWidth) || 400;
        this.height = (containerElement && containerElement.clientHeight) || 300;
    }

    /**
     * Clear all charts from container
     */
    clearCharts() {
        this.$chartContainer.find('svg').remove();
        this.$chartContainer.find('.stacked-chart').remove();
        this.$chartContainer.find('.pie-chart').remove();
        this.$chartContainer.find('.no-data-message').remove();
        this.$chartContainer.find('.select-country-message').remove();
    }

    /**
     * Display a message when no data is available
     * @param {String} messageText - Optional custom message text
     */
    displayNoDataMessage(messageText = 'No data available for the selected filters') {
        this.$chartContainer.html('');
        const $message = $('<div>')
            .addClass('no-data-message')
            .css({
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#666',
                fontSize: '14px'
            })
            .text(messageText);

        this.$chartContainer.append($message);
    }

    /**
     * Display a message prompting user to select a country
     * @param {String} chartName - Name of the current chart (e.g., "Weapon Usage", "Attack Timeline")
     * @param {String} selectionHint - Hint about what happens with different selections
     */
    displaySelectCountryMessage(chartName = 'Chart', selectionHint = 'Select one or more countries on the map to view data') {
        this.$chartContainer.html('');
        const $message = $('<div>')
            .addClass('select-country-message')
            .css({
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#888',
                fontSize: '14px',
                textAlign: 'center',
                padding: '20px'
            });

        $message.append(
            $('<p>').css({ marginBottom: '8px', fontWeight: 'bold' }).text(chartName),
            $('<p>').text(selectionHint)
        );

        this.$chartContainer.append($message);
    }

    /**
     * Update filters and re-render (to be overridden by subclasses)
     * @param {String|Array} countries - Country filter
     * @param {Number|null} startYear - Start year for filtering
     * @param {Number|null} endYear - End year for filtering
     */
    updateFilters(countries, startYear = null, endYear = null) {
        this.countries = this.normalizeCountries(countries);
        this.startYear = startYear;
        this.endYear = endYear;
        this.data = this.filterData(this.rawData, this.countries, startYear, endYear);

        // Clear and re-render
        this.clearCharts();
        this.svg = null;
        this.g = null;
        this.render();
    }

    /**
     * Render the chart (to be implemented by subclasses)
     */
    render() {
        throw new Error('render() method must be implemented by subclass');
    }
}
