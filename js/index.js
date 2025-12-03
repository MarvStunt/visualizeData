import { renderHeatMap } from './components/hitMap.js';

$(document).ready(function() {
    // Load ajax components
    $('.hitMap-container').load('components/hitMap.html');
    $('.groupType-container').load('components/groupType.html');
    $('.weaponUsed-container').load('components/weaponUsed.html');
});

let dataCSV = d3.csv("./cleaned_data.csv");

let dates = [1971];

renderHeatMap(dataCSV,null, dates);