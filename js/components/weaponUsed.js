const barplotLengthThreshold = 10;
const stackedBarplotLengthThreshold = 5;

/**
 * Render a bar chart showing weapon usage statistics.
 * 
 * @param {Array} data 
 * @param {string} type Can be "weaptype1_txt" or "weapsubtype1_txt" 
 * @param {Array} countries Optional array of country names to filter
 * @param {number} year Optional year to filter data
 */
export function weaponUsed(data, type = "weapsubtype1_txt", countries = null, year = null) {
    // Filter by year if provided
    let filteredData = data;
    if (year !== null) {
        filteredData = data.filter(d => d.iyear === year);
    }

    // let weaponStats = minifyDataBarChart(filteredData, type);
    // renderBarChart(weaponStats);

    console.log(filteredData);

    let weaponStatsPerCountry = minifyDataStackedBarChart(filteredData, type, countries);
    console.log(weaponStatsPerCountry);
    renderStackedBarChart(weaponStatsPerCountry);
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
    // Group data by country first
    let countriesData = d3.group(data, d => d.country_txt);

    // Convert to array and process each country
    let weaponStatsPerCountry = Array.from(countriesData).map(([country, attacks]) => {
        // Group attacks by weapon type for this country
        let weaponTypes = d3.group(attacks, d => d[type]);

        // Convert to object with weapon counts
        let weapons = {};
        weaponTypes.forEach((countAttacks, weapon) => {
            const weaponName = weapon || "Unknown";
            const totalKills = countAttacks.reduce((sum, d) => {
                const kills = parseInt(d.nkill) || 0;
                return sum + kills;
            }, 0);

            weapons[weaponName] = {
                count: countAttacks.length,
                kills: totalKills,
                weaponType: countAttacks[0].weaptype1_txt || "Unknown",
                weaponSubType: weaponName
            };
        });

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
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>Country:</strong> ${d.data.country}<br/>
                        <strong>Weapon Type:</strong> ${countryData.weaponType}<br/>
                        <strong>Weapon Sub Type:</strong> ${countryData.weaponSubType}<br/>
                        <strong>Attacks:</strong> ${countryData.count}<br/>
                        <strong>Kills:</strong> ${countryData.kills}
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

    // Add X axis (attacks)
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Number of Attacks");
}