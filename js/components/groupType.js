/**
 * Sunburst Diagram Component
 * Data hierarchy: Terrorist group -> number of people implicated -> target type -> success rate
 * Extends BaseChart for common chart functionality
 */

class SunburstDiagram extends BaseChart {
    constructor(containerId, data, country = null, startYear = null, endYear = null) {
        // Initialize parent class
        super(containerId, 'groupType-chart-container', data, country, startYear, endYear);
        
        // SunburstDiagram specific properties
        this.currentCountry = country;
        // Determine if simplified hierarchy should be used based on number of countries in filtered data
        this.simplifiedHierarchy = this.countries && this.countries.length > 1;
        this.groupPercentage = 10;
        
        // Zoom state tracking
        this.zoomedNode = null;
        this.zoomHistory = [];
        
        // Recalculate radius after parent dimensions are set
        this.radius = Math.min(this.width, this.height) / 2;
    }

    /**
     * Filter data by country and date range (specific to SunburstDiagram needs)
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
     * Filter data by country (for single country filtering)
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
     * Supports percentage-based filtering with "Others" category for grouped attacks
     * @param {Array} rawData - Array of data objects from CSV
     * @returns {Object} Hierarchical object for d3.hierarchy
     */
    buildSimplifiedHierarchy(rawData) {
        const root = {
            children: []
        };

        const countryMap = new Map();

        // First pass: count occurrences of each group to enable percentage filtering
        const groupCounts = new Map();
        rawData.forEach(d => {
            if (d.gname === "Unknown" || d.gname === "Undefined") {
                return;
            }
            const groupName = d.gname || "Undefined";
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

        // Second pass: group data by country -> group -> success
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

            // Determine if this group should be shown individually or grouped as "Others"
            const displayGroupName = topGroups.has(groupName) ? groupName : "Others";

            // Get or create group node within country
            let groupNode = countryNode.children.find(g => g.name === displayGroupName);
            if (!groupNode) {
                groupNode = {
                    name: displayGroupName,
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
     * Build full hierarchy: Terrorist Group -> numPeople -> targetType -> success
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
            const targetType = d.targtype1_txt || "Undefined";
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

            // Get or create targetType within numPeople
            let targetTypeNode = numPeopleNode.children.find(g => g.name === targetType);
            if (!targetTypeNode) {
                targetTypeNode = {
                    name: targetType,
                    children: []
                };
                numPeopleNode.children.push(targetTypeNode);
            }

            // Get or create successRate within targetType
            let successRateNode = targetTypeNode.children.find(s => s.name === successRate);
            if (!successRateNode) {
                successRateNode = {
                    name: successRate,
                    value: 1
                };
                targetTypeNode.children.push(successRateNode);
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
        // If no countries selected, show a message to select countries
        if (!this.countries || this.countries.length === 0) {
            this.displaySelectCountryMessage('Terrorist Groups', 'Select one or more countries on the map to view terrorist group activity');
            return;
        }

        // Check if there is data to display
        if (this.data.length === 0) {
            this.displayNoDataMessage();
            return;
        }

        // Build hierarchy
        const hierarchyData = this.buildHierarchy(this.data);

        // Create SVG with D3
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'sunburst-svg');

        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')

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
            .attr('class', 'slice')
            .style('opacity', d => {
                // If zoomed, only show children of the zoomed node
                if (this.zoomedNode) {
                    // Show the zoomed node and its descendants
                    return d === this.zoomedNode || d.parent === this.zoomedNode || 
                           (d.ancestors && d.ancestors().includes(this.zoomedNode)) ? 1 : 0;
                }
                return 1;
            })
            .style('pointer-events', d => {
                if (this.zoomedNode) {
                    return d === this.zoomedNode || d.parent === this.zoomedNode || 
                           (d.ancestors && d.ancestors().includes(this.zoomedNode)) ? 'auto' : 'none';
                }
                return 'auto';
            });

        // Capture 'this' context for use in event handlers
        const self = this;

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
                d3.select(this).style('opacity', 1)
                // Calculate tooltip position relative to SVG
                const svgRect = self.svg.node().getBoundingClientRect();
                const tooltipX = svgRect.left + event.offsetX;
                const tooltipY = svgRect.top + event.offsetY;
                
                tooltipManager.show({
                    title: d.data.name,
                    items: [
                        {label: "Count", value: d.value}
                    ]
                }, tooltipX, tooltipY);
            })
            .on('mouseout', function () {
                tooltipManager.hide();
            });


        // Add click handler for zooming
        slices.on('click', (event, d) => this.clicked(event, d, arc, hierarchy));

        // Show zoom controls if zoomed
        if (this.zoomedNode) {
            this.showZoomControls();
        }
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
        this.data = this.filterData(this.rawData, this.countries, startYear, endYear);
        // Recalculate simplified hierarchy based on number of countries
        this.simplifiedHierarchy = this.countries && this.countries.length > 1;
        // Update slider visibility based on simplifiedHierarchy
        this.updateSliderVisibility();
        // Reset zoom state when filters change
        this.zoomedNode = null;
        this.zoomHistory = [];
        // Clear zoom controls
        $('#sunburst-zoom-controls').remove();
        // Clear previous content (SVG and message)
        d3.select(this.container).html('');
        this.svg = null;
        this.render();
    }

    /**
     * Update slider visibility based on hierarchy type and group count
     * Show slider for both single and multiple countries if there are enough groups
     */
    updateSliderVisibility() {
        const $controlsContainer = $('.groupType-controls');
        const $slider = $('#groupType-slider');
        const $percentageDisplay = $('#groupType-percentage');

        // Count unique groups across all selected countries
        const uniqueGroups = new Set();
        this.data.forEach(d => {
            if (d.gname && d.gname !== "Unknown" && d.gname !== "Undefined") {
                uniqueGroups.add(d.gname);
            }
        });

        // Show slider if there are 5 or more unique groups
        if (uniqueGroups.size >= 5) {
            $controlsContainer.show();

            // Setup slider event listener using jQuery
            $slider.off('input').on('input', (e) => {
                const percentage = parseInt(e.target.value);
                $percentageDisplay.text(percentage + '%');
                this.updateGroupPercentage(percentage);
            });
        } else {
            // Hide slider if less than 5 groups
            $controlsContainer.hide();
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
    /**
     * Handle click on sunburst slice for zooming
     * @param {Event} event - Click event
     * @param {Object} d - Data object (node)
     * @param {Function} arc - D3 arc generator
     * @param {Object} hierarchy - D3 hierarchy object
     */
    clicked(event, d, arc, hierarchy) {
        // Don't zoom on root
        if (!d.parent) return;

        // Prevent event propagation
        event.stopPropagation();

        // Track zoom state
        this.zoomHistory.push(this.zoomedNode);
        this.zoomedNode = d;

        // Calculate new angles and radii for the zoom
        const xScale = d3.scaleLinear()
            .domain([d.x0, d.x1])
            .range([0, 2 * Math.PI]);

        const yScale = d3.scaleLinear()
            .domain([d.y0, this.radius])
            .range([0, this.radius]);

        // Get arc generator for zoom
        const arcGenerator = d3.arc()
            .startAngle(node => xScale(node.x0))
            .endAngle(node => xScale(node.x1))
            .innerRadius(node => yScale(node.y0))
            .outerRadius(node => yScale(node.y1));

        // Update paths immediately (no animation)
        this.g.selectAll('path.arc')
            .attr('d', arcGenerator);

        // Update opacity to show/hide nodes based on zoom
        this.g.selectAll('g.slice')
            .style('opacity', node => {
                // Show current node and its direct children
                if (node === d) return 1;
                if (node.parent === d) return 1;
                
                // Check if node is a descendant of zoomed node
                let current = node;
                while (current.parent) {
                    if (current.parent === d) {
                        return 1;
                    }
                    current = current.parent;
                }
                return 0;
            })
            .style('pointer-events', node => {
                if (node === d) return 'auto';
                if (node.parent === d) return 'auto';
                
                let current = node;
                while (current.parent) {
                    if (current.parent === d) {
                        return 'auto';
                    }
                    current = current.parent;
                }
                return 'none';
            });

        // Show zoom controls
        this.showZoomControls();
    }

    /**
     * Show controls for zoom navigation
     */
    showZoomControls() {
        let $controls = $('#sunburst-zoom-controls');
        if ($controls.length === 0) {
            // Find the SVG container parent
            const $svgContainer = $(this.svg.node()).parent();
            
            $controls = $('<div>')
                .attr('id', 'sunburst-zoom-controls')
                .appendTo($svgContainer);
        }

        // Clear previous content
        $controls.html('');

        // Add back button if there's zoom history
        if (this.zoomHistory.length > 0) {
            const $backBtn = $('<button>')
                .text('← Back')
                .on('click', () => this.zoomOut());

            $controls.append($backBtn);
        } else {
            $controls.hide();
        }
    }

    /**
     * Zoom out to parent level or reset zoom
     */
    zoomOut() {
        this.zoomedNode = this.zoomHistory.pop();

        // Remove zoom controls
        $('#sunburst-zoom-controls').remove();

        // Re-render the chart with the new zoom level
        // Instead of completely clearing, we could animate the transition
        // For now, we'll re-render
        d3.select(this.container).html('');
        this.svg = null;
        this.render();
    }
}
