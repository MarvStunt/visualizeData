/**
 * HeatMap/BarChart Component
 * Displays attacks over time - Bar chart for date ranges, Heatmap for single year
 */

class HeatMap {
    constructor(containerId, data, countries = null, startYear = null, endYear = null) {
        // Use jQuery selectors - try ID first, then class
        this.$container = $('#' + containerId).length ? $('#' + containerId) : $('.' + containerId);
        this.container = this.$container.length ? this.$container[0] : null;
        this.$chartContainer = $('.heatMap-chart-container');
        this.chartContainer = this.$chartContainer.length ? this.$chartContainer[0] : null;
        this.rawData = data;
        this.startYear = startYear;
        this.endYear = endYear;
        this.countries = this.normalizeCountries(countries);
        this.data = this.filterData(data, this.countries, startYear, endYear);
        this.margin = { top: 20, right: 20, bottom: 40, left: 50 };
        this.width = this.$chartContainer.width() || this.$container.width() || 400;
        this.height = this.$chartContainer.height() || this.$container.height() || 300;
        this.innerWidth = Math.max(0, this.width - this.margin.left - this.margin.right);
        this.innerHeight = Math.max(0, this.height - this.margin.top - this.margin.bottom);
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
     * Filter data by countries and date range
     * @param {Array} rawData - Array of data objects
     * @param {Array} countries - Array of country names to filter by
     * @param {Number|null} startYear - Start year for filtering
     * @param {Number|null} endYear - End year for filtering
     * @returns {Array} Filtered data
     */
    filterData(rawData, countries, startYear, endYear) {
        let filtered = rawData;

        // Filter by countries
        if (countries && countries.length > 0) {
            const countrySet = new Set(countries);
            filtered = filtered.filter(d => countrySet.has(d.country_txt));
        }

        // Filter by year range
        if (startYear !== null && endYear !== null) {
            filtered = filtered.filter(d => +d.iyear >= startYear && +d.iyear <= endYear);
        } else if (startYear !== null) {
            filtered = filtered.filter(d => +d.iyear === startYear);
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
        this.innerWidth = Math.max(0, this.width - this.margin.left - this.margin.right);
        this.innerHeight = Math.max(0, this.height - this.margin.top - this.margin.bottom);
    }

    /**
     * Initialize and render the chart
     */
    render() {
        this.updateDimensions();

        // Clear previous content
        this.$chartContainer.find('svg').remove();
        this.$chartContainer.find('.no-data-message').remove();
        this.$chartContainer.find('.select-country-message').remove();

        // If no countries selected, show a message to select countries
        if (!this.countries || this.countries.length === 0) {
            this.displaySelectCountryMessage();
            return;
        }

        // Check if there is data to display
        if (this.data.length === 0) {
            this.displayNoDataMessage();
            return;
        }

        // Determine which chart type to render
        if (this.startYear !== null && this.endYear !== null && this.startYear !== this.endYear) {
            this.renderBarChart();
        } else {
            this.renderHeatmap();
        }
    }

    /**
     * Render bar chart for date range
     */
    renderBarChart() {
        // Group data by year
        const attacksByYear = d3.group(this.data, d => d.iyear);
        const barData = Array.from(attacksByYear, ([year, attacks]) => {
            return { year: +year, attacks: attacks.length };
        }).sort((a, b) => a.year - b.year);

        // Create SVG
        this.svg = d3.select(this.chartContainer)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Scales
        const xScale = d3.scaleBand()
            .domain(barData.map(d => d.year))
            .range([0, this.innerWidth])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(barData, d => d.attacks)])
            .nice()
            .range([this.innerHeight, 0]);

        // Axes
        this.g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(xScale).tickValues(
                barData.filter((d, i) => i % 5 === 0).map(d => d.year)));

        this.g.append('g').call(d3.axisLeft(yScale));


        // Bars
        // Capture 'this' context for event handlers
        const self = this;
        this.g.selectAll('.bar')
            .data(barData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.year))
            .attr('y', d => yScale(d.attacks))
            .attr('width', xScale.bandwidth())
            .attr('height', d => this.innerHeight - yScale(d.attacks))
            .attr('fill', '#d73027')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('fill', '#a50026');
                self.showTooltip(event, { name: `Year: ${d.year}`, value: d.attacks });
            })
            .on('mouseout', function () {
                d3.select(this).attr('fill', '#d73027');
                self.hideTooltip();
            });
    }

    /**
     * Render heatmap for single year
     */
    renderHeatmap() {
        // Group data by month
        const attacksByMonth = d3.group(this.data, d => d.imonth);
        const heatmapData = Array.from(attacksByMonth, ([month, attacks]) => {
            return { month: +month, attacks: attacks.length };
        }).sort((a, b) => a.month - b.month);

        // Create SVG
        this.svg = d3.select(this.chartContainer)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        this.g = this.svg.append('g').attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        const cols = 4;
        const rows = 3;
        const cellWidth = this.innerWidth / cols;
        const cellHeight = this.innerHeight / rows;
        const minAttacks = d3.min(heatmapData, d => d.attacks) || 0;
        const maxAttacks = d3.max(heatmapData, d => d.attacks) || 1;
        const color = d3.scaleSequential().domain([minAttacks, maxAttacks]).interpolator(d3.interpolateRgb("yellow", "red"));
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Capture 'this' context for event handlers
        const self = this;
        const cells = this.g.selectAll('.cell')
            .data(heatmapData)
            .enter()
            .append('g')
            .attr('class', 'cell');

        cells.append('rect')
            .attr('x', d => ((d.month - 1) % cols) * cellWidth)
            .attr('y', d => Math.floor((d.month - 1) / cols) * cellHeight)
            .attr('width', cellWidth - 4)
            .attr('height', cellHeight - 4)
            .attr('fill', d => color(d.attacks))
            .attr('rx', 4)
            .attr('ry', 4)
            .on('mouseover', function (event, d) {
                d3.select(this).style('stroke', '#000').style('stroke-width', 2);
                self.showTooltip(event, { name: monthNames[d.month - 1], value: d.attacks });
            })
            .on('mouseout', function () {
                d3.select(this).style('stroke', 'none');
                self.hideTooltip();
            });

        // Month labels in center of cells
        cells.append('text')
            .attr('x', d => ((d.month - 1) % cols) * cellWidth + (cellWidth - 4) / 2)
            .attr('y', d => Math.floor((d.month - 1) / cols) * cellHeight + (cellHeight - 4) / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .attr('fill', d => d.attacks > maxAttacks / 2 ? '#fff' : '#000')
            .text(d => monthNames[d.month - 1]);

        // Legend
        this.renderLegend(color, minAttacks, maxAttacks);
    }

    /**
     * Render color legend for heatmap
     * @param {Function} color - D3 color scale
     * @param {Number} minAttacks - Minimum attacks value
     * @param {Number} maxAttacks - Maximum attacks value
     */
    renderLegend(color, minAttacks, maxAttacks) {
        const legendWidth = Math.min(150, this.innerWidth);
        const legendX = this.innerWidth - legendWidth;
        const legendY = this.innerHeight + 10;

        const legendScale = d3.scaleLinear().domain([0, maxAttacks]).range([0, legendWidth]);
        const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('d'));

        const defs = this.svg.append('defs');
        const gradId = 'legend-gradient';
        const gradient = defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');

        gradient.append('stop').attr('offset', '0%').attr('stop-color', color(minAttacks));
        gradient.append('stop').attr('offset', '100%').attr('stop-color', color(maxAttacks));
        const legendG = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left + legendX}, ${this.margin.top + legendY})`);

        legendG.append('rect')
            .attr('width', legendWidth)
            .attr('height', 12)
            .style('fill', `url(#${gradId})`);

        legendG.append('g')
            .attr('transform', `translate(0, 12)`)
            .call(legendAxis);
    }

    /**
     * Display a message when no data is available
     */
    displayNoDataMessage() {
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
            .text('No data available for the selected filters');

        this.$chartContainer.append($message);
    }

    /**
     * Display a message prompting user to select a country
     */
    displaySelectCountryMessage() {
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
            $('<p>').css({ marginBottom: '8px', fontWeight: 'bold' }).text('Attack Timeline'),
            $('<p>').text('Select one or more countries on the map to view attack statistics over time'),
            $('<p>').css({ fontSize: '12px', marginTop: '8px', color: '#aaa' }).text('Single year = Monthly heatmap | Year range = Bar chart')
        );

        this.$chartContainer.append($message);
    }

    /**
     * Update filters and re-render
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
        this.$chartContainer.html('');
        this.svg = null;
        this.render();
    }

    /**
     * Show tooltip with data information
     * @param {Event} event - Mouse event
     * @param {Object} d - Data object with name and value properties
     */
    showTooltip(event, d) {
        let $tooltip = $('#heatMap-tooltip');
        if ($tooltip.length === 0) {
            $tooltip = $('<div>')
                .attr('id', 'heatMap-tooltip')
                .css({
                    position: 'absolute',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    zIndex: '1000'
                })
                .appendTo('body');
        }

        let text = `<strong>${d.name}</strong>`;
        if (d.value !== undefined) text += `<br/>Attacks: ${d.value}`;
        $tooltip.html(text).css({
            left: (event.pageX + 10) + 'px',
            top: (event.pageY + 10) + 'px'
        }).show();
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        $('#heatMap-tooltip').hide();
    }
}