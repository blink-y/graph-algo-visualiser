import * as d3 from 'd3'

export function updateDensityVisualization(density) {
    const gauge = d3.select("#density-gauge");
  
    // Animate the width change
    gauge.transition()
      .duration(500)
      .style("width", `${density * 100}%`);
      
    // Update color based on density
    gauge.style("background", () => {
      if (density < 0.3) return "#4CAF50";  // Green for sparse
      if (density < 0.7) return "#FFC107";  // Yellow for medium
      return "#F44336";                     // Red for dense
    });
  }