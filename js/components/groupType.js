/**
 * Sunburst Diagram Component
 * Data hierarchy: Terrorist group -> number of people implicated -> gun type used -> success rate
 */

class SunburstDiagram {
    constructor(containerId, data, country = null, startYear = null, endYear = null) {
        this.container = document.getElementById(containerId);
        this.rawData = data;
        this.startYear = startYear;
        this.endYear = endYear;
        // Convert single country string to array, or keep as array if already an array
        this.countries = this.normalizeCountries(country);
        this.data = this.filterByCountriesAndDate(data, this.countries, startYear, endYear);
        this.currentCountry = country;
        // Determine if simplified hierarchy should be used based on number of countries in filtered data
        this.simplifiedHierarchy = this.countries && this.countries.length > 1;
        this.groupPercentage = 10;
        this.width = this.container.clientWidth || 800;
        this.height = this.container.clientHeight || 800;
        this.radius = Math.min(this.width, this.height) / 2;

        // D3 selections
        this.svg = null;
        this.g = null;
    }

    /**
     * Normalize country input to an array
     * @param {String|Array|null} country - Single country, array of countries, or null
     * @returns {Array} Array of countries or empty array if null
     */
    normalizeCountries(country) {
        if (!country || country === '') {
            return [];
        }
        if (Array.isArray(country)) {
            return country.filter(c => c && c !== '');
        }
        return [country];
    }

    /**
     * Filter data by countries and date range
     * @param {Array} rawData - Array of data objects from CSV
     * @param {Array} countries - Array of country names to filter by
     * @param {String|Number} startYear - Start year for filtering (null = no limit)
     * @param {String|Number} endYear - End year for filtering (null = no limit)
     * @returns {Array} Filtered data
     */
    filterByCountriesAndDate(rawData, countries, startYear = null, endYear = null) {
        let filtered = rawData;

        // Filter by countries - only include specified countries
        if (countries && countries.length > 0) {
            filtered = filtered.filter(d => countries.includes(d.country_txt));
        }

        // Filter by year range if provided
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
     * Filter data by country and date range
     * @param {Array} rawData - Array of data objects from CSV
     * @param {String} country - Country name to filter by
     * @param {String|Number} startYear - Start year for filtering (null = no limit)
     * @param {String|Number} endYear - End year for filtering (null = no limit)
     * @returns {Array} Filtered data
     */
    filterByCountryAndDate(rawData, country, startYear = null, endYear = null) {
        let filtered = rawData;

        // Filter by country
        if (country && country !== '') {
            filtered = filtered.filter(d => d.country_txt === country);
        }

        // Filter by year range if provided
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
     * Count unique countries in the data
     * @param {Array} data - Array of data objects
     * @returns {Number} Number of unique countries
     */
    countUniqueCountries(data) {
        const countries = new Set();
        data.forEach(d => {
            if (d.country_txt) {
                countries.add(d.country_txt);
            }
        });
        return countries.size;
    }

    /**
     * Create dynamic categories for numPeople values
     * @param {Array} numPeopleValues - Array of numeric values
     * @returns {Array} Array of category boundaries [min, max]
     */
    createDynamicCategories(numPeopleValues) {
        // Filter out "Undefined" and convert to numbers
        const numericValues = numPeopleValues
            .filter(v => v !== "Undefined")
            .map(v => parseInt(v))
            .filter(v => !isNaN(v))
            .sort((a, b) => a - b);

        if (numericValues.length === 0) {
            return [];
        }

        const min = numericValues[0];
        const max = numericValues[numericValues.length - 1];

        const categories = [];
        let currentMin = min;

        // Generate categories with exponential scaling
        while (currentMin <= max) {
            let categoryMax;

            // Determine category max based on magnitude
            if (currentMin < 10) {
                categoryMax = 10;
            } else if (currentMin < 100) {
                categoryMax = 100;
            } else if (currentMin < 1000) {
                categoryMax = 1000;
            } else if (currentMin < 10000) {
                categoryMax = 10000;
            } else {
                categoryMax = currentMin * 10;
            }

            // Ensure the last category goes at least to max
            if (categoryMax > max && currentMin < max) {
                categoryMax = max;
            }

            categories.push([currentMin, categoryMax]);
            currentMin = categoryMax;
        }

        return categories;
    }

    /**
     * Get category for a numeric value
     * @param {Number} value - Numeric value
     * @param {Array} categories - Array of [min, max] category boundaries
     * @returns {String} Category label
     */
    getCategoryLabel(value, categories) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return "Undefined";

        for (const [min, max] of categories) {
            if (numValue >= min && numValue <= max) {
                return `${min}-${max}`;
            }
        }

        // If value is outside all categories, return as is
        return value.toString();
    }

    /**
     * Transform flat CSV data into hierarchical structure
     * @param {Array} rawData - Array of data objects from CSV
     * @returns {Object} Hierarchical object for d3.hierarchy
     */
    buildHierarchy(rawData) {
        if (this.simplifiedHierarchy) {
            return this.buildSimplifiedHierarchy(rawData);
        } else {
            return this.buildFullHierarchy(rawData);
        }
    }

    /**
     * Build simplified hierarchy: Country -> Terrorist Group -> Success
     * @param {Array} rawData - Array of data objects from CSV
     * @returns {Object} Hierarchical object for d3.hierarchy
     */
    buildSimplifiedHierarchy(rawData) {
        const root = {
            children: []
        };

        const countryMap = new Map();

        // Group data by country -> group -> success
        rawData.forEach(d => {
            const country = d.country_txt || "Undefined";
            const groupName = d.gname || "Undefined";
            const successRate = d.success;

            // Skip invalid data
            if (groupName === "Unknown" || groupName === "Undefined") {
                return;
            }

            // Handle success rate: only process if success === 1, skip if 0, warn if missing
            if (successRate === undefined || successRate === null || successRate === '') {
                console.warn('Missing success rate data for row:', d);
                return;
            }

            // Skip if success rate is 0
            if (successRate === 0 || successRate === '0') {
                return;
            }

            // Only process if success rate is 1
            if (successRate !== 1 && successRate !== '1') {
                return;
            }

            // Get or create country node
            let countryNode = countryMap.get(country);
            if (!countryNode) {
                countryNode = {
                    name: country,
                    children: []
                };
                countryMap.set(country, countryNode);
                root.children.push(countryNode);
            }

            // Get or create group node within country
            let groupNode = countryNode.children.find(g => g.name === groupName);
            if (!groupNode) {
                groupNode = {
                    name: groupName,
                    children: []
                };
                countryNode.children.push(groupNode);
            }

            // Get or create success node within group
            let successNode = groupNode.children.find(s => s.name === successRate);
            if (!successNode) {
                successNode = {
                    name: successRate,
                    value: 1
                };
                groupNode.children.push(successNode);
            } else {
                successNode.value += 1;
            }
        });

        return root;
    }

    /**
     * Build full hierarchy: Terrorist Group -> numPeople -> gunType -> success
     * @param {Array} rawData - Array of data objects from CSV
     * @returns {Object} Hierarchical object for d3.hierarchy
     */
    buildFullHierarchy(rawData) {
        // Create root node
        const root = {
            children: []
        };

        // Create a map to store terrorist groups
        const terroristGroupMap = new Map();

        // First pass: count occurrences of each terrorist group
        const groupCounts = new Map();
        rawData.forEach(d => {
            if (d.gname == "Unknown" || d.gname == "Undefined") {
                // skip this line without cutting the loop
                return;
            }
            const groupName = d.gname;
            groupCounts.set(groupName, (groupCounts.get(groupName) || 0) + 1);
        });

        // Get top X% of groups by frequency
        const sortedGroups = Array.from(groupCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        // If there are less than 5 groups, use all groups; otherwise apply percentage filter
        let topGroups;
        if (sortedGroups.length < 5) {
            topGroups = new Set(sortedGroups.map(entry => entry[0]));
        } else {
            const topPercentile = Math.max(1, Math.ceil(sortedGroups.length * (this.groupPercentage / 100)));
            topGroups = new Set(sortedGroups.slice(0, topPercentile).map(entry => entry[0]));
        }

        // Build a map of groups to their numPeople values first (excluding Undefined)
        const groupNumPeopleMap = new Map();
        topGroups.forEach(groupName => {
            const numPeopleValues = [];
            rawData.forEach(d => {
                if (d.gname === groupName) {
                    const numPeople = (d.nperps === "-99.0" || !d.nperps) ? "Undefined" : d.nperps;
                    // Only count defined values
                    if (numPeople !== "Undefined" && !numPeopleValues.includes(numPeople)) {
                        numPeopleValues.push(numPeople);
                    }
                }
            });
            groupNumPeopleMap.set(groupName, numPeopleValues);
        });

        // Second pass: build hierarchy only with top X% groups
        rawData.forEach(d => {
            const groupName = d.gname || "Undefined";

            // Skip groups not in top X%
            if (!topGroups.has(groupName)) {
                return;
            }

            const numPeopleRaw = (d.nperps === "-99.0" || !d.nperps) ? "Undefined" : d.nperps;
            const gunType = d.weaptype1_txt || "Undefined";
            const successRate = d.success;

            // Handle success rate: only process if success === 1, skip if 0, warn if missing
            if (successRate === undefined || successRate === null || successRate === '') {
                console.warn('Missing success rate data for row:', d);
                return;
            }

            // Skip if success rate is 0
            if (successRate === 0 || successRate === '0') {
                return;
            }

            // Only process if success rate is 1
            if (successRate !== 1 && successRate !== '1') {
                return;
            }

            // Check if this group needs categorization
            const numPeopleValues = groupNumPeopleMap.get(groupName);
            const hasMoreThan5Children = numPeopleValues.length > 5;

            let numPeople = numPeopleRaw;
            if (hasMoreThan5Children && numPeopleRaw !== "Undefined") {
                // Create categories and map value to category
                const categories = this.createDynamicCategories(numPeopleValues);
                numPeople = this.getCategoryLabel(numPeopleRaw, categories);
            }

            // Get or create terrorist group
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
                    value: 1
                };
                gunTypeNode.children.push(successRateNode);
            } else {
                // Increment the count for this success rate
                successRateNode.value += 1;
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

        // Use the NoDataMessage component
        NoDataMessage.display(this.container.id, this.currentCountry);
    }

    /**
     * Update the country filter and re-render
     * @param {String|Array} country - New country filter (single country, array of countries, or null)
     * @param {String|Number} startYear - Start year for filtering (optional)
     * @param {String|Number} endYear - End year for filtering (optional)
     */
    updateFilters(country, startYear = null, endYear = null) {
        this.currentCountry = country;
        this.startYear = startYear;
        this.endYear = endYear;
        this.countries = this.normalizeCountries(country);
        this.data = this.filterByCountriesAndDate(this.rawData, this.countries, startYear, endYear);
        // Recalculate simplified hierarchy based on number of countries
        this.simplifiedHierarchy = this.countries && this.countries.length > 1;
        // Update slider visibility based on simplifiedHierarchy
        this.updateSliderVisibility();
        // Clear previous content (SVG and message)
        d3.select(this.container).html('');
        this.svg = null;
        this.render();
    }

    /**
     * Update slider visibility based on hierarchy type and group count
     */
    updateSliderVisibility() {
        const controlsContainer = document.querySelector('.groupType-controls');
        const slider = document.getElementById('groupType-slider');

        // Hide slider if multiple countries are selected
        if (this.simplifiedHierarchy) {
            if (controlsContainer) {
                controlsContainer.style.display = 'none';
            }
            return;
        }

        // For single country, check group count
        const uniqueGroups = new Set();
        this.data.forEach(d => {
            if (d.gname && d.gname !== "Unknown" && d.gname !== "Undefined") {
                uniqueGroups.add(d.gname);
            }
        });

        if (uniqueGroups.size < 5) {
            if (controlsContainer) {
                controlsContainer.style.display = 'none';
            }
        } else {
            if (controlsContainer) {
                controlsContainer.style.display = 'block';
            }
        }
    }

    /**
     * Update the group percentage and re-render
     * @param {Number} percentage - Percentage of groups to display (0-100)
     */
    updateGroupPercentage(percentage) {
        this.groupPercentage = Math.max(1, Math.min(100, percentage)); // Clamp between 1-100
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