import * as d3 from "d3";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function DelaunayGraph() {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [edgeList, setEdgeList] = useState('');

  const generateInitialData = () => {
    const initialEdges = [
      [1, 5], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5],
      [6, 7], [6, 8], [6, 9], [7, 8], [7, 9], [8, 9], [1, 9], [1, 11], [2, 11], [2, 12],
      [3, 12], [3, 13], [4, 16], [5, 9], [5, 14], [5, 15], [6, 10], [8, 15], [9, 10],
      [10, 11], [12, 13], [14, 15], [16, 17], [16, 18], [17, 18], [7, 23], [10, 24],
      [10, 25], [11, 26], [11, 27], [12, 28], [12, 29], [13, 30], [17, 20], [18, 19],
      [15, 21], [15, 22]
    ];

    const nodesSet = new Set();
    initialEdges.forEach(edge => {
      nodesSet.add(edge[0]);
      nodesSet.add(edge[1]);
    });

    const nodesArray = Array.from(nodesSet).map(id => ({
      id: String(id),
      kCoreValue: 0,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
    }));

    setNodes(nodesArray);

    // Create edges with string IDs instead of indices
    const edgesArray = initialEdges.map(([source, target]) => ({
      source: String(source),
      target: String(target)
    }));

    setEdges(edgesArray);
  };

  useEffect(() => {
    generateInitialData();
  }, []);

  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return;

    const width = 1000;
    const height = 1000;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create a simulation with proper node references
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(50).strength(1))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw edges
    const link = svg.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "black");

    // Draw nodes
    const highlightedNodeIds = ['17', '18', '16'];
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => highlightedNodeIds.includes(d.id) ? 8 : 5)
      .attr("fill", d => highlightedNodeIds.includes(d.id) ? 'orange' : d3.scaleOrdinal(d3.schemeCategory10)(d.kCoreValue));

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    // Capture node coordinates when the simulation ends
    simulation.on("end", () => {
      const finalPositions = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
      console.log("Final node positions:", finalPositions);
      drawPolygon(finalPositions); // Call the function to draw the polygon with final positions
    });

    const drawPolygon = (finalPositions) => {
      const highlightedNodes = finalPositions.filter(node => highlightedNodeIds.includes(node.id));
      if (highlightedNodes.length > 2) {
        const points = highlightedNodes.map(node => [node.x, node.y]);
        
        // Calculate the centroid using d3.polygonCentroid
        const centroid = d3.polygonCentroid(points);

        // Sort points counterclockwise around the centroid
        points.sort((a, b) => {
          const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
          const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);
          return angleA - angleB; // Sort by angle
        });

        const hull = d3.polygonHull(points);
        if (hull) {
          svg.append("polygon")
            .datum(hull)
            .attr("points", d => d.map(point => point.join(",")).join(" "))
            .attr("fill", "rgba(255, 255, 0, 0.5)")
            .attr("pointer-events", "none");
        }
      }
    };

  }, [nodes, edges]);

  const addEdgesFromInput = () => {
    const edgeLines = edgeList.split('\n').filter(line => line.trim() !== '');
    const newEdges = [];
    edgeLines.forEach(line => {
      const [source, target] = line.split(',').map(node => node.trim());
      if (source && target) {
        newEdges.push({ source, target });
      }
    });
    setEdges(prevEdges => [...prevEdges, ...newEdges]);
  };

  return (
    <div>
      <div className="flex flex-col mb-4">
        <Label htmlFor="edgeList">Input Edge List</Label>
        <Textarea 
          className="h-[100%] w-[40%]" 
          style={{ resize: 'none' }} 
          value={edgeList}
          onChange={e => setEdgeList(e.target.value)}
        />
        <Button 
          className="mt-3"
          onClick={addEdgesFromInput}
        >Upload Edge List</Button>
      </div>
      <svg ref={svgRef} style={{ width: '1000px', height: '1000px' }} />
    </div>
  );
}