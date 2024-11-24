"use-client";

import * as d3 from "d3";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"
export default function ForceDirectedGraph() {
  const svgRef = useRef();
  const [initialNodes, setInitialNodes] = useState([]);
  const [initialLinks, setInitialLinks] = useState([]);
  const [uploadedNodes, setUploadedNodes] = useState([]);
  const [uploadedLinks, setUploadedLinks] = useState([]);
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [deleteNodeId, setDeleteNodeId] = useState("");
  const [edgeList, setEdgeList] = useState('');
  const [kCoreValues, setKCoreValues] = useState({});
  
  const edges = [
    [1,5], [1,2], [1,3], [1,4], [2,3], [2,4], [2,5], [3,4], [3,5], [4,5], [6,7], [6,8], [6,9], [7,8], [7,9], [8,9], [1,9], [1,11], [2,11], [2,12], [3,12], [3,13], [4,16], [5,9], [5,14], [5,15], [5,15], [6,10], [8,15], [9,10], [10,11], [12,13], [14,15], [16,17], [16,18], [17,18], [7,23], [10,24], [10,25], [11,26], [11,27], [12,28], [12,29], [13,30], [17,20], [18,19], [15,21], [15,22]
  ];

  const postGraphData = async (edges) => {
    try {
      const response = await fetch('http://localhost:8000/calculate_k_cores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ edges: edges.map(edge => [Number(edge[0]), Number(edge[1])]) })
      });

      if (!response.ok) {
        throw new Error(`Failed to post graph data: ${response.status}`);
      }

      const data = await response.json();
      console.log('Core nodes:', data.core_nodes);
      return data.core_nodes;

    } catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
  };

  const generateInitialData = async() => {
    const kcore_nodes = await postGraphData(edges);
    console.log('Core nodes:', kcore_nodes); // Log core nodes
    if (!kcore_nodes) {
        console.error('No core nodes data available. Cannot generate initial data.');
        return; // Exit if there was an error
    }

    // Create a Map to track the highest k-core value for each node
    const nodeCoreMap = new Map();

    // Iterate through the k-core nodes
    Object.entries(kcore_nodes).forEach(([kCoreValue, nodeIds]) => {
        const numericKCoreValue = Number(kCoreValue);
        nodeIds.forEach(id => {
            // If the node is not in the map or if the current k-core value is higher, update it
            if (!nodeCoreMap.has(id) || nodeCoreMap.get(id) < numericKCoreValue) {
                nodeCoreMap.set(id, numericKCoreValue);
            }
        });
    });

    const colorMapping = {
      1: '#FFCCCC',
      2: '#FF99CC',
      3: '#FF66CC',
      4: '#FF33CC',
      5: '#FF00CC'
  };

  const getColorForKCoreValue = (kCoreValue) => {
      return colorMapping[kCoreValue] || '#FFFFFF'; // Fallback to white if the k-core value is not defined
  };
    // Create an array of unique nodes based on the highest k-core value
    const nodes = [];
    nodeCoreMap.forEach((kCoreValue, id) => {
        const node = {
            id: String(id),
            group: String.fromCharCode(65 + Math.min(kCoreValue, 4)), // Group A-E, adjust as necessary
            color: getColorForKCoreValue(kCoreValue) // Assign color based on k-core value
        };
        nodes.push(node);
    });

    // Create links array based on edges
    const links = edges.map(([source, target]) => ({
        source: String(source), // Ensure source is a string
        target: String(target), // Ensure target is a string
        value: 1 // Thickness can be adjusted based on your logic
    }));

    // Final data structure
    setInitialNodes(nodes);
    setInitialLinks(links);
};

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        const edges = parseGraphData(content);
        
        // Send the uploaded graph data to the backend
        const kCoreData = await postGraphData(edges);
        if (kCoreData) {
          // If successful, update the uploaded graph state
          // Optionally, you can create nodes and links if needed for rendering
          const nodesSet = new Set();
          edges.forEach(([source, target]) => {
            nodesSet.add(source);
            nodesSet.add(target);
          });
          const nodes = Array.from(nodesSet).map(id => ({ id, group: "A" })); // Assign a default group
          setUploadedNodes(nodes);
          setUploadedLinks(edges.map(([source, target]) => ({ source, target, value: 1 }))); // Convert to links for rendering
        }
      };
      reader.readAsText(file);
    }
  };

  const parseGraphData = (data) => {
    const edgeLines = data.split('\n').filter(line => line.trim() !== '');
    const edges = edgeLines.map(line => {
      const [source, target] = line.split(',').map(node => node.trim());
      return [Number(source), Number(target)]; // Convert to numbers and return as an array
    });
    return edges;
  };


  useEffect(() => {
    generateInitialData();
  }, []);

  useEffect(() => {
    // Specify the dimensions of the chart.
    const width = window.innerWidth * 0.4;
    const height = window.innerHeight * 0.4;
  
    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);
  
    // Create a simulation with several forces.
    const simulation = d3.forceSimulation((uploadedNodes.length > 0 ? uploadedNodes : initialNodes))
      .force("link", d3.forceLink((uploadedLinks.length > 0 ? uploadedLinks : initialLinks))
        .id(d => d.id)
        .strength(link => {
          const sourceCore = kCoreValues[link.source] || 0; // Get the k-core value of the source
          const targetCore = kCoreValues[link.target] || 0; // Get the k-core value of the target
          return 1 + 0.5 * Math.min(sourceCore, targetCore); // Strength based on k-core values
        }))
      .force("charge", d3.forceManyBody().strength(node => {
        const coreValue = kCoreValues[node.id] || 0; // Get the k-core value of the node
        return -15 * (5 + coreValue); // Repel higher k-core values more strongly
      }))
      .force("center", d3.forceCenter(0, 0)); // Center the graph
  
    // Create the SVG container and set dimensions.
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: auto; height: auto;")
      .attr("class", "responsive-svg");
  
    // Remove all existing elements in the SVG container.
    svg.selectAll("*").remove();
  
    // Add lines for links and circles for nodes.
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 1)
      .selectAll("line")
      .data(uploadedLinks.length > 0 ? uploadedLinks : initialLinks)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));
  
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(uploadedNodes.length > 0 ? uploadedNodes : initialNodes)
      .join("circle")
      .attr("r", 5)
      .attr("fill", d => color(d.group))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );
  
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
  
    // Drag functions
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  
    // Cleanup function to stop the simulation when the component unmounts or updates.
    return () => {
      simulation.stop();
    };
  }, [initialNodes, initialLinks, uploadedNodes, uploadedLinks]);



    const deleteEdge = (sourceId, targetId) => {
      const edgeExists = links.some(link => 
        (link.source === sourceId && link.target === targetId) || 
        (link.source === targetId && link.target === sourceId)
      );
    
      if (edgeExists) {
        setLinks(links.filter(link => 
          !((link.source === sourceId && link.target === targetId) || 
            (link.source === targetId && link.target === sourceId))
        ));
      } else {
        alert(`Edge between ${sourceId} and ${targetId} does not exist!`);
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

    // Function to remove all SVG elements
    const clearSvg = () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };

  
  return (
    <div>
      <div className="flex flex-col mb-4">
        <div className="flex flex-col mb-2">
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
          <div className="flex flex-row mb-2">
          </div>

        </div>
        <div className="flex flex-col">
          <div className="flex mr-2 mb-2">
          <Label htmlFor="deleteNodeId">Delete Node:</Label>
          </div>
          <div className="flex flex-row mb-2">
                <Input
                  id="deleteNodeId"
                  type="text"
                  placeholder="Enter node ID to delete"
                  value={deleteNodeId}
                  onChange={e => setDeleteNodeId(e.target.value)}
                  style={{ width: '30%' }} // Set width to 50%
                  className="mr-2" // Keep any additional styles
                />
                <Button onClick={() => deleteNode(deleteNodeId)}>Delete Node</Button>
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
        <Button onClick={clearSvg} className="mt-2">
            Clear SVG
        </Button>
        <div>
        <input
          type="file"
          accept=".txt" // or the appropriate file types
          onChange={handleFileUpload}
        />
        </div>
    </div>
    <div className="flex-1">
    </div>
    </div>
    </div>
);
};



