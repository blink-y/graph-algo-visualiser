import * as d3 from 'd3';

export function createLegend(zoomableGroup, nodes, colorScale) {
    const legend = zoomableGroup.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(10,40)');
  
    const groups = [...new Set(nodes.map(d => d.group))].sort((a, b) => a - b);
  
    // Create legend items
    legend.selectAll('g.legend-item')
      .data(groups)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0,${i * 30})`)
      .each(function(group) {
        const item = d3.select(this);
        
        // Color swatch
        item.append('rect')
          .attr('width', 25)
          .attr('height', 25)
          .attr('rx', 5)
          .attr('fill', colorScale(group));
        
        // Group label
        item.append('text')
          .attr('x', 40)
          .attr('y', 20)
          .style('font-size', '20px')
          .style('fill', '#333')
          .text(`K- ${group}`);
      });
  
    legend.append('text')
      .attr('y', -10)
      .style('font-weight', 'bold')
      .style('font-size', '20px')
      .text('K-Core Groups');
  }