import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useTreeStore } from "./store";
import { TreeHover } from "./treeHoverComponent";
import { useActionStore } from "./store";

export default function Tree({ height, width, xOffset = 20, yOffset = 125 }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const gRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodePosition, setNodePosition] = useState({ x: 0, y: 0 });
  const [selectedPath, setSelectedPath] = useState([]);
  const { treeData } = useTreeStore();
  const { setActionSequence, clearActionSequence } = useActionStore();

  const navigateToNode = async (node) => {
    const value = node.data.id;
    console.log("Node ID:", value);

    try {
      const response = await fetch('http://localhost:8000/navigate_to_node', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ node_id: String(value) })
      });
  
      const data = await response.json();
      useActionStore.getState().setActionSequence(data.action_sequence || []);
    }
    catch (error) {
      console.error("Error navigating to node:", error);
      useActionStore.getState().clearActionSequence([]);
    }
  };

  useEffect(() => {
    setSelectedPath([]);
  }, [treeData]);

  useEffect(() => {
    if (!treeData) return;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([height, width]).nodeSize([40, 30]);
    treeLayout(root);

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    
    // Clear previous content
    g.selectAll("*").remove();

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8]) // Limit zoom scale
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Draw links
    g.selectAll(".link")
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
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y + xOffset},${d.x + yOffset})`);
    
    const highlightPath = (node) => {
      const path = [];
      let currentNode = node;
      while (currentNode) {
        path.push(currentNode.data.id);
        currentNode = currentNode.parent;
      }
      setSelectedPath(path);
    }

    // Add circles with hover effects
    nodes.append("circle")
      .attr("r", 4)
      .attr("fill", d => {
        if (selectedPath.includes(d.data.id)) {
          return d.depth === 0 ? "green" : "blue";
        }
        return "#fff";
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        if (!selectedPath.includes(d.data.id)) {
          d3.select(this).attr("fill", "orange");
        }
        setHoveredNode(d.data);
        setNodePosition({
          x: event.clientX - containerRef.current.getBoundingClientRect().left,
          y: event.clientY - containerRef.current.getBoundingClientRect().top
        });
      })
      .on("mouseout", function(event, d) {
        if (!selectedPath.includes(d.data.id)) {
          d3.select(this).attr("fill", "#fff");
        } else {
          d3.select(this).attr("fill", d.depth === 0 ? "green" : "blue");
        }
        setHoveredNode(null);
      })
      .on("click", function(event, d) {
        highlightPath(d);
        navigateToNode(d);
        event.stopPropagation();
      });

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
      })
      .on("click", function(event, d) {
        event.stopPropagation();
      });

    // Reset zoom to initial position
    svg.call(zoom.transform, d3.zoomIdentity);

  }, [treeData, width, height, xOffset, yOffset, selectedPath]);

  return (
    <div ref={containerRef} style={{ position: "relative", width, height, border: "2px solid black" }}>
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        style={{ overflow: "visible", cursor: "move" }}
      >
        <g ref={gRef} />
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