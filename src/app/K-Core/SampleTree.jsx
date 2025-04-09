import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useTreeStore } from "./store";

export default function Tree({ 
  height, 
  width,
  xOffset = 20,  // Make configurable
  yOffset = 100 
}) {
  const svgRef = useRef();
  const { treeData } = useTreeStore();  // Only need treeData

  useEffect(() => {
    if (!treeData) {
    console.log("No tree data available");
    return
    } else {
      console.log("Rendering tree with data:", treeData);
    }
    
    // Validate structure
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
    
    // Draw nodes
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
      .on("mouseover", function() {
        d3.select(this).attr("fill", "orange");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", "#fff");
      });
  }, [treeData, width, height, xOffset, yOffset]);

  const handleNodeClick = (event, d) => {
    console.log("Node clicked:", d.data);
    alert(`Node clicked: ${d.data.id}`);
  };

  return (
    <svg ref={svgRef} width={width} height={height}>
      <g />
    </svg>
  );
}