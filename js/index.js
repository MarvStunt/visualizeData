// Import test function from compoentn/groupType.js
import { weaponUsed } from './components/weaponUsed.js';

$(document).ready(function () {
    // Load ajax components
    $('.hitmap-container').load('components/hitmap.html');
    $('.groupType-container').load('components/groupType.html');
    $('.weaponUsed-container').load('components/weaponUsed.html');
});

let dataCSV = d3.csv("./cleaned_data.csv");

dataCSV.then(function (data) {
    // Call function from groupType.js
    // weaponUsed(data, 'weapsubtype1_txt', null, ['2001', '2017']);
    // weaponUsed(data, 'weapsubtype1_txt', null, ['2001']);
    // weaponUsed(data, 'weapsubtype1_txt', null, []);
    weaponUsed(data, 'weapsubtype1_txt', ['Colombia'], []);
});