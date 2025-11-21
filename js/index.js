// Import test function from compoentn/groupType.js
import { test } from './components/groupType.js';

$(document).ready(function() {
    // Load ajax components
    $('.hitMap-container').load('components/hitMap.html');
    $('.groupType-container').load('components/groupType.html');
    $('.weaponUsed-container').load('components/weaponUsed.html');
});

let dataCSV = d3.csv("./cleaned_data.csv");

// Call function from groupType.js
test(dataCSV);