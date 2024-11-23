import * as d3 from "d3";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DelaunayGraph() {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [edgeList, setEdgeList] = useState('');

  const kCoreValues = {
    1: 4,
    2: 4,
    3: 4,
    4: 4,
    5: 4,
    6: 3,
    7: 3,
    8: 3,
    9: 3,
    10: 2,
    11: 2,
    12: 2,
    13: 2,
    14: 2,
    15: 2,
    16: 2,
    17: 2,
    18: 2,
    19: 1,
    20: 1,
    21: 1,
    22: 1,
    23: 1,
    24: 1,
    25: 1,
    26: 1,
    27: 1,
    28: 1,
    29: 1,
    30: 1
  };

  const generateInitialData = () => {
    const edges = [
        [1,5], [1,2], [1,3], [1,4], [2,3], [2,4], [2,5], [3,4], [3,5], [4,5], [6,7], [6,8], [6,9], [7,8], [7,9], [8,9], [1,9], [1,11], [2,11], [2,12], [3,12], [3,13], [4,16], [5,9], [5,14], [5,15], [5,15], [6,10], [8,15], [9,10], [10,11], [12,13], [14,15], [16,17], [16,18], [17,18], [7,23], [10,24], [10,25], [11,26], [11,27], [12,28], [12,29], [13,30], [17,20], [18,19], [15,21], [15,22]
      ];

    const nodesSet = new Set();
    edges.forEach(edge => {
      nodesSet.add(edge[0]);
      nodesSet.add(edge[1]);
    });

    const coordinates = {
        1: { x: 550, y: 650 },
        2: { x: 650, y: 600 },
        3: { x: 600, y: 500 },
        4: { x: 500, y: 500 },
        5: { x: 450, y: 600 },
        6: { x: 400, y: 800 },
        7: { x: 300, y: 800 },
        8: { x: 300, y: 700 },
        9: { x: 400, y: 700 },
        10: { x: 550, y: 800 },
        11: { x: 700, y: 700 },
        12: { x: 800, y: 500 },
        13: { x: 700, y: 400 },
        14: { x: 350, y: 500 },
        15: { x: 250, y: 600 },
        16: { x: 400, y: 350 },
        17: { x: 300, y: 300 },
        18: { x: 400, y: 250 },
        19: { x: 450, y: 100 },
        20: { x: 150, y: 250 },
        21: { x: 150, y: 550 },
        22: { x: 150, y: 650 },
        23: { x: 250, y: 900 },
        24: { x: 450, y: 950 },
        25: { x: 600, y: 950 },
        26: { x: 800, y: 850 },
        27: { x: 850, y: 700 },
        28: { x: 950, y: 600 },
        29: { x: 950, y: 400 },
        30: { x: 800, y: 250 }
      };

    const nodesArray = Array.from(nodesSet).map(id => ({
    id: String(id),
    x: coordinates[id]?.x || 0, // Use specific x coordinate or default to 0
    y: (1000 - coordinates[id]?.y) || 0, // Use specific y coordinate or default to 0
    kCoreValue: kCoreValues[id] || 0,
  }));

    setNodes(nodesArray);
  };

  useEffect(() => {
    generateInitialData();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous SVG content

    const width = 1500;
    const height = 1500;

    // Create scales for axes
    const xScale = d3.scaleLinear()
      .domain([0, 1000]) // Adjust this based on your node coordinates
      .range([0, 1000]);

    const yScale = d3.scaleLinear()
      .domain([0, 1000]) // Data values
      .range([height, 0]); // Inverted Y scale for SVG
    
      // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Append grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#ccc")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(d3.range(0, 1000, 200)) // Create grid lines every 50 units
      .join("line")
      .attr("x1", d => xScale(d))
      .attr("y1", 0)
      .attr("x2", d => xScale(d))
      .attr("y2", height);

    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#ccc")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(d3.range(0, 1000, 200)) // Create grid lines every 50 units
      .join("line")
      .attr("x1", 0)
      .attr("y1", d => yScale(d))
      .attr("x2", width)
      .attr("y2", d => yScale(d));

    // Draw axes
    svg.append("g")
      .attr("transform", `translate(0, 1000)`) // Move X axis to the bottom
      .call(xAxis);

    svg.append("g")
      .call(yAxis);

    // Delaunay triangulation
    const delaunay = d3.Delaunay.from(nodes, d => d.x, d => d.y);
    const triangles = delaunay.triangles;

    // Define a color scale based on k-core values
    const colorScale = d3.scaleSequential(d3.interpolateBlues) // Change this to your desired color scale
      .domain([0, d3.max(nodes, d => d.kCoreValue)]); // Adjust domain based on k-core values

    // Draw triangles with color based on average k-core value
    svg.append("g")
      .selectAll("polygon")
      .data(d3.range(0, triangles.length / 3))
      .join("polygon")
      .attr("points", i => {
        const p1 = nodes[triangles[i * 3]];
        const p2 = nodes[triangles[i * 3 + 1]];
        const p3 = nodes[triangles[i * 3 + 2]];
        return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
      })
      .attr("fill", i => {
        const p1 = nodes[triangles[i * 3]];
        const p2 = nodes[triangles[i * 3 + 1]];
        const p3 = nodes[triangles[i * 3 + 2]];
        const avgKCoreValue = (p1.kCoreValue + p2.kCoreValue + p3.kCoreValue) / 3;
        return colorScale(avgKCoreValue); // Use average k-core value to determine color
      })
      .attr("stroke", "black");

    // Draw nodes
    svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 5)
      .attr("fill", d => {
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        return colorScale(d.kCoreValue);
      });

  }, [nodes]);

  const addEdgesFromInput = () => {
    const edgeLines = edgeList.split('\n').filter(line => line.trim() !== '');
    edgeLines.forEach(line => {
      const [source, target] = line.split(',').map(node => node.trim());
      if (source && target) {
        console.log(`Adding edge: ${source} -> ${target}`);
        // Add logic to handle edges if needed
      } else {
        console.warn(`Invalid edge format in line: "${line}"`);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-col mb-4">
        <div className="flex flex-col">
          <Label htmlFor="edgeList">Input Edge List (Not Functional)</Label>
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
      </div>
      <svg ref={svgRef} style={{ width: '1000px', height: '1001px' }} />
    </div>
  );
}