const barplotLengthThreshold = 10;
const stackedBarplotLengthThreshold = 5;
const topWeaponsCount = 4; // Show only top 4 weapons + Other
const pieChartWeaponsLimit = 8; // Limit for pie chart weapons

/**
 * Render a bar chart showing weapon usage statistics.
 * 
 * @param {Array} data 
 * @param {string} type Can be "weaptype1_txt" or "weapsubtype1_txt" 
 * @param {Array} countries Optional array of country names to filter
 * @param {Array|null} years Optional year filter:
 *   - null or [] : all data (no filter)
 *   - [2020] : only year 2020
 *   - [2020, 2025] : range from 2020 to 2025 (inclusive)
 */
export function weaponUsed(data, type = "weapsubtype1_txt", countries = null, years = null) {
    // Filter by year(s) if provided
    let filteredData = data;
    if (years !== null && Array.isArray(years) && years.length > 0) {
        if (years.length === 1) {
            filteredData = data.filter(d => parseInt(d.iyear) === years[0]);
        } else if (years.length === 2) {
            const startYear = Math.min(years[0], years[1]);
            const endYear = Math.max(years[0], years[1]);
            filteredData = data.filter(d => {
                const year = parseInt(d.iyear);
                return year >= startYear && year <= endYear;
            });
        }
    }

    // Clear previous charts
    clearCharts();

    // If single country selected, show pie chart
    if (countries && Array.isArray(countries) && countries.length === 1) {
        console.log("Single country selected for pie chart:", countries[0]);
        const countryData = filteredData.filter(d => d.country_txt === countries[0]);
        const weaponStats = minifyDataPieChart(countryData, type);
        renderPieChart(weaponStats, countries[0]);
    } else {
        // Multiple countries or no filter: show stacked bar chart
        renderStackedBarChart(minifyDataStackedBarChart(filteredData, type, countries));
    }
}

/**
 * Clear all charts from container
 */
function clearCharts() {
    d3.select(".weaponUsed-container svg").remove();
    d3.select(".weaponUsed-container .stacked-chart").remove();
    d3.select(".weaponUsed-container .pie-chart").remove();
    d3.selectAll(".weapon-tooltip").remove();
}

/**
 * Minify data for pie chart (single country)
 * 
 * @param {Array} data - Filtered data for single country
 * @param {string} type - Can be "weaptype1_txt" or "weapsubtype1_txt"
 * @returns {Array} - Array of weapon stats
 */
function minifyDataPieChart(data, type = "weapsubtype1_txt") {
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
    if (weaponStats.length > pieChartWeaponsLimit) {
        const topWeapons = weaponStats.slice(0, pieChartWeaponsLimit);
        const otherWeapons = weaponStats.slice(pieChartWeaponsLimit);
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
 * Render pie chart for single country
 * 
 * @param {Array} data - Weapon stats array
 * @param {string} countryName - Name of the country
 */
function renderPieChart(data, countryName) {
    const container = d3.select(".weaponUsed-container");
    const containerWidth = container.node().clientWidth;
    const containerHeight = container.node().clientHeight;
    const margin = 40;
    const radius = Math.min(containerWidth, containerHeight) / 2 - margin;

    // Create SVG
    const svg = container.append("svg")
        .attr("class", "pie-chart")
        .attr("width", containerWidth).attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2})`);

    const colorScale = d3.scaleOrdinal().domain(data.map(d => d.weapon)).range(d3.schemeSet3);
    const pie = d3.pie().value(d => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 10);

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "weapon-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Create pie slices
    const slices = svg.selectAll(".slice").data(pie(data)).enter().append("g").attr("class", "slice");

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
            tooltip.style("opacity", 1)
                .html(`
                    <strong>Weapon Type:</strong> ${d.data.weaponType}<br/>
                    <strong>Weapon Sub Type:</strong> ${d.data.weaponSubType}<br/>
                    <strong>Attacks:</strong> ${formatNumber(d.data.count)}<br/>
                    <strong>Kills:</strong> ${formatNumber(d.data.kills)}<br/>
                    <strong>Success Rate:</strong> ${d.data.successRate}%
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("d", arc);

            tooltip.style("opacity", 0);
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
    svg.append("text")
        .attr("x", 0)
        .attr("y", -containerHeight / 2 + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(`Weapon Usage in ${countryName}`);
}

/**
 * Minify data to get weapon usage statistics.
 * 
 * @param {Array} data 
 * @param {string} type Can be "weaptype1_txt" or "weapsubtype1_txt" 
 * @returns 
 */
function minifyDataBarChart(data, type = "weapsubtype1_txt") {
    // Group data by weapon type and count attacks
    let weaponTypes = d3.group(data, d => d[type]);
    console.log(weaponTypes);

    // Convert to array of objects {weapon: string, count: number}
    let weaponStats = Array.from(weaponTypes).map(([weapon, attacks]) => ({
        weapon: weapon || "Unknown",
        count: attacks.length
    }));

    // Sort by count descending
    weaponStats.sort((a, b) => b.count - a.count);
    console.log(weaponStats);

    // Only keep top weapons, else group under "Other"
    if (weaponStats.length > barplotLengthThreshold) {
        let topWeapons = weaponStats.slice(0, barplotLengthThreshold);
        let otherCount = weaponStats.slice(barplotLengthThreshold).reduce((sum, w) => sum + w.count, 0);
        topWeapons.push({ weapon: "Other", count: otherCount });
        weaponStats = topWeapons;
    }

    // Remove "Unknown" prefix if it's not the only text
    weaponStats = weaponStats.map(w => ({
        weapon: w.weapon === "Unknown" ? w.weapon : w.weapon.replace("Unknown ", ""),
        count: w.count
    }));

    // Re-sort after cleaning (Other should be sorted by count)
    weaponStats.sort((a, b) => b.count - a.count);

    return weaponStats;
}

/**
 *  Render bar chart using D3.js
 * 
 * @param {Array} data 
 */
function renderBarChart(data) {
    // Get container dimensions
    const container = d3.select(".weaponUsed-container");
    const containerWidth = container.node().clientWidth;
    const containerHeight = container.node().clientHeight;

    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Clear previous chart if exists
    d3.select(".weaponUsed-container svg").remove();

    // Create SVG
    const svg = d3.select(".weaponUsed-container")
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.weapon))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);

    // Create color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add bars
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.weapon))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.count))
        .attr("fill", (d, i) => color(i));

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Weapon Type");

    // Rotate X axis labels and add truncation with tooltip
    svg.selectAll(".tick text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .text(d => {
            const maxLength = 15;
            return d.length > maxLength ? d.substring(0, maxLength) + "..." : d;
        })
        .append("title")
        .text(d => d);

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(d3.max(data, d => d.count) / 20000))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Number of Attacks");

    // Add value labels on bars
    svg.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.weapon) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.count) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .text(d => d.count);
}

/**
 * Minify data to get weapon usage statistics per country.
 * Structure: [{country: string, weapons: {[weaponType]: count}}, ...]
 * 
 * @param {Array} data 
 * @param {string} type Can be "weaptype1_txt" or "weapsubtype1_txt" 
 * @param {Array} countries Optional array of country names to filter
 * @returns 
 */
function minifyDataStackedBarChart(data, type = "weapsubtype1_txt", countries = null) {
    // First, find the top 4 weapon types globally
    let globalWeaponCounts = d3.group(data, d => d[type]);
    let weaponRanking = Array.from(globalWeaponCounts).map(([weapon, attacks]) => ({
        weapon: weapon || "Unknown",
        count: attacks.length
    }));

    weaponRanking.sort((a, b) => b.count - a.count);
    const topWeapons = weaponRanking.slice(0, topWeaponsCount).map(w => w.weapon);

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
        // Sort by total attacks descending and keep only top 15 countries
        weaponStatsPerCountry.sort((a, b) => b.total - a.total);
        if (weaponStatsPerCountry.length > stackedBarplotLengthThreshold) {
            weaponStatsPerCountry = weaponStatsPerCountry.slice(0, stackedBarplotLengthThreshold);
        }
    }

    return weaponStatsPerCountry;
}

/**
 * Render stacked bar chart showing weapon usage per country
 * 
 * @param {Array} data 
 */
function renderStackedBarChart(data) {
    // Get container dimensions
    const container = d3.select(".weaponUsed-container");
    const containerWidth = container.node().clientWidth;
    const containerHeight = container.node().clientHeight;

    const margin = { top: 20, right: 100, bottom: 60, left: 100 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Clear previous stacked chart if exists
    d3.select(".weaponUsed-container .stacked-chart").remove();

    // Create SVG
    const svg = d3.select(".weaponUsed-container")
        .append("svg")
        .attr("class", "stacked-chart")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Get all unique weapons across all countries
    const allWeapons = new Set();
    data.forEach(d => {
        Object.keys(d.weapons).forEach(w => allWeapons.add(w));
    });
    const weaponsArray = Array.from(allWeapons);

    // Create color scale for weapons
    const colorScale = d3.scaleOrdinal()
        .domain(weaponsArray)
        .range(d3.schemeSet3);

    // Create scales - INVERTED: Y for countries, X for attacks
    const yScale = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, height])
        .padding(0.2);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range([0, width]);

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

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Create groups for each weapon type
    const groups = svg.selectAll("g.weapon-group")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "weapon-group")
        .attr("fill", d => colorScale(d.key));

    // Add rectangles for each segment - HORIZONTAL BARS
    groups.selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("y", d => yScale(d.data.country)).attr("x", d => xScale(d[0]))
        .attr("width", d => xScale(d[1]) - xScale(d[0]))
        .attr("height", yScale.bandwidth())
        .on("mouseover", function (event, d) {
            const weaponName = d3.select(this.parentNode).datum().key;
            const countryData = d.data.weaponsData[weaponName];

            if (countryData) {
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>Country:</strong> ${d.data.country}<br/>
                        <strong>Weapon Type:</strong> ${countryData.weaponType}<br/>
                        <strong>Weapon Sub Type:</strong> ${countryData.weaponSubType}<br/>
                        <strong>Attacks:</strong> ${countryData.count}<br/>
                        <strong>Kills:</strong> ${countryData.kills}<br/>
                        <strong>Success Rate:</strong> ${countryData.successRate}%
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            }
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    // Add Y axis (countries)
    svg.append("g")
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
    svg.append("g")
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