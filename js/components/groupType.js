/**
 * Sunburst Diagram Component
 * Data hierarchy: Terrorist group -> number of people implicated -> gun type used -> success rate
 */

class SunburstDiagram {
    constructor(containerId, data, country, year) {
        this.container = document.getElementById(containerId);
        this.rawData = data;
        this.data = this.filterByCountry(data, country);
        this.currentCountry = country;
        this.currentYear = year;
        this.data = this.filterByYear(this.data, year);
        this.width = this.container.clientWidth || 800;
        this.height = this.container.clientHeight || 800;
        this.radius = Math.min(this.width, this.height) / 2;

        // D3 selections
        this.svg = null;
        this.g = null;
    }

    /**
     * Filter data by country
     * @param {Array} rawData - Array of data objects from CSV
     * @param {String} country - Country name to filter by
     * @returns {Array} Filtered data
     */
    filterByCountry(rawData, country) {
        if (!country || country === '') {
            return rawData;
        }
        return rawData.filter(d => d.country_txt === country);
    }

    /**
     * Filter data by year
     * @param {Array} rawData - Array of data objects from CSV
     * @param {String} year - Year to filter by
     * @returns {Array} Filtered data
     */
    filterByYear(rawData, year) {
        if (!year || year === '') {
            return rawData;
        }
        // Convert year to string to match CSV data type
        const yearStr = String(year);
        return rawData.filter(d => String(d.iyear) === yearStr);
    }

    /**
     * Transform flat CSV data into hierarchical structure
     * @param {Array} rawData - Array of data objects from CSV
     * @returns {Object} Hierarchical object for d3.hierarchy
     */
    buildHierarchy(rawData) {
        // Create root node
        const root = {
            children: []
        };

        // Create a map to store terrorist groups
        const terroristGroupMap = new Map();

        rawData.forEach(d => {
            const groupName = d.gname || "Undefined";
            const numPeople = (d.nperps === "-99.0" || !d.nperps) ? "Undefined" : d.nperps;
            const gunType = d.weaptype1_txt || "Undefined";
            const successRate = d.success || 0;
            console.log(`Group: ${groupName}, Num People: ${numPeople}, Gun Type: ${gunType}, Success Rate: ${successRate}`);

            // Get or create region
            let terroristGroupNode = terroristGroupMap.get(groupName);
            if (!terroristGroupNode) {
                terroristGroupNode = {
                    name: groupName,
                    children: []
                };
                terroristGroupMap.set(groupName, terroristGroupNode);
                root.children.push(terroristGroupNode);
            }

            // Get or create numPeople within terrorist group
            let numPeopleNode = terroristGroupNode.children.find(c => c.name === numPeople);
            if (!numPeopleNode) {
                numPeopleNode = {
                    name: numPeople,
                    children: []
                };
                terroristGroupNode.children.push(numPeopleNode);
            }

            // Get or create gunType within numPeople
            let gunTypeNode = numPeopleNode.children.find(g => g.name === gunType);
            if (!gunTypeNode) {
                gunTypeNode = {
                    name: gunType,
                    children: []
                };
                numPeopleNode.children.push(gunTypeNode);
            }

            // Get or create successRate within gunType
            let successRateNode = gunTypeNode.children.find(s => s.name === successRate);
            if (!successRateNode) {
                successRateNode = {
                    name: successRate,
                    value: 0
                };
                gunTypeNode.children.push(successRateNode);
            }

        });

        return root;
    }

    /**
     * Initialize and render the sunburst diagram
     */
    render() {
        // Check if there is data to display
        if (this.data.length === 0) {
            this.displayNoDataMessage();
            return;
        }

        // Build hierarchy
        const hierarchyData = this.buildHierarchy(this.data);

        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'sunburst-svg');

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

        // Create hierarchy
        const hierarchy = d3.hierarchy(hierarchyData)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);

        // Create partition layout
        const partition = d3.partition()
            .size([2 * Math.PI, this.radius]);

        partition(hierarchy);

        // Create arc generator
        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1);

        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain(hierarchyData.children.map(d => d.name))
            .range(d3.schemeSet1);

        // Draw slices
        const slices = this.g.selectAll('g')
            .data(hierarchy.descendants())
            .join('g')
            .attr('class', 'slice');

        // Add paths for each slice
        slices.append('path')
            .attr('class', 'arc')
            .attr('d', arc)
            .style('fill', d => {
                // Root has no fill
                if (!d.parent) return 'none';
                // Color by first level (regions)
                let ancestor = d;
                while (ancestor.parent.parent) {
                    ancestor = ancestor.parent;
                }
                return colorScale(ancestor.data.name);
            })
            .style('stroke', '#fff')
            .style('stroke-width', 1)
            .style('opacity', 0.8)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .style('opacity', 1)

                // Show tooltip
                showTooltip(event, d);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .style('opacity', 0.8)

                hideTooltip();
            });

        // Add click handler for zooming TODO: implement zooming
        slices.on('click', (event, d) => this.clicked(event, d, arc, hierarchy));
    }

    /**
     * Display a message when no data is available
     */
    displayNoDataMessage() {
        // Clear previous content
        d3.select(this.container).html('');

        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.className = 'no-data-message';
        messageDiv.innerHTML = `
            <div class="no-data-content">
                <p class="no-data-title">No Data Available</p>
                <p class="no-data-text">No terrorist attack data found for:</p>
                <p class="no-data-details">
                    ${this.currentCountry ? `Country: <strong>${this.currentCountry}</strong>` : 'All countries'}<br/>
                    ${this.currentYear ? `Year: <strong>${this.currentYear}</strong>` : 'All years'}
                </p>
                <p class="no-data-suggestion">Please try selecting different filters.</p>
            </div>
        `;
        this.container.appendChild(messageDiv);
    }

    /**
     * Update the country and year filters and re-render
     * @param {String} country - New country filter
     * @param {String} year - New year filter
     */
    updateFilters(country, year) {
        this.currentCountry = country;
        this.currentYear = year;
        this.data = this.filterByCountry(this.rawData, country);
        this.data = this.filterByYear(this.data, year);
        // Clear previous content (SVG and message)
        d3.select(this.container).html('');
        this.svg = null;
        this.render();
    }
}


/**
 * Tooltip management
 */
function showTooltip(event, d) {
    let tooltip = document.getElementById('sunburst-tooltip');

    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'sunburst-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(tooltip);
    }

    let text = `<strong>${d.data.name}</strong>`;
    if (d.value) text += `<br/>Count: ${d.value}`;

    tooltip.innerHTML = text;
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('sunburst-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

// Initialize when data is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Load CSV data
    d3.csv('cleaned_data.csv').then(data => {
        const defaultCountry = 'France';
        const defaultYear = '2010';
        const sunburst = new SunburstDiagram('groupType-chart', data, defaultCountry, defaultYear);

        // Render initial chart
        sunburst.render();
    });
});
