// Import test function from compoentn/groupType.js
import { weaponUsed } from './components/weaponUsed.js';
import { renderHeatMap } from './components/hitMap.js';

$(document).ready(function () {
    // Load ajax components
    $('.hitMap-container').load('components/hitMap.html');
    $('.groupType-container').load('components/groupType.html');
    $('.weaponUsed-container').load('components/weaponUsed.html');
});

let isBottomNavVisible = false;
let dataCSV = d3.csv("./cleaned_data.csv");
dataCSV.then(function (data) {
    // Call function from groupType.js
    // weaponUsed(data, 'weapsubtype1_txt', null, ['2001', '2017']);
    // weaponUsed(data, 'weapsubtype1_txt', null, ['2001']);
    // weaponUsed(data, 'weapsubtype1_txt', null, []);
    weaponUsed(data, 'weapsubtype1_txt', ['Colombia'], ['2004', '2017']);


    // Alex
    let dates = [1971];
    let countries = ["France", "United Kingdom", "Germany"];
    renderHeatMap(data, countries, dates);
    // Fin Alex

    // Créer le tooltip pour les annotations
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip-map")
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("font-size", "14px")
        .style("opacity", 0);

    $(document).ready(function () {
        const width = document.getElementById("map").clientWidth;
        const height = document.getElementById("map").clientHeight;

        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Créer un groupe pour contenir la carte et appliquer le zoom dessus
        const g = svg.append("g");

        // Configurer le zoom
        const zoom = d3.zoom()
            .scaleExtent([1, 8])  // Limiter le zoom entre 1x et 8x
            .on("zoom", function (event) {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        const projection = d3.geoMercator()
            .scale(150)
            .translate([width / 2, height / 2]);
        const path = d3.geoPath()
            .projection(projection);

        // Load both world map and attack data
        Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
        ]).then(([world]) => {
            const countries = topojson.feature(world, world.objects.countries);
            const attackByCountry = d3.group(data, (d) => d.country_txt);
            const maxAttacks = d3.max(data, d => +d.nkill);
            const colorScale = d3.scaleSequential(d3.interpolateReds)
                .domain([0, maxAttacks]);

            g.selectAll("path")
                .data(countries.features)
                .join("path")
                .attr("d", path)
                .attr("fill", (d) => {
                    const countryName = d.properties.name;
                    const attacks = attackByCountry.get(countryName);
                    if (attacks) {
                        const totalAttacks = d3.sum(attacks, a => +a.nkill);
                        return colorScale(totalAttacks);
                    } else {
                        return "#e0e0e0";
                    }
                })
                .attr("stroke", "#999")
                .style("cursor", "pointer")
                .on("click", function (event, d) {
                    const currentBorder = d3.select(this).attr("stroke")
                    const newColor = currentBorder === "#999" ? "#6bFF6b" : "#999";
                    if (newColor === "#999") {
                        d3.select(this).classed("selected-country", false)
                    } else {
                        d3.select(this).classed("selected-country", true)
                    }
                    d3.select(this).attr("stroke", newColor);
                    updateView();
                    changeStateContainer();
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).transition()
                        .duration(200)
                        .attr("fill-opacity", 0.7);

                    const countryName = d.properties.name;
                    const attacks = attackByCountry.get(countryName);
                    let tooltipContent = `<strong>${countryName}</strong>`;

                    if (attacks) {
                        const totalKills = d3.sum(attacks, a => +a.nkill);
                        const totalAttacks = attacks.length;
                        tooltipContent += `<br/>Attaques: ${totalAttacks}`;
                        tooltipContent += `<br/>Victimes: ${totalKills}`;
                    } else {
                        tooltipContent += `<br/>Aucune donnée`;
                    }

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    tooltip.html(tooltipContent)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function (event, d) {
                    d3.select(this).transition()
                        .duration(50)
                        .attr("fill-opacity", 1);

                    tooltip.transition()
                        .duration(50)
                        .style("opacity", 0);
                });

        }).catch(error => {
            console.error("Error loading data:", error);
        });
    });

    // Mateus
    // const defaultCountry = ['France', 'Germany', 'Italy'];
    const defaultCountry = ['France']; // slider car beaucoup de groupes terroristes 
    // Define year range (set to null for no filtering)
    const startYear = "2010"; // "2010"
    const endYear = "2015";   // "2015"

    const sunburst = new SunburstDiagram('groupType-chart', data, defaultCountry, startYear, endYear);

    // Render initial chart
    sunburst.render();
    sunburst.updateSliderVisibility();

    changeStateContainer();
});

// Fonction pour changer la couleur d'un pays par son index
function changeCountryColor(countryIndex, color) {
    d3.selectAll("svg path").filter((d, i) => i === countryIndex)
        .attr("fill", color);
}

function updateView() {
    if (document.querySelectorAll(".selected-country").length > 0) {
        document.getElementById("bottom-nav").classList.remove("hidden");
    } else {
        document.getElementById("bottom-nav").classList.add("hidden");
    }
}


function changeStateContainer() {
    console.log(isBottomNavVisible);
    if (isBottomNavVisible) {
        $('#bottom-nav').show();
        isBottomNavVisible = false;
    } else {
        $('#bottom-nav').hide();
        isBottomNavVisible = true;
    }
}