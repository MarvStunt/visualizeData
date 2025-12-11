/**
 * Main Map Component
 * Displays a world map with terrorist attack data visualization
 */

class MainMap {
    constructor(containerId, data, onCountrySelect = null, startYear = null, endYear = null) {
        this.$container = $('#' + containerId);
        this.container = this.$container.length ? this.$container[0] : null;
        this.startYear = startYear;
        this.endYear = endYear;
        this.rawData = data;
        this.data = this.filterData(this.rawData, startYear, endYear);
        this.colorMetric = "attacks";
        this.onCountrySelect = onCountrySelect; 

        this.width = this.$container.width() || 800;
        this.height = this.$container.height() || 600;

        this.svg = null;
        this.g = null;
        this.zoom = null;
        this.projection = null;
        this.path = null;
        this.colorScale = null;
        this.attackByCountry = null;

        this.selectedCountries = [];
    }

    /**
     * Initialize and render the map
     */
    render() {
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.g = this.svg.append("g");
        this.setupZoom();

        this.projection = d3.geoMercator()
            .scale(150)
            .translate([this.width / 2, this.height / 2]);

        this.path = d3.geoPath().projection(this.projection);

        // Process data
        this.attackByCountry = d3.group(this.data, d => d.country_txt);
        const maxAttacks = d3.max(Array.from(this.attackByCountry.values()), attacks => attacks.length);
        this.colorScale = d3.scalePow()
            .exponent(0.5)
            .domain([0, maxAttacks])
            .range(["#fee5d9", "#a50f15"]);

        this.loadWorldMap();
        this.addLegend(maxAttacks);
    }

    /**
     * Filter data by year range
     * @param {Array} rawData - Array of data objects
     * @param {Number|null} startYear - Start year for filtering
     * @param {Number|null} endYear - End year for filtering
     * @returns {Array} Filtered data array
     */
    filterData(rawData, startYear = null, endYear = null) {
        let filteredData = rawData;

        if (startYear !== null || endYear !== null) {
            const start = startYear !== null ? parseInt(startYear) : null;
            const end = endYear !== null ? parseInt(endYear) : null;
        
            filteredData = filteredData.filter(d => {
                const year = parseInt(d.iyear);
                // If both years are provided, filter to range
                if (start !== null && year < start) {
                    return false;
                }
                if (end !== null && year > end) {
                    return false;
                }
                return true;
            })
        }
        return filteredData;
    }

    /**
     * Setup zoom behavior
     */
    setupZoom() {
        const self = this;
        this.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", function (event) {
                self.g.attr("transform", event.transform);
            });

        this.svg.call(this.zoom);
    }

    /**
     * Load world map data and render countries
     */
    loadWorldMap() {
        const self = this;
        Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        ]).then(([world]) => {
            const countries = topojson.feature(world, world.objects.countries);
            self.g.selectAll("path")
                .data(countries.features)
                .join("path")
                .attr("d", self.path)
                .attr("fill", d => self.getCountryFill(d))
                .attr("stroke", "#999")
                .style("cursor", "pointer")
                .on("click", function (event, d) {
                    self.handleCountryClick(event, d, this);
                }).on("mouseover", function (event, d) {
                    self.handleMouseOver(event, d, this);
                }).on("mousemove", function (event) {
                    self.handleMouseMove(event);
                }).on("mouseout", function (event, d) {
                    self.handleMouseOut(event, d, this);
                });

        }).catch(error => {
            console.error("Error loading map data:", error);
        });
    }

    /**
     * Get fill color for a country based on attack data
     * @param {Object} d - Country data
     * @returns {String} Color value
     */
    getCountryFill(d) {
        const countryName = d.properties.name;
        const attacks = this.attackByCountry.get(countryName);
        let value;
        if (attacks && attacks.length > 0) {
            if (this.colorMetric === "attacks") {
                value = attacks.length;
            } else {
                value = d3.sum(attacks, a => +a.nkill);
            }

            return this.colorScale(value);
        }
        return "#e0e0e0";
    }

    /**
     * Handle country click event
     * @param {Event} event - Click event
     * @param {Object} d - Country data
     * @param {Element} element - DOM element
     */
    handleCountryClick(event, d, element) {
        const currentBorder = d3.select(element).attr("stroke");
        const isSelected = currentBorder !== "#999";
        const newColor = isSelected ? "#999" : "#6bFF6b";
        const countryName = d.properties.name;
        console.log('Clicked country:', countryName);
        if (isSelected) {
            // Deselect country
            d3.select(element).classed("selected-country", false);
            this.selectedCountries = this.selectedCountries.filter(c => c !== countryName);
        } else {
            // Select country
            d3.select(element).classed("selected-country", true);
            this.selectedCountries.push(countryName);
        }

        d3.select(element).attr("stroke", newColor);

        // Trigger callback if provided
        if (this.onCountrySelect) {
            this.onCountrySelect(this.selectedCountries);
        }
    }

    /**
     * Handle mouse over event
     * @param {Event} event - Mouse event
     * @param {Object} d - Country data
     * @param {Element} element - DOM element
     */
    handleMouseOver(event, d, element) {
        d3.select(element).attr("fill-opacity", 0.7);
        const countryName = d.properties.name;
        const attacks = this.attackByCountry.get(countryName);
        
        const tooltipData = {
            title: countryName,
            items: []
        };

        if (attacks) {
            const totalKills = d3.sum(attacks, a => +a.nkill);
            const totalAttacks = attacks.length;
            tooltipData.items.push(
                { label: 'Attaques', value: totalAttacks.toLocaleString() },
                { label: 'Victimes', value: totalKills.toLocaleString() }
            );
        } else {
            tooltipData.items.push({ value: 'Aucune donnée' });
        }

        tooltipManager.show(tooltipData, event.pageX, event.pageY);
    }

    /**
     * Handle mouse move event
     * @param {Event} event - Mouse event
     */
    handleMouseMove(event) {
        tooltipManager.move(event.pageX, event.pageY);
    }

    /**
     * Handle mouse out event
     * @param {Event} event - Mouse event
     * @param {Object} d - Country data
     * @param {Element} element - DOM element
     */
    handleMouseOut(event, d, element) {
        d3.select(element).attr("fill-opacity", 1);
        tooltipManager.hide();
    }

    /**
     * Reset zoom to initial state
     */
    resetZoom() {
        this.svg.transition()
            .duration(600)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * Get currently selected countries
     * @returns {Array} Array of selected country names
     */
    getSelectedCountries() {
        return this.selectedCountries;
    }

    /**
     * Clear all country selections
     */
    clearSelection() {
        this.selectedCountries = [];
        this.g.selectAll("path")
            .classed("selected-country", false)
            .attr("stroke", "#999");

        if (this.onCountrySelect) {
            this.onCountrySelect(this.selectedCountries);
        }
    }

    /**
     * Update data and re-render
     * @param {Array} newData - New data array
     */
    updateData(newData) {
        this.data = newData;
        this.attackByCountry = d3.group(this.data, d => d.country_txt);
        
        // Calculate max value based on current metric
        let maxValue;
        if (this.colorMetric === "attacks") {
            maxValue = d3.max(Array.from(this.attackByCountry.values()), attacks => attacks.length);
        } else {
            maxValue = d3.max(Array.from(this.attackByCountry.values()), attacks => d3.sum(attacks, a => +a.nkill));
        }
        this.colorScale.domain([0, maxValue]);

        // Update country fills
        const self = this;
        this.g.selectAll("path")
            .attr("fill", d => self.getCountryFill(d));
        
        // Update legend with new max value
        this.updateLegend(maxValue);
    }

    /**
     * 
     * @param {Number} startYear 
     * @param  {Number} endYear 
     */
    updateFilters(startYear = null, endYear = null) {
        this.startYear = startYear;
        console.log(typeof this.endYear);
        this.endYear = endYear;
        this.data = this.filterData(this.rawData, this.startYear, this.endYear);
        this.updateData(this.data);
    }

    /**
     * Add legend to the map
     * @param {Number} maxAttacks - Maximum number of attacks for scale
     */
    addLegend(maxAttacks) {
        // Remove old legend if exists
        $('.map-legend').remove();

        // Create legend HTML
        const legendHTML = `
            <div class="map-legend">
                <div class="map-legend-title">Nombre d'attaques</div>
                <div class="map-legend-gradient"></div>
                <div class="map-legend-values">
                    <span>0</span>
                    <span>${maxAttacks.toLocaleString()}</span>
                </div>
            </div>
        `;

        // Add legend to map container
        this.$container.parent().append(legendHTML);
    }

    /**
     * Update legend with new max value
     * @param {Number} maxValue - New maximum value
     */
    updateLegend(maxValue) {
        // Remove old legend
        $('.map-legend').remove();

        // Determine title based on current metric
        const title = this.colorMetric === "attacks" ? "Nombre d'attaques" : "Nombre de victimes";

        // Create legend HTML
        const legendHTML = `
            <div class="map-legend">
                <div class="map-legend-title">${title}</div>
                <div class="map-legend-gradient"></div>
                <div class="map-legend-values">
                    <span>0</span>
                    <span>${maxValue.toLocaleString()}</span>
                </div>
            </div>
        `;

        // Add legend to map container
        this.$container.parent().append(legendHTML);
    }

    /**
     * 
     * @param {String} metric 
     */
    setColorMetric(metric) {
        this.colorMetric = metric;

        let maxValue;
        if (metric === "attacks") {
            maxValue = d3.max(Array.from(this.attackByCountry.values()), attacks => attacks.length);
        } else {
            maxValue = d3.max(Array.from(this.attackByCountry.values()), attacks => d3.sum(attacks, a => +a.nkill));
        }

        this.colorScale.domain([0, maxValue]);

        const self = this;
        this.g.selectAll("path")
            .attr("fill", d => self.getCountryFill(d));

        this.updateLegend(maxValue);
    }
}
