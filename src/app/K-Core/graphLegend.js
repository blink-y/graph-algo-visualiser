import * as d3 from 'd3';

export function createLegend(zoomableGroup, nodes, colorScale) {
    const legend = zoomableGroup.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20,20)');
  
    // Get unique sorted groups
    const groups = [...new Set(nodes.map(d => d.group))].sort((a, b) => a - b);
  
    // Create legend items
    legend.selectAll('g.legend-item')
      .data(groups)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0,${i * 25})`)
      .each(function(group) {
        const item = d3.select(this);
        
        // Color swatch
        item.append('rect')
          .attr('width', 18)
          .attr('height', 18)
          .attr('rx', 2) // Rounded corners
          .attr('fill', colorScale(group));
        
        // Group label
        item.append('text')
          .attr('x', 24)
          .attr('y', 14)
          .style('font-size', '12px')
          .style('fill', '#333')
          .text(`K- ${group}`);
      });
  
    // Optional: Add legend title
    legend.append('text')
      .attr('y', -10)
      .style('font-weight', 'bold')
      .text('K-Core Groups');
  }