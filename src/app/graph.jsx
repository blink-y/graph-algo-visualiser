import * as d3 from "d3";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea"

export default function ForceDirectedGraph() {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [deleteNodeId, setDeleteNodeId] = useState("");
  const [edgeList, setEdgeList] = useState(''); // State for the textarea input
  //const [edges, setEdges] = useState([]); // State for storing edges
  
  const kCoreValues = {
    1: 3,
    2: 4,
    3: 4,
    4: 4,
    5: 5,
    6: 4,
    7: 5,
    8: 4,
    9: 2,
    10: 2,
    11: 2,
    12: 3,
    13: 1,
    14: 3,
    15: 3,
    16: 3,
    17: 4,
    18: 4,
    19: 4,
    20: 4,
    21: 2,
    22: 3,
    23: 2,
    24: 2,
    25: 2,
    26: 2,
    27: 2,
    28: 2,
    29: 1,
    30: 2,
    31: 2,
    32: 2,
    33: 2,
    34: 2,
    35: 2,
    36: 2,
    37: 2,
    38: 2,
    39: 2,
    40: 2,
    41: 2,
    42: 2,
    43: 2,
    44: 2,
    45: 2,
    46: 2,
    47: 2,
    48: 1,
    49: 2,
    50: 2
  };
  const generateInitialData = () => {
        const edges = [
          [1, 2], 
          [1, 4], 
          [1, 7], 
          [1, 14], 
          [1, 20], 
          [2, 3], 
          [2, 5], 
          [2, 7], 
          [2, 13], 
          [3, 8], 
          [3, 9], 
          [4, 5], 
          [4, 7], 
          [5, 4], 
          [5, 6], 
          [5, 7], 
          [6, 8], 
          [6, 11], 
          [6, 12], 
          [7, 8], 
          [8, 10], 
          [15, 17], 
          [16, 17], 
          [17, 18], 
          [17, 19], 
          [18, 20], 
          [19, 20], 
          [21, 1], 
          [21, 3], 
          [21, 4], 
          [22, 5], 
          [22, 8], 
          [23, 6], 
          [23, 14], 
          [24, 2], 
          [24, 10], 
          [25, 7], 
          [25, 19], 
          [26, 17], 
          [26, 11], 
          [27, 20], 
          [27, 18], 
          [28, 12], 
          [28, 15], 
          [29, 5], 
          [29, 22], 
          [30, 8], 
          [30, 13], 
          [31, 3], 
          [31, 10], 
          [32, 9], 
          [32, 18], 
          [33, 16], 
          [33, 19], 
          [34, 4], 
          [34, 12], 
          [35, 1], 
          [35, 15], 
          [36, 7], 
          [36, 2], 
          [37, 20], 
          [37, 6], 
          [38, 17], 
          [38, 5], 
          [39, 14], 
          [39, 11], 
          [40, 3], 
          [40, 22], 
          [41, 4], 
          [41, 8], 
          [42, 19], 
          [42, 12], 
          [43, 1], 
          [43, 26], 
          [44, 7], 
          [44, 21], 
          [45, 8], 
          [45, 18], 
          [46, 2], 
          [46, 5], 
          [47, 10], 
          [47, 12], 
          [48, 3], 
          [48, 29], 
          [49, 14], 
          [49, 20], 
          [50, 6], 
          [50, 15]
        ];
    
        // Generate unique nodes from edges
        const nodesSet = new Set();
        edges.forEach(edge => {
            nodesSet.add(edge[0]);
            nodesSet.add(edge[1]);
        });

        // Define color mapping based on k-core value
        // Define color mapping based on k-core value
        const colors = ['#FFCCCC', '#FF99CC', '#FF66CC', '#FF33CC', '#FF00CC']; // Example color array

        const getColorForKCoreValue = (kCoreValue) => {
            if (kCoreValue < 0 || kCoreValue >= colors.length) {
                console.warn(`Invalid k-core value: ${kCoreValue}. Defaulting to white.`);
                return '#FFFFFF'; // Fallback color
            }
            return colors[kCoreValue];
        };

      // Create nodes array with colors and groups based on k-core values
      const nodes = Array.from(nodesSet).map(id => {
          const kCoreValue = kCoreValues[id] || 0; // Default k-core value to 0 if not found
          return {
              id: String(id),
              group: String.fromCharCode(65 + Math.min(kCoreValue, 4)), // Group A-E based on k-core values
              color: getColorForKCoreValue(kCoreValue) // Assign color based on k-core value
            };
          });
    
        // Create links array with random values
        const links = edges.map(([source, target]) => ({
            source: String(source), // Ensure source is a string
            target: String(target), // Ensure target is a string
            value:  Math.min(Math.min(
              kCoreValues[String(source)] || 0, 
              kCoreValues[String(target)] || 0
          ),10)// Thickness based on average k-core value
        }));
    
        // Final data structure
        setNodes(nodes);
        setLinks(links);
    };

    useEffect(() => {
        generateInitialData();
    }, []);
  
    useEffect(() => {
      // Specify the dimensions of the chart.
      
      const width = window.innerWidth*0.4;
      const height = window.innerHeight*0.4;
  
      // Specify the color scale.
      const color = d3.scaleOrdinal(d3.schemeCategory10);
  
  
      // Create a simulation with several forces.
      const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links)
              .id(d => d.id)
              .strength(link => {
                  const sourceCore = kCoreValues[link.source] || 0; // Get the k-core value of the source
                  const targetCore = kCoreValues[link.target] || 0; // Get the k-core value of the target
                  // Increase link strength based on the average k-core value
                  return 1 + 0.5 * Math.min(sourceCore, targetCore); // Higher k-core values increase the strength
              }))
          .force("charge", d3.forceManyBody().strength(node => {
              const coreValue = kCoreValues[node.id] || 0; // Get the k-core value of the node
              return -15 * (5 + coreValue); // Repel higher k-core values more strongly
          }))

        
        // Create the SVG container and set dimensions.
        const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: auto; height: auto;")
        .attr("class","responsive-svg");
        
      // Remove all existing elements in the SVG container.
      svg.selectAll("*").remove()
      
      // Add lines for links and circles for nodes.
      const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 1)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));
  
      const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", d => color(d.group))
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      node.append("title")
        .text(d => d.id);
  
      // Set the position attributes of links and nodes each time the simulation ticks.
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
  
      // Reheat the simulation when drag starts, and fix the subject position.
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
  
      // Update the subject (dragged node) position during drag.
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
  
      //Restore the target alpha and unfix the subject position after dragging ends.
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
  
      // Cleanup function to stop the simulation when the component unmounts or updates.
      return () => {
        simulation.stop();
      };
    }, [nodes, links]);

    const deleteNode = (nodeId) => {
      if (nodes.find(node => node.id === nodeId)) {
          setNodes(nodes.filter(node => node.id !== nodeId));
          setLinks(links.filter(link => link.source.id !== nodeId && link.target.id !== nodeId));
          setDeleteNodeId(""); // Clear input after deletion
      } else {
          alert(`Node ${nodeId} does not exist!`);
      }
  };
    const addEdge = () => {
      const source = edgeSource.trim();
      const target = edgeTarget.trim();
  
      if (source && target) {
          // Check if source node exists; if not, add it
          if (!nodes.find(node => node.id === source)) {
              setNodes(prevNodes => [
                  ...prevNodes,
                  { id: source, group: String.fromCharCode(65 + Math.floor(Math.random() * 5)) }
              ]);
          }
  
          // Check if target node exists; if not, add it
          if (!nodes.find(node => node.id === target)) {
              setNodes(prevNodes => [
                  ...prevNodes,
                  { id: target, group: String.fromCharCode(65 + Math.floor(Math.random() * 5)) }
              ]);
          }
  
          // Now add the edge
          const newLink = { source, target, value: 10 };
          setLinks(prevLinks => [...prevLinks, newLink]);
          setEdgeSource('');
          setEdgeTarget('');
      } else {
          alert("Both source and target must be specified.");
      }
    
    };

    const addEdgesFromInput = () => {
    // Split the input by new lines and filter out any empty lines
    const edgeLines = edgeList.split('\n').filter(line => line.trim() !== '');

    edgeLines.forEach(line => {
        const [source, target] = line.split(',').map(node => node.trim());

        // Validate that both source and target are present
        if (source && target) {
            // Call addEdge function for each valid edge
            console.log(`Adding edge: ${source} -> ${target}`);
            addEdge(source, target);
        } else {
            console.warn(`Invalid edge format in line: "${line}"`);
        }
    });
    };

  
  return (
    <div>
      <div className="flex flex-col mb-4">
        <div className="flex flex-row mb-2">
          <div className="mr-2">
              <Label htmlFor="edgeSource" className="ml-1">Source Node:</Label>
              <Input
                  id="edgeSource"
                  type="text"
                  placeholder="Source node"
                  value={edgeSource}
                  style={{ width: '100%' }} // Set width to 100% for better responsiveness
                  onChange={e => setEdgeSource(e.target.value)}
              />
          </div>
          <div className="mr-2">
              <Label htmlFor="edgeTarget" className="ml-1">Edge Target:</Label>
              <Input
                  id="edgeTarget"
                  type="text"
                  placeholder="Target node"
                  value={edgeTarget}
                  style={{ width: '100%' }} // Set width to 100%
                  onChange={e => setEdgeTarget(e.target.value)}
              />
          </div>
          <div className="flex pt-4">
              <Button 
                  onClick={() => addEdge(edgeSource, edgeTarget)} 
                  className="mt-2"
              >
                  Add Edge
              </Button>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex mr-2 mb-2">
          <Label htmlFor="deleteNodeId">Delete Node:</Label>
          </div>
          <div className="flex-row mb-2">
                <Input
                  id="deleteNodeId"
                  type="text"
                  placeholder="Enter node ID to delete"
                  value={deleteNodeId}
                  onChange={e => setDeleteNodeId(e.target.value)}
                  style={{ width: '30%' }} // Set width to 50%
                  className="mr-2" // Keep any additional styles
                />
                <Button onClick={() => deleteNode(deleteNodeId)}>Delete</Button>
          </div>  
        </div>
    </div>
    <div className="flex flex-row items-start mt-4">
    <div className="flex-1 mr-1">
        <svg ref={svgRef} style={{ width: 'auto', height: 'auto' }} />
    </div>
    <div className="flex-1">
        <p>Input Edge List 
          (Not Functional)</p>
        <Textarea 
        className="h-[100%] w-[40%]" 
        style={{ resize: 'none' }} 
        value = {edgeList}
        onChange={e => setEdgeList(e.target.value)}
        />
        <Button 
        className="mt-3"
        onClick={addEdgesFromInput}
        >Upload Edge List</Button>
    </div>
    </div>
    </div>
);
};



