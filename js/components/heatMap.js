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
            this.renderLineChart();
        } else if (this.startYear !== null && this.endYear !== null && this.startYear === this.endYear && this.countries.length > 1) {
            this.renderGroupedBarChart();
        } else if (this.endYear === this.startYear && this.countries.length === 1) {
            this.renderHeatmap()
        }
    }

    renderGroupedBarChart() {
        const self = this;
        const countryField = 'country_txt';
        const monthField = 'imonth';
        const container = d3.select(this.chartContainer);
        container.selectAll('*').remove();

        const countriesSelected = (Array.isArray(this.countries) && this.countries.length)
            ? this.countries.slice(0, 3)
            : Array.from(d3.rollup(this.data, v => v.length, d => d[countryField]))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(d => d[0]);

        if (!countriesSelected.length || !this.startYear) {
            this.displayNoDataMessage();
            return;
        }

        const dataYear = this.data.filter(d => +d.iyear === +this.startYear && countriesSelected.includes(d[countryField]));

        const agg = d3.rollup(dataYear, v => v.length, d => +d[monthField], d => d[countryField]);
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        const series = months.map(m => ({
            month: m,
            counts: countriesSelected.map(c => ({ country: c, value: (agg.get(m) && agg.get(m).get(c)) || 0 }))
        }));

        const margin = { top: 30, right: 250, bottom: 60, left: 50 };
        const width = Math.max(760, container.node().clientWidth || this.width || 800);
        const height = 360;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = container.append('svg').attr('width', width).attr('height', height);
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x0 = d3.scaleBand().domain(months).range([0, innerWidth]).padding(0.15);
        const x1 = d3.scaleBand().domain(countriesSelected).range([0, x0.bandwidth()]).padding(0.05);
        const y = d3.scaleLinear()
            .domain([0, d3.max(series, s => d3.max(s.counts, c => c.value)) || 1])
            .nice()
            .range([innerHeight, 0]);

        const color = this.getCountryColorScale(countriesSelected);

        // Axes (avec couleur adaptée au thème)
        const xAxis = g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x0).tickFormat(d => monthNames[d - 1]));

        xAxis.selectAll('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-40)')
            .attr('dx', '-0.5em')
            .attr('dy', '-0.2em')
            .attr('fill', this.getLegendTextColor());
        xAxis.selectAll('path, line').attr('stroke', this.getLegendTextColor());

        const yAxis = g.append('g')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));

        yAxis.selectAll('text').attr('fill', this.getLegendTextColor());
        yAxis.selectAll('path, line').attr('stroke', this.getLegendTextColor());

        // Bars
        const monthGroup = g.selectAll('.month')
            .data(series)
            .enter().append('g')
            .attr('class', 'month')
            .attr('transform', d => `translate(${x0(d.month)},0)`);

        monthGroup.selectAll('rect')
            .data(d => d.counts)
            .enter().append('rect')
            .attr('x', d => x1(d.country))
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())
            .attr('height', d => innerHeight - y(d.value))
            .attr('fill', d => color(d.country))
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.8);
                if (typeof tooltipManager !== 'undefined') {
                    const monthDatum = d3.select(this.parentNode).datum();
                    const monthIndex = (monthDatum && monthDatum.month) ? monthDatum.month - 1 : 0;
                    tooltipManager.show({
                        title: `${d.country} — ${monthNames[monthIndex]} ${self.startYear}`,
                        items: [{ label: 'Attaques', value: d.value }]
                    }, event.pageX, event.pageY);
                }
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 1);
                if (typeof tooltipManager !== 'undefined') tooltipManager.hide();
            });

        const legend = svg.append('g').attr('transform', `translate(${margin.left + innerWidth + 10}, ${margin.top})`);
        countriesSelected.forEach((c, i) => {
            const ly = i * 20;
            const lg = legend.append('g').attr('transform', `translate(0, ${ly})`);
            lg.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(c));
            lg.append('text')
                .attr('x', 18)
                .attr('y', 10)
                .attr('font-size', 12)
                .attr('fill', this.getLegendTextColor())
                .text(c);
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

        this.g = this.svg.append('g').attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        const cols = 4;
        const rows = 3;
        const cellWidth = this.innerWidth / cols;
        const cellHeight = this.innerHeight / rows;
        const minAttacks = d3.min(heatmapData, d => d.attacks) || 0;
        const maxAttacks = d3.max(heatmapData, d => d.attacks) || 1;
        const color = d3.scaleSequential().domain([minAttacks, maxAttacks]).interpolator(d3.interpolateRgb("yellow", "red"));
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
                tooltipManager.show({
                    title: monthNames[d.month - 1],
                    items: [{ label: 'Attacks', value: d.attacks }]
                }, event.pageX, event.pageY);
            })
            .on('mouseout', function () {
                d3.select(this).style('stroke', 'none').style('stroke-width', 0);
                tooltipManager.hide();
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

    renderLineChart() {
        const yearField = 'iyear';
        const countryField = 'country_txt';
        const container = d3.select(this.chartContainer);
        container.selectAll('*').remove();

        // select up to 3 countries (either from this.countries or top 3 in data)
        let countriesSelected = Array.isArray(this.countries) && this.countries.length > 0
            ? this.countries.slice(0, 3)
            : [];

        let data = this.data.slice();
        if (!countriesSelected.length) {
            countriesSelected = Array.from(d3.rollup(data, v => v.length, d => d[countryField]))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(d => d[0]);
        }

        if (!countriesSelected.length) {
            this.displayNoDataMessage();
            return;
        }

        const agg = d3.rollup(this.data, v => v.length, d => +d[yearField], d => d[countryField]);

        let years;
        if (this.startYear != null && this.endYear != null) {
            const sy = +this.startYear;
            const ey = +this.endYear;
            const start = Math.min(sy, ey);
            const end = Math.max(sy, ey);
            years = d3.range(start, end + 1);
        } else {
            years = Array.from(new Set(this.data.map(d => +d[yearField]))).sort((a, b) => a - b);
        }

        if (!years.length) {
            this.displayNoDataMessage();
            return;
        }

        const series = countriesSelected.map(country => {
            return {
                key: country,
                values: years.map(y => ({ year: y, value: (agg.get(y) && agg.get(y).get(country)) || 0 }))
            };
        });

        // Dimensions
        const margin = { top: 30, right: 40, bottom: 40, left: 40 };
        const width = Math.max(600, container.node().clientWidth || this.width || 800);
        const height = 360;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = container.append('svg').attr('width', width).attr('height', height);
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scalePoint().domain(years).range([0, innerWidth]).padding(0.5);
        const y = d3.scaleLinear()
            .domain([0, d3.max(series, s => d3.max(s.values, v => v.value)) || 1])
            .nice()
            .range([innerHeight, 0]);

        const color = this.getCountryColorScale(countriesSelected);


        const xAxisTop = g.append('g')
            .attr('class', 'x axis top')
            .call(d3.axisTop(x).tickFormat(d3.format('d')));

// styling texte et traits de l'axe supérieur
        xAxisTop.selectAll('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-60)')
            .attr('dx', '2em')
            .attr('dy', '0.75em')
            .attr('fill', this.getLegendTextColor());
        xAxisTop.selectAll('path, line').attr('stroke', this.getLegendTextColor());

        const yAxis = g.append('g')
            .attr('class', 'y axis')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));

// styling texte et traits de l'axe gauche
        yAxis.selectAll('text').attr('fill', this.getLegendTextColor());
        yAxis.selectAll('path, line').attr('stroke', this.getLegendTextColor());

        // Line generator
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX);

        // Draw lines
        const countryGroup = g.selectAll('.country')
            .data(series)
            .enter().append('g')
            .attr('class', 'country');

        countryGroup.append('path')
            .attr('class', 'line')
            .attr('d', d => line(d.values))
            .attr('fill', 'none')
            .attr('stroke', d => color(d.key))
            .attr('stroke-width', 2);

        // Points with tooltip
        countryGroup.selectAll('circle')
            .data(d => d.values.map(v => ({ key: d.key, year: v.year, value: v.value })))
            .enter().append('circle')
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d.value))
            .attr('r', 4)
            .attr('fill', d => color(d.key))
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 6);
                if (typeof tooltipManager !== 'undefined') {
                    tooltipManager.show({
                        title: `${d.key} — ${d.year}`,
                        items: [{ label: 'Attacks', value: d.value }]
                    }, event.pageX, event.pageY);
                }
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 4);
                if (typeof tooltipManager !== 'undefined') {
                    tooltipManager.hide();
                }
            });

        const legendItemWidth = 160;
        const totalLegendWidth = Math.min(innerWidth, countriesSelected.length * legendItemWidth);
        const legendStartX = margin.left + Math.max(0, (innerWidth - totalLegendWidth) / 2);
        const legendY = margin.top + innerHeight + 15;

        const legend = svg.append('g').attr('transform', `translate(${legendStartX}, ${legendY})`).attr('color', this.getLegendTextColor());

        countriesSelected.forEach((c, i) => {
            const lx = i * legendItemWidth;
            const lg = legend.append('g').attr('transform', `translate(${lx}, 0)`);
            lg.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(c));
            lg.append('text')
                .attr('x', 18)
                .attr('y', 10)
                .attr('font-size', 12)
                .attr('fill', this.getLegendTextColor())
                .text(c);
        });
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
        const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('d').attr('fill', this.getLegendTextColor()));

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

    getCountryColorScale(countriesSelected = []) {
        const basePalettes = [d3.schemeSet1, d3.schemeSet2, d3.schemeCategory10, d3.schemeTableau10];
        const flat = basePalettes.flat();
        const colors = countriesSelected.map((_, i) => flat[i % flat.length]);
        return d3.scaleOrdinal().domain(countriesSelected).range(colors);
    }

    isDarkTheme() {
        if (window.themeManager && typeof window.themeManager.isDarkMode === 'function') {
            return window.themeManager.isDarkMode();
        }
        if (document.body && document.body.classList.contains('dark-mode')) {
            return true;
        }
        return document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark-theme') ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    getLegendTextColor() {
        return this.isDarkTheme() ? '#ffffff' : '#000000';
    }
}