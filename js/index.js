// Global variables to store component instances
let heatmap = null;
let sunburst = null;
let weaponUsed = null;
let mainMap = null;

// Initialize theme manager
const themeManager = new ThemeManager();

let isBottomNavVisible = false;
let dataCSV = d3.csv("./cleaned_data.csv");

dataCSV.then(function (data) {
    $(document).ready(function () {
        // Load ajax components with callbacks to initialize after loading
        let componentsLoaded = 0;
        const totalComponents = 3;
        function checkAllComponentsLoaded() {
            componentsLoaded++;
            if (componentsLoaded === totalComponents) {
                initializeAllComponents(data);
            }
        }

        $('.heatMap-container').load('components/heatMap.html', checkAllComponentsLoaded);
        $('.groupType-container').load('components/groupType.html', checkAllComponentsLoaded);
        $('.weaponUsed-container').load('components/weaponUsed.html', checkAllComponentsLoaded);
    });

    // Function to initialize all components after HTML is loaded
    function initializeAllComponents(data) {
        // WeaponUsed
        weaponUsed = new WeaponUsed('weaponUsed-chart-container', data, 'weapsubtype1_txt', ['Colombia'], ['2004', '2017']);
        weaponUsed.render();

        // Alex - HeatMap
        const heatmapCountries = ["France", "United Kingdom", "Germany"];
        const heatmapStartYear = 1971;
        const heatmapEndYear = null; // null = single year mode (heatmap)

        heatmap = new HeatMap('heatMap-chart-container', data, heatmapCountries, heatmapStartYear, heatmapEndYear);
        heatmap.render();
        // Fin Alex

        // Mateus - Sunburst
        const defaultCountry = ['France'];
        const startYear = "2010";
        const endYear = "2015";

        sunburst = new SunburstDiagram('groupType-chart', data, defaultCountry, startYear, endYear);
        sunburst.render();
        sunburst.updateSliderVisibility();
        // Fin Mateus

        changeStateContainer();

        // Initialize Main Map
        mainMap = new MainMap('map', data, function(selectedCountries) {
            // Callback when country selection changes
            changeStateContainer();
        });
        mainMap.render();
    }
});

// Fonction pour changer la couleur d'un pays par son index
function changeCountryColor(countryIndex, color) {
    d3.selectAll("svg path").filter((d, i) => i === countryIndex)
        .attr("fill", color);
}

function updateView() {
    if ($('.selected-country').length > 0) {
        $('#bottom-nav').removeClass('hidden');
    } else {
        $('#bottom-nav').addClass('hidden');
    }
}


function changeStateContainer() {
    console.log(isBottomNavVisible);
    if (isBottomNavVisible) {
        $('#bottom-nav').show();
        $('#black-filter').show();
        isBottomNavVisible = false;
    } else {
        $('#bottom-nav').hide();
        $('#black-filter').hide();
        isBottomNavVisible = true;
    }
}