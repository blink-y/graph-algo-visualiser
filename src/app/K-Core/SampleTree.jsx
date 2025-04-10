import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useTreeStore } from "./store";
import { TreeHover } from "./treeHoverComponent";

export default function Tree({ height, width, xOffset = 20, yOffset = 10 }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodePosition, setNodePosition] = useState({ x: 0, y: 0 });
  const { treeData } = useTreeStore();

  const navigateToNode = async (node) => {

    const value = node.data.id;
    console.log("Node ID:", value);

    const response = await fetch('http://localhost:8000/navigate_to_node', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ node_id: value })
    });
    const data = await response.json();
    console.log(data);
    if (data.success) {
      console.log("Node navigation successful");
    } else {
      console.error("Node navigation failed");
    }
  };

  useEffect(() => {
    if (!treeData) return;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([height, width]).nodeSize([40, 30]);
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
        .y(d => d.x + yOffset))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    // Draw nodes with hover effects
    const nodes = svg.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y + xOffset},${d.x + yOffset})`);

    // Add circles with hover effects
    nodes.append("circle")
      .attr("r", 4)
      .attr("fill", "#fff")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "orange");
        setHoveredNode(d.data);
        setNodePosition({
          x: event.clientX - containerRef.current.getBoundingClientRect().left,
          y: event.clientY - containerRef.current.getBoundingClientRect().top
        });
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", "#fff");
        setHoveredNode(null);
      })
      .on("click", function(event, d) {
        d3.select(this).attr("fill", "blue");
        navigateToNode(d);
      })

    nodes.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this.closest('.node')).select('circle').attr("fill", "orange");
        setHoveredNode(d.data);
        setNodePosition({
          x: event.clientX - containerRef.current.getBoundingClientRect().left,
          y: event.clientY - containerRef.current.getBoundingClientRect().top
        });
      })
      .on("mouseout", function() {
        d3.select(this.closest('.node')).select('circle').attr("fill", "#fff");
        setHoveredNode(null);
      });

  }, [treeData, width, height, xOffset, yOffset]);

  return (
    <div ref={containerRef} style={{ position: "relative", width, height }}>
      <svg ref={svgRef} width={width} height={height}>
        <g />
      </svg>
      
      {hoveredNode && (
        <div 
          className="absolute p-4 z-50"
          style={{
            left: `${nodePosition.x + 15}px`,
            top: `${nodePosition.y + 15}px`,
            pointerEvents: 'none'
          }}
        >
          <TreeHover nodeData={hoveredNode} />
        </div>
      )}
    </div>
  );
}