import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useTreeStore } from "./store";

export default function Tree({ 
  height, 
  width,
  xOffset = 20,
  yOffset = 100 
}) {
  const svgRef = useRef();
  const tooltipRef = useRef(); 
  const { treeData } = useTreeStore();

  useEffect(() => {
    if (!treeData) {
      console.log("No tree data available");
      return;
    }
    
    if (!treeData.id || !Array.isArray(treeData.children)) {
      console.error("Invalid tree data structure", treeData);
      return;
    }

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree()
      .size([height, width])
      .nodeSize([40, 30]);
    
    treeLayout(root);
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Create tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")  // Important to prevent tooltip from interfering
      .style("z-index", "10")


    // Draw links
    svg.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical()
        .x(d => d.y + xOffset)
        .y(d => d.x + yOffset)
      )
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);
    
    // Draw nodes with enhanced hover
    const nodes = svg.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y + xOffset},${d.x + yOffset})`);

      nodes.append("circle")
      .attr("r", 3.5)
      .attr("fill", "#fff")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .on("click", handleNodeClick)
      .on("mouseover", function(event, d) {
        // Highlight node
        d3.select(this)
          .attr("fill", "orange")
          .attr("r", 5);
        
        // Show tooltip with all available data
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(`
            <div>
              <strong>Node ID:</strong> ${d.data.id}<br>
              ${d.data.value ? `<strong>Value:</strong> ${d.data.value}<br>` : ''}
              ${d.data.children ? `<strong>Children:</strong> ${d.data.children.length}` : ''}
            </div>
          `)
          .classed("visible", true); // Use this instead of visibility style
      })
      .on("mouseout", function() {
        // Reset node appearance
        d3.select(this)
          .attr("fill", "#fff")
          .attr("r", 3.5);
        
        // Hide tooltip
        tooltip.classed("visible", false);
      });
      
  }, [treeData, width, height, xOffset, yOffset]);

  const handleNodeClick = (event, d) => {
    console.log("Node clicked:", d.data);
    alert(`Node clicked: ${d.data.id}\n${d.data.value ? `Value: ${d.data.value}` : ''}`);
  };

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={width} height={height}>
        <g />
      </svg>
      <div ref={tooltipRef} className="tooltip" />
    </div>
  );
}