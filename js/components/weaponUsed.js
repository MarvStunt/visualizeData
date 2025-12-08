/**
 * WeaponUsed Component
 * Displays weapon usage statistics - Pie chart for single country, Stacked bar chart for multiple countries
 */

class WeaponUsed {
    // Static configuration constants
    static BARPLOT_LENGTH_THRESHOLD = 10;
    static STACKED_BARPLOT_LENGTH_THRESHOLD = 5;
    static TOP_WEAPONS_COUNT = 4;
    static PIE_CHART_WEAPONS_LIMIT = 8;

    constructor(containerId, data, type = "weapsubtype1_txt", countries = null, startYear = null, endYear = null) {
        // Use jQuery selectors
        this.$container = $('#' + containerId).length ? $('#' + containerId) : $('.' + containerId);
        this.container = this.$container.length ? this.$container[0] : null;
        this.$chartContainer = $('.weaponUsed-chart-container');
        this.chartContainer = this.$chartContainer.length ? this.$chartContainer[0] : null;
        this.rawData = data;
        this.type = type;
        this.countries = this.normalizeCountries(countries);
        this.startYear = startYear;
        this.endYear = endYear;
        this.data = this.filterData(data, this.countries, [startYear, endYear]);
        this.margin = { top: 20, right: 100, bottom: 60, left: 100 };
        this.width = this.$chartContainer.width() || this.$container.width() || 400;
        this.height = this.$chartContainer.height() || this.$container.height() || 300;
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
     * @param {Array|null} years - Year filter array
     * @returns {Array} Filtered data
     */
    filterData(rawData, countries, startYear = null, endYear = null) {
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
     * Update dimensions based on container size
     */
    updateDimensions() {
        // Re-fetch container references in case they were loaded after constructor
        this.$chartContainer = $('.weaponUsed-chart-container');
        this.chartContainer = this.$chartContainer.length ? this.$chartContainer[0] : null;

        this.width = this.$chartContainer.width() || this.$container.width() || 400;
        this.height = this.$chartContainer.height() || this.$container.height() || 300;
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
     * Initialize and render the chart
     */
    render() {
        this.updateDimensions();
        this.clearCharts();

        console.log('Pays selectionné', this.countries);
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

        // If single country selected, show pie chart
        if (this.countries.length === 1) {
            const weaponStats = this.minifyDataPieChart(this.data, this.type);
            this.renderPieChart(weaponStats, this.countries[0]);
        } else {
            // Multiple countries: show stacked bar chart
            this.renderStackedBarChart(this.minifyDataStackedBarChart(this.data, this.type, this.countries));
        }
    }

    /**
     * Minify data for pie chart (single country)
     * @param {Array} data - Filtered data for single country
     * @param {string} type - Can be "weaptype1_txt" or "weapsubtype1_txt"
     * @returns {Array} - Array of weapon stats
     */
    minifyDataPieChart(data, type) {
        let weaponTypes = d3.group(data, d => d[type]);
        let weaponStats = Array.from(weaponTypes).map(([weapon, attacks]) => {
            const weaponName = weapon || "Unknown";
            const totalKills = attacks.reduce((sum, d) => {
                const kills = parseInt(d.nkill) || 0;
                return sum + kills;
            }, 0);
            const successCount = attacks.filter(d => parseInt(d.success) === 1).length;
            const successRate = attacks.length > 0 ? (successCount / attacks.length * 100).toFixed(1) : 0;

            return {
                weapon: weaponName,
                count: attacks.length,
                kills: totalKills,
                weaponType: attacks[0].weaptype1_txt || "Unknown",
                weaponSubType: weaponName,
                successRate: parseFloat(successRate),
                successCount: successCount
            };
        });

        // Sort by count descending
        weaponStats.sort((a, b) => b.count - a.count);

        // Keep only top weapons, group rest into "Other"
        if (weaponStats.length > WeaponUsed.PIE_CHART_WEAPONS_LIMIT) {
            const topWeapons = weaponStats.slice(0, WeaponUsed.PIE_CHART_WEAPONS_LIMIT);
            const otherWeapons = weaponStats.slice(WeaponUsed.PIE_CHART_WEAPONS_LIMIT);
            const otherStats = {
                weapon: "Other",
                count: otherWeapons.reduce((sum, w) => sum + w.count, 0),
                kills: otherWeapons.reduce((sum, w) => sum + w.kills, 0),
                weaponType: "Other",
                weaponSubType: "Other weapons combined",
                successRate: 0,
                successCount: otherWeapons.reduce((sum, w) => sum + w.successCount, 0)
            };

            // Calculate success rate for "Other"
            if (otherStats.count > 0) {
                otherStats.successRate = parseFloat((otherStats.successCount / otherStats.count * 100).toFixed(1));
            }

            topWeapons.push(otherStats);
            weaponStats = topWeapons;
        }

        return weaponStats;
    }

    /**
     * Minify data for stacked bar chart (multiple countries)
     * @param {Array} data - Filtered data
     * @param {string} type - Can be "weaptype1_txt" or "weapsubtype1_txt"
     * @param {Array} countries - Optional array of country names to filter
     * @returns {Array} - Array of weapon stats per country
     */
    minifyDataStackedBarChart(data, type, countries) {
        // First, find the top 4 weapon types globally
        let globalWeaponCounts = d3.group(data, d => d[type]);
        let weaponRanking = Array.from(globalWeaponCounts).map(([weapon, attacks]) => ({
            weapon: weapon || "Unknown",
            count: attacks.length
        }));

        weaponRanking.sort((a, b) => b.count - a.count);
        const topWeapons = weaponRanking.slice(0, WeaponUsed.TOP_WEAPONS_COUNT).map(w => w.weapon);

        // Group data by country first
        let countriesData = d3.group(data, d => d.country_txt);

        // Convert to array and process each country
        let weaponStatsPerCountry = Array.from(countriesData).map(([country, attacks]) => {
            // Group attacks by weapon type for this country
            let weaponTypes = d3.group(attacks, d => d[type]);

            // Convert to object with weapon counts - only top 4 + Other
            let weapons = {};
            let otherCount = 0;
            let otherKills = 0;
            let otherSuccessCount = 0;
            let otherTotalCount = 0;
            weaponTypes.forEach((countAttacks, weapon) => {
                const weaponName = weapon || "Unknown";
                const totalKills = countAttacks.reduce((sum, d) => {
                    const kills = parseInt(d.nkill) || 0;
                    return sum + kills;
                }, 0);

                const successCount = countAttacks.filter(d => parseInt(d.success) === 1).length;
                const successRate = countAttacks.length > 0 ? (successCount / countAttacks.length * 100).toFixed(1) : 0;
                if (topWeapons.includes(weaponName)) {
                    weapons[weaponName] = {
                        count: countAttacks.length,
                        kills: totalKills,
                        weaponType: countAttacks[0].weaptype1_txt || "Unknown",
                        weaponSubType: weaponName,
                        successRate: parseFloat(successRate),
                        successCount: successCount
                    };
                } else {
                    // Aggregate into "Other"
                    otherCount += countAttacks.length;
                    otherKills += totalKills;
                    otherSuccessCount += successCount;
                    otherTotalCount += countAttacks.length;
                }
            });

            // Add "Other" category if there are any
            if (otherCount > 0) {
                const otherSuccessRate = otherTotalCount > 0 ? (otherSuccessCount / otherTotalCount * 100).toFixed(1) : 0;
                weapons["Other"] = {
                    count: otherCount,
                    kills: otherKills,
                    weaponType: "Other",
                    weaponSubType: "Other weapons combined",
                    successRate: parseFloat(otherSuccessRate),
                    successCount: otherSuccessCount
                };
            }

            return {
                country: country || "Unknown",
                weapons: weapons,
                total: attacks.length
            };
        });

        // Filter by countries if provided
        if (countries && Array.isArray(countries) && countries.length > 0) {
            weaponStatsPerCountry = weaponStatsPerCountry.filter(d => countries.includes(d.country));
        } else {
            // Sort by total attacks descending and keep only top countries
            weaponStatsPerCountry.sort((a, b) => b.total - a.total);
            if (weaponStatsPerCountry.length > WeaponUsed.STACKED_BARPLOT_LENGTH_THRESHOLD) {
                weaponStatsPerCountry = weaponStatsPerCountry.slice(0, WeaponUsed.STACKED_BARPLOT_LENGTH_THRESHOLD);
            }
        }

        return weaponStatsPerCountry;
    }

    /**
     * Render pie chart for single country
     * @param {Array} data - Weapon stats array
     * @param {string} countryName - Name of the country
     */
    renderPieChart(data, countryName) {
        const containerWidth = this.width;
        const containerHeight = this.height;
        const margin = 40;
        const radius = Math.min(containerWidth, containerHeight) / 2 - margin;

        // Create SVG
        this.svg = d3.select(this.chartContainer)
            .append("svg")
            .attr("class", "pie-chart")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2})`);

        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.weapon))
            .range(d3.schemeSet3);

        const pie = d3.pie().value(d => d.count).sort(null);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
        const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 10);


        // Create pie slices
        // Capture 'this' context for event handlers
        const self = this;
        const slices = this.g.selectAll(".slice")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "slice");

        // Add paths
        slices.append("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(d.data.weapon))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("d", arcHover);

                const formatNumber = d3.format(",");
                tooltipManager.show({
                    title: d.data.weaponSubType,
                    items: [
                        { label: 'Type', value: d.data.weaponType },
                        { label: 'Attaques', value: formatNumber(d.data.count) },
                        { label: 'Victimes', value: formatNumber(d.data.kills) },
                        { label: 'Taux de réussite', value: d.data.successRate + '%' }
                    ]
                }, event.pageX, event.pageY);
            })
            .on("mousemove", function (event) {
                tooltipManager.move(event.pageX, event.pageY);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("d", arc);

                tooltipManager.hide();
            });

        // Add percentage labels on slices
        const totalCount = d3.sum(data, d => d.count);
        slices.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text(d => {
                const percentage = (d.data.count / totalCount * 100).toFixed(1);
                return percentage > 5 ? `${percentage}%` : "";
            });

        // Add title
        this.g.append("text")
            .attr("x", 0)
            .attr("y", -containerHeight / 2 + 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Weapon Usage in ${countryName}`);
    }

    /**
     * Render stacked bar chart showing weapon usage per country
     * @param {Array} data - Weapon stats per country
     */
    renderStackedBarChart(data) {
        const containerWidth = this.width;
        const containerHeight = this.height;

        const margin = { top: 20, right: 100, bottom: 60, left: 100 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // Create SVG
        this.svg = d3.select(this.chartContainer)
            .append("svg")
            .attr("class", "stacked-chart")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Get all unique weapons across all countries
        const allWeapons = new Set();
        data.forEach(d => {
            Object.keys(d.weapons).forEach(w => allWeapons.add(w));
        });
        const weaponsArray = Array.from(allWeapons);

        // Create color scale for weapons
        const colorScale = d3.scaleOrdinal().domain(weaponsArray).range(d3.schemeSet3);

        // Create scales - Y for countries, X for attacks
        const yScale = d3.scaleBand().domain(data.map(d => d.country)).range([0, height]).padding(0.2);
        const xScale = d3.scaleLinear().domain([0, d3.max(data, d => d.total)]).range([0, width]);

        // Prepare stacked data
        const stackedData = d3.stack()
            .keys(weaponsArray)
            (data.map(d => {
                let obj = { country: d.country, weaponsData: d.weapons };
                weaponsArray.forEach(w => {
                    if (d.weapons[w]) {
                        obj[w] = d.weapons[w].count;
                    } else {
                        obj[w] = 0;
                    }
                });
                return obj;
            }));


        // Create groups for each weapon type
        // Capture 'this' context for event handlers
        const self = this;
        const groups = this.g.selectAll("g.weapon-group")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("class", "weapon-group")
            .attr("fill", d => colorScale(d.key));

        // Add rectangles for each segment - HORIZONTAL BARS
        groups.selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("y", d => yScale(d.data.country))
            .attr("x", d => xScale(d[0]))
            .attr("width", d => xScale(d[1]) - xScale(d[0]))
            .attr("height", yScale.bandwidth())
            .on("mouseover", function (event, d) {
                const weaponName = d3.select(this.parentNode).datum().key;
                const countryData = d.data.weaponsData[weaponName];

                if (countryData) {
                    const formatNumber = d3.format(",");
                    tooltipManager.show({
                        title: countryData.weaponSubType,
                        items: [
                            { label: 'Pays', value: d.data.country },
                            { label: 'Type', value: countryData.weaponType },
                            { label: 'Attaques', value: formatNumber(countryData.count) },
                            { label: 'Victimes', value: formatNumber(countryData.kills) },
                            { label: 'Taux de réussite', value: countryData.successRate + '%' }
                        ]
                    }, event.pageX, event.pageY);
                }
            })
            .on("mousemove", function (event) {
                tooltipManager.move(event.pageX, event.pageY);
            })
            .on("mouseout", function () {
                tooltipManager.hide();
            });

        // Add Y axis (countries)
        this.g.append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .attr("transform", "rotate(-90)")
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text("Country");

        // Format numbers: 1000 -> 1k, 1000000 -> 1M
        const formatNumber = d3.format("~s");

        // Add X axis (attacks)
        this.g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).tickFormat(formatNumber))
            .append("text")
            .attr("x", width / 2)
            .attr("y", margin.bottom - 10)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text("Number of Attacks");
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
            $('<p>').css({ marginBottom: '8px', fontWeight: 'bold' }).text('Weapon Usage'),
            $('<p>').text('Select one or more countries on the map to view weapon statistics'),
            $('<p>').css({ fontSize: '12px', marginTop: '8px', color: '#aaa' }).text('1 country = Pie chart | Multiple countries = Bar chart')
        );

        this.$chartContainer.append($message);
    }

    /**
     * Update filters and re-render
     * @param {String|Array} countries - Country filter
     * @param {Array|null} years - Year filter
     * @param {String} type - Weapon type field to use
     */
    updateFilters(countries, startYear = null, endYear = null, type = null) {
        this.countries = this.normalizeCountries(countries);
        this.startYear = startYear;
        this.endYear = endYear;
        if (type) {
            this.type = type;
        }
        this.data = this.filterData(this.rawData, this.countries, this.startYear, this.endYear);

        // Clear and re-render
        this.clearCharts();
        this.svg = null;
        this.g = null;
        this.render();
    }

}