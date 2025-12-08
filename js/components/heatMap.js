/**
 * HeatMap/BarChart Component
 * Displays attacks over time - Bar chart for date ranges, Heatmap for single year
 * Extends BaseChart for common chart functionality
 */

class HeatMap extends BaseChart {
    constructor(containerId, data, countries = null, startYear = null, endYear = null) {
        // Initialize parent class
        super(containerId, 'heatMap-chart-container', data, countries, startYear, endYear);
        
        // HeatMap specific dimensions
        this.margin = { top: 20, right: 20, bottom: 40, left: 50 };
        this.innerWidth = Math.max(0, this.width - this.margin.left - this.margin.right);
        this.innerHeight = Math.max(0, this.height - this.margin.top - this.margin.bottom);
    }

    /**
     * Initialize and render the chart
     */
    render() {
        this.updateDimensions();
        this.clearCharts();

        // If no countries selected, show a message to select countries
        if (!this.countries || this.countries.length === 0) {
            this.displaySelectCountryMessage('Attack Timeline', 'Select one or more countries on the map to view attack statistics over time');
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

        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.width / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Attack Timeline');

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

        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.width / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Monthly Attack Distribution');

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
        this.clearCharts();
        this.svg = null;
        this.render();
    }
}
