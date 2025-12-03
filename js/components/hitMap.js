// fonction qui rend un graphique Bar Chart selon le nombre d'attaques au fil du temps
export function renderHeatMap(data, countries, dates) {
    let chartContainer = d3.select('.hitMap-container');
    let containerWidth = chartContainer.node().clientWidth;
    let containerHeight = chartContainer.node().clientHeight;

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const innerHeight = Math.max(0, containerHeight - margin.top - margin.bottom);

    if (Array.isArray(countries) && countries.length > 0) {
        const countrySet = new Set(countries);
        data = data.filter(d => countrySet.has(d.country_txt));
    }

    // filtrer les données selon les dates fournies
    if (dates && dates.length === 2) {
        data = data.filter(d => +d.iyear >= dates[0] && +d.iyear <= dates[1]);

        if (data.length === 0) {
            d3.select('.hitMap-chart-container').selectAll('svg').remove();
            // afficher un message "No data available"
            // MARVINNNNNN
        } else {

            // grouper les données par année
            let attacksByYear = d3.group(data, d => d.iyear);
            let barData = Array.from(attacksByYear, ([year, attacks]) => {
                return { year: +year, attacks: attacks.length };
            }).sort((a, b) => a.year - b.year);

            d3.select('.hitMap-chart-container').selectAll('svg').remove();

            // créer le SVG
            let svg = d3.select('.hitMap-chart-container')
                .append('svg')
                .attr('width', containerWidth)
                .attr('height', containerHeight);

            let g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // échelles
            let xScale = d3.scaleBand()
                .domain(barData.map(d => d.year))
                .range([0, innerWidth])
                .padding(0.1);

            let yScale = d3.scaleLinear()
                .domain([0, d3.max(barData, d => d.attacks)])
                .nice()
                .range([innerHeight, 0]);

            // axes
            g.append('g')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(d3.axisBottom(xScale).tickValues(
                    barData.filter((d, i) => i % 5 === 0).map(d => d.year)));

            g.append('g').call(d3.axisLeft(yScale));

            // barres
            g.selectAll('.bar')
                .data(barData)
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', d => xScale(d.year))
                .attr('y', d => yScale(d.attacks))
                .attr('width', xScale.bandwidth())
                .attr('height', d => innerHeight - yScale(d.attacks))
                .attr('fill', '#d73027')
                .append('title')
                .text(d => `Year: ${d.year}\nAttacks: ${d.attacks}`);

            // label axe Y
            /*svg.append('text')
                .attr('x', margin.left)
                .attr('y', margin.top)
                .attr('fill', '#000')
                .attr('font-size', 12)
                .attr('text-anchor', 'middle')
                .text('Nombre d’attaques');*/
        }

    } else if (dates && dates.length === 1) {
        data = data.filter(d => +d.iyear === dates[0]);

        if (data.length === 0) {
            d3.select('.hitMap-chart-container').selectAll('svg').remove();
            // afficher un message "No data available"
            // MARVINNNNNN
        } else {
            // heatmap single year selected
            // grouper par mois
            let attacksByMonth = d3.group(data, d => d.imonth);
            let heatmapData = Array.from(attacksByMonth, ([month, attacks]) => {
                return { month: +month, attacks: attacks.length };
            }).sort((a, b) => a.month - b.month);

            d3.select('.hitMap-chart-container').selectAll('svg').remove();

            let svg = d3.select('.hitMap-chart-container')
                .append('svg')
                .attr('width', containerWidth)
                .attr('height', containerHeight);

            let g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            const cols = 4;
            const rows = 3;
            const cellWidth = innerWidth / cols;
            const cellHeight = innerHeight / rows;

            const minAttacks = d3.min(heatmapData, d => d.attacks) || 0;
            const maxAttacks = d3.max(heatmapData, d => d.attacks) || 1;

            const color = d3.scaleSequential()
                .domain([minAttacks, maxAttacks])
                .interpolator(d3.interpolateRgb("yellow", "red"));

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const cells = g.selectAll('.cell')
                .data(heatmapData)
                .enter()
                .append('g')
                .attr('class', 'cell');

            cells.append('rect')
                .attr('x', d => ((d.month - 1) % cols) * cellWidth)
                .attr('y', d => Math.floor((d.month - 1) / cols) * cellHeight)
                .attr('width', cellWidth - 4)
                .attr('height', cellHeight - 4)
                .attr('fill', d => color(d.attacks))
                .attr('rx', 4)
                .attr('ry', 4)
                .append('title')
                .text(d => `Month: ${monthNames[d.month - 1]}\nAttacks: ${d.attacks}`);

            // label des mois dans le centre des boxs
            cells.append('text')
                .attr('x', d => ((d.month - 1) % cols) * cellWidth + (cellWidth - 4) / 2)
                .attr('y', d => Math.floor((d.month - 1) / cols) * cellHeight + (cellHeight - 4) / 2 + 4)
                .attr('text-anchor', 'middle')
                .attr('font-size', 12)
                .attr('fill', d => d.attacks > maxAttacks / 2 ? '#fff' : '#000')
                .text(d => monthNames[d.month - 1]);

            const legendWidth = Math.min(150, innerWidth);
            const legendX = innerWidth - legendWidth;
            const legendY = innerHeight + 10;

            const legendScale = d3.scaleLinear().domain([0, maxAttacks]).range([0, legendWidth]);
            const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('d'));

            const defs = svg.append('defs');
            const gradId = 'legend-gradient';
            const gradient = defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');

            gradient.append('stop').attr('offset', '0%').attr('stop-color', color(minAttacks));
            gradient.append('stop').attr('offset', '100%').attr('stop-color', color(maxAttacks));

            const legendG = svg.append('g')
                .attr('transform', `translate(${margin.left + legendX}, ${margin.top + legendY})`);

            legendG.append('rect')
                .attr('width', legendWidth)
                .attr('height', 12)
                .style('fill', `url(#${gradId})`);

            legendG.append('g')
                .attr('transform', `translate(0, 12)`)
                .call(legendAxis);
        }
    }
}