// Global variables to store component instances
let heatmap = null;
let sunburst = null;
let weaponUsed = null;
let mainMap = null;
let filterCard = null;

// Global data reference
let globalData = null;

// Current filter state
let currentFilters = {
    countries: [],
    startYear: null,
    endYear: null
};

// Initialize theme manager
const themeManager = new ThemeManager();

// Track if bottom nav is visible
let isBottomNavVisible = false;
let dataCSV = d3.csv("./cleaned_data.csv");

dataCSV.then(function (data) {
    // Store data globally
    globalData = data;

    $(document).ready(function () {
        // Load ajax components with callbacks to initialize after loading
        let componentsLoaded = 0;
        const totalComponents = 4;
        function checkAllComponentsLoaded() {
            componentsLoaded++;
            if (componentsLoaded === totalComponents) {
                initializeApp(data);
            }
        }

        $('.filter-card-container').load('components/filterCard.html', checkAllComponentsLoaded);
        $('.heatMap-container').load('components/heatMap.html', checkAllComponentsLoaded);
        $('.groupType-container').load('components/groupType.html', checkAllComponentsLoaded);
        $('.weaponUsed-container').load('components/weaponUsed.html', checkAllComponentsLoaded);
    });

    // Function to initialize the app (called once at startup)
    function initializeApp(data) {
        // Initialize FilterCard
        const filters = [
            { label: 'Terrorist Groups', color: '#FF6B6B', value: 'groups' },
            { label: 'Weapons', color: '#4ECDC4', value: 'weapons' },
            { label: 'Attack Types', color: '#FFE66D', value: 'attackTypes' }
        ];

        filterCard = new FilterCard('filter-card', filters, function (filterState) {
            console.log('Filter state changed:', filterState);
            
            // Update current filters with year range
            currentFilters.startYear = filterState.yearRange.min;
            currentFilters.endYear = filterState.yearRange.max;
            
            // Update components with current filters and selected countries
            updateComponents(data, currentFilters.countries, currentFilters.startYear, currentFilters.endYear);
        });

        // Initialize Main Map (only once, with callback for country selection)
        mainMap = new MainMap('map', data, function (selectedCountries) {
            // Update current filters with selected countries
            currentFilters.countries = selectedCountries;

            // Update all other components with new country selection
            updateComponents(data, selectedCountries, currentFilters.startYear, currentFilters.endYear);

            // Show bottom nav when a country is selected (if not already visible)
            if (selectedCountries.length > 0 && !isBottomNavVisible) {
                showBottomNav();
            }
        });
        mainMap.render();

        // Initialize other components with default values
        currentFilters.startYear = 1970;
        currentFilters.endYear = 2017;
        initializeComponents(data, currentFilters.countries, currentFilters.startYear, currentFilters.endYear);

        // Hide loader after all components are loaded
        hideLoader();

        // Initially hide the bottom nav
        hideBottomNav();

        // Add keyboard event listener for Escape key
        setupKeyboardEvents();
    }

    // Function to initialize components (called once at startup)
    function initializeComponents(data, countries, startYear, endYear) {
        // WeaponUsed
        weaponUsed = new WeaponUsed('weaponUsed-chart-container', data, 'weapsubtype1_txt', countries, startYear, endYear);
        weaponUsed.render();

        // HeatMap
        heatmap = new HeatMap('heatMap-chart-container', data, countries, startYear, endYear);
        heatmap.render();

        // Sunburst
        sunburst = new SunburstDiagram('groupType-chart', data, countries, startYear, endYear);
        sunburst.render();
        sunburst.updateSliderVisibility();
    }

    // Function to update components when filters change (countries, years)
    function updateComponents(data, countries, startYear, endYear) {
        console.log('Updating components with:', { countries, startYear, endYear });

        if (mainMap) {
            mainMap.updateFilters(startYear, endYear);
        }

        // Update WeaponUsed
        if (weaponUsed) {
            weaponUsed.updateFilters(countries, startYear, endYear);
        }

        // Update HeatMap
        if (heatmap) {
            heatmap.updateFilters(countries, startYear, endYear);
        }

        // Update Sunburst
        if (sunburst) {
            sunburst.updateFilters(countries, startYear, endYear);
        }
    }
});

// Function to hide the loader
function hideLoader() {
    const $loader = $('#loader');
    $loader.addClass('hidden');
}

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

// Function to show the bottom navigation panel
function showBottomNav() {
    $('#bottom-nav').slideDown(300);
    $('#black-filter').fadeIn(300);
    isBottomNavVisible = true;
}

// Function to hide the bottom navigation panel
function hideBottomNav() {
    $('#bottom-nav').slideUp(300);
    $('#black-filter').fadeOut(300);
    isBottomNavVisible = false;
}

// Function to toggle the bottom navigation panel
function toggleBottomNav() {
    if (isBottomNavVisible) {
        hideBottomNav();
    } else {
        showBottomNav();
    }
}

// Setup keyboard events (Escape to close)
function setupKeyboardEvents() {
    $(document).on('keydown', function (event) {
        // Check if Escape key was pressed
        if (event.key === 'Escape' || event.keyCode === 27) {
            if (isBottomNavVisible) {
                hideBottomNav();
            }
        }
    });
}

// Legacy function for compatibility
function changeStateContainer() {
    toggleBottomNav();
}

/**
 * Find the minimum and maximum year available in data for selected countries
 * @param {Array} data - Global dataset
 * @param {Array} countries - Array of selected country names
 * @returns {Object} - {minYear, maxYear} with data available
 */
function getAvailableYearRange(data, countries) {
    // If no countries selected, use full range
    if (!countries || countries.length === 0) {
        return { minYear: 1970, maxYear: 2017 };
    }

    // Filter data by selected countries
    const filteredData = data.filter(d => countries.includes(d.country_txt));
    
    if (filteredData.length === 0) {
        return { minYear: 1970, maxYear: 2017 };
    }

    // Find min and max years
    const years = filteredData.map(d => parseInt(d.iyear)).filter(y => !isNaN(y));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return { minYear, maxYear };
}