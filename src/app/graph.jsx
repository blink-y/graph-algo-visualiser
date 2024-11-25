"use-client";

import * as d3 from "d3";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
export default function ForceDirectedGraph() {
  const svgRef = useRef(null);
  const [Nodes, setNodes] = useState([]);
  const [Links, setLinks] = useState([]);
  const [addEdgeSource, setAddEdgeSource] = useState('');
  const [addEdgeTarget, setAddEdgeTarget] = useState('');
  const [deleteEdgeSource, setDeleteEdgeSource] = useState('');
  const [deleteEdgeTarget, setDeleteEdgeTarget] = useState('');
  const [deleteNodeId, setDeleteNodeId] = useState("");
  const [kCoreValues, setKCoreValues] = useState({});
  const [selectedValue, setSelectedValue] = useState('2');
  const [selectedKCore, setSelectedKCore] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [maxKCore, setMaxKCore] = useState(0);
  const [loading, setLoading] = useState(false);


  // Upload Graph data
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
      console.log('Core nodes:', data.core_data);
      return data.core_data;

    } catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
  };
  
  // Process K-Core Data
  const processKCoreData = (kCoreData) => {
    // Create a Map to track the highest k-core value for each node
    const nodeCoreMap = new Map();
    const nodesSet = new Set(); // Define nodesSet here

    // Process updated k-core data to populate nodeCoreMap
    Object.entries(kCoreData).forEach(([kCoreValue, { nodes: nodeIds, edges }]) => {
        const numericKCoreValue = Number(kCoreValue);
        nodeIds.forEach(id => {
            if (!nodeCoreMap.has(id) || nodeCoreMap.get(id) < numericKCoreValue) {
                nodeCoreMap.set(id, numericKCoreValue);
            }
        });

        // Add nodes from the edges
        edges.forEach(([source, target]) => {
            nodesSet.add(source);
            nodesSet.add(target);
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
    const nodes = Array.from(nodesSet).map(id => {
        const kCoreValue = nodeCoreMap.get(id) || 0; // Get k-core value or default to 0
        return {
            id: String(id),
            group: String.fromCharCode(65 + Math.min(kCoreValue, 4)), // Group A-E
            color: getColorForKCoreValue(kCoreValue) // Assign color based on k-core value
        };
    });

    // Extract edges from kCoreData for uploading
    const edgesToUpload = [];
    Object.values(kCoreData).forEach(({ edges }) => {
        edges.forEach(([source, target]) => {
            edgesToUpload.push({ source: String(source), target: String(target), value: 1 });
        });
    });

    setNodes(nodes);
    setLinks(edgesToUpload);
    refreshGraph();
};

  //Add Edge
  const addEdge = async (source, target) => {
    const newEdge = { source, target };

    try {
        const response = await fetch('http://localhost:8000/add_edge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEdge),
        });
        const data = await response.json();
        const kCoreData = data.core_data; // Assuming your API returns the updated k-core data
        console.log('Updated core data:', kCoreData);
        processKCoreData(kCoreData)  
    } catch (error) {
        alert(`Error adding edge: ${error.message}`);
    }
  };

  // Delete Edge
  const deleteEdge = async (source, target) => {
    const newEdge = { source, target };

    try {
        const response = await fetch('http://localhost:8000/remove_edge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEdge),
        });
        const data = await response.json();
        const kCoreData = data.core_data; // Assuming your API returns the updated k-core data
        console.log('Updated core data:', kCoreData);
        processKCoreData(kCoreData)
    } catch (error) {
        alert(`Error adding edge: ${error.message}`);
    }
  };

  // Delete Node
  const deleteNode = async (nodeId) => {
    const nodeData = { node: nodeId };
    console.log('Node data:', nodeData);

    try {
        const response = await fetch('http://localhost:8000/remove_node', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nodeData),
        });

        if (!response.ok) {
            throw new Error('Failed to delete node');
        }

        const data = await response.json();
        const kCoreData = data.core_data; // Assuming your API returns the updated k-core data
        console.log('Updated core data:', kCoreData);
        processKCoreData(kCoreData)
    } catch (error) {
        alert(`Error deleting node: ${error.message}`);
      }
    };
  
  // Generating Sample Graphs
  const handleValueChange = async (value) => {
    setSelectedValue(value);
    sampleGraph(value);
    console.log('Selected Value:', value);
  };
  const sampleGraph = async (value) => {
    try {
      const response = await fetch('http://localhost:8000/initialize_graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: value }) // Send '1', '2', or '3'
      });
  
      if (!response.ok) {
        throw new Error(`Failed to post graph data: ${response.status}`);
      }
  
      const data = await response.json();
      const kCoreData = data.core_data;
      console.log('Sample Graph Nodes', kCoreData);
      processKCoreData(kCoreData);
    } catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
  }

  // Initial graph Data
  const initialGraphData = async (value) => {
    try {
      const response = await fetch('http://localhost:8000/initialize_graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: value }) // Send '1', '2', or '3'
      });
  
      if (!response.ok) {
        throw new Error(`Failed to post graph data: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Core nodes:', data.core_data);
      return data.core_data;
  
    } catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
  };
  //Initial Graph
  const generateInitialGraph = async (value) => {
    const data = await initialGraphData(value);
    console.log('Nodes', data); // Log core nodes
    if (!data) {
        console.error('No core nodes data available. Cannot generate initial data.');
        return; // Exit if there was an error
    }
    processKCoreData(data); // Process k-core data
};

  useEffect(() => {
    generateInitialGraph(selectedValue);
  }, [selectedValue]);

  const currentGraphData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/get_current_graph', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to post graph data: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Current Graph', data.core_data);
      setGraphData(data.core_data);
      const maxKCore = Math.max(...Object.keys(data.core_data).map(Number));
      setMaxKCore(maxKCore);
      
  
    }
    catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    currentGraphData();
  }, []);

  const refreshGraph = async () => {  
    currentGraphData();
  };

  const kCoreValuesArray = Array.from({ length: maxKCore }, (_, i) => (i + 1).toString());

  // const maxKCoreValue = async() => {
  //   data = await currentGraphData();
  //   const maxKCore = Math.max(...Object.keys(data).map(Number));
  //   return maxKCore;
  // };

  const handleKCoreChange = async (value) => {
    // currentGraphData();
    setSelectedKCore(value);
    console.log('Selected K-Core:', value);
    dynamicGraph(value);
  }

  const dynamicGraph = async (value) => {
    if (!graphData) {
        console.error('No graph data available. Cannot generate graph.');
        return; 
    }

    console.log('Graph Data:', graphData);
    const kCoreValue = parseInt(value, 10);
    const filteredData = {};

    const maxKCore = Math.max(...Object.keys(graphData).map(Number));
    for (let k = maxKCore; k >= kCoreValue; k--) {
        if (graphData[k]) {
            filteredData[k] = {
                nodes: [...graphData[k].nodes], 
                edges: [...graphData[k].edges]  
            };
        }
    }

    console.log('Filtered Data:', filteredData);
    processKCoreData(filteredData);

}



  const fileInputRef = useRef(null);
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const edges = parseGraphData(content);
            console.log('Uploaded edges:', edges); // Log the uploaded edges
            
            // Send the uploaded graph data to the backend
            const kCoreData = await postGraphData(edges);
            console.log('Core meow:', kCoreData); // Log core nodes
            processKCoreData(kCoreData); // Process k-core data
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
    // Specify the dimensions of the chart.
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);
  
    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(Nodes)
      .force("link", d3.forceLink(Links)
        .id(d => d.id)
        .strength(link => {
          const sourceCore = kCoreValues[link.source] || 0; // Get the k-core value of the source
          const targetCore = kCoreValues[link.target] || 0; // Get the k-core value of the target
          return 1 + 0.5 * Math.min(sourceCore, targetCore); // Strength based on k-core values
        }))
      .force("charge", d3.forceManyBody().strength(node => {
        const coreValue = kCoreValues[node.id] || 0; // Get the k-core value of the node
        return -10 * (5 + coreValue); // Repel higher k-core values more strongly
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
      .data(Links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));
  
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(Nodes)
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
  }, [Nodes, Links]);

    // Function to remove all SVG elements
    const clearSvg = () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };

    const exportSvg = () => {
      const svgElement = svgRef.current;
      if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = 'graph.svg'; // Specify the filename
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // Clean up the URL object
      }

    }
  return (
    <div>
      <div className="flex flex-row mb-4 justify-center"> 
      <div className="flex flex-col mb-2">
            <div className="flex flex-row mb-2">
                <div className="mr-2">
                    <Label htmlFor="addEdgeSource" className="ml-1 text-md">Source Node:</Label>
                    <Input
                        id="addEdgeSource"
                        type="text"
                        placeholder="Source node"
                        value={addEdgeSource}
                        style={{ width: '100%' }} // Set width to 100% for better responsiveness
                        onChange={e => setAddEdgeSource(e.target.value)}
                    />
                </div>
                <div className="mr-2 ">
                    <Label htmlFor="addEdgeTarget" className="ml-1 text-md">Edge Target:</Label>
                    <Input
                        id="addEdgeTarget"
                        type="text"
                        placeholder="Target node"
                        value={addEdgeTarget}
                        style={{ width: '100%' }} // Set width to 100%
                        onChange={e => setAddEdgeTarget(e.target.value)}
                    />
                </div>
                <div className="flex pt-4">
                    <Button 
                        onClick={() => addEdge(addEdgeSource, addEdgeTarget)} 
                        className="mt-2 text-md"
                    > Add Edge </Button>
                </div>
            </div>
            <div className="flex flex-row mb-2">
                <div className="mr-2">
                    <Label htmlFor="deleteEdgeSource" className="ml-1 text-md">Source Node:</Label>
                    <Input
                        id="deleteEdgeSource"
                        type="text"
                        placeholder="Source node"
                        value={deleteEdgeSource}
                        style={{ width: '100%' }} // Set width to 100% for better responsiveness
                        onChange={e => setDeleteEdgeSource(e.target.value)}
                    />
                </div>
                <div className="mr-2">
                    <Label htmlFor="deleteEdgeTarget" className="ml-1 text-md">Edge Target:</Label>
                    <Input
                        id="deleteEdgeTarget"
                        type="text"
                        placeholder="Target node"
                        value={deleteEdgeTarget}
                        style={{ width: '100%' }} // Set width to 100%
                        onChange={e => setDeleteEdgeTarget(e.target.value)}
                    />
                </div>
                <div className="flex pt-4">
                    <Button 
                        onClick={() => deleteEdge(deleteEdgeSource, deleteEdgeTarget)} 
                        className="mt-2 text-md"
                    >
                        Delete Edge
                    </Button>
                </div>
            </div>
            <div className="flex flex-col">
                <div className="flex mr-2 mb-2 mt-2">
                <Label htmlFor="deleteNodeId" className="text-md">Delete Node:</Label>
                </div>
                <div className="flex flex-row mb-2">
                      <Input
                        id="deleteNodeId"
                        type="text"
                        placeholder="Enter node ID to delete"
                        value={deleteNodeId}
                        onChange={e => setDeleteNodeId(e.target.value)}
                        style={{ width: '100%' }} // Set width to 50%
                        className="mr-2" // Keep any additional styles
                      />
                      <Button className="text-md" onClick={() => deleteNode(deleteNodeId)}>Delete Node</Button>
                </div>  
            </div>
      </div>

      <div className="flex flex-col ml-20 mt-3">
      <div className="flex-1 ">
        <div className="mt-3 mb-2">
        <Button onClick={handleButtonClick} className="mr-2 text-md">Upload Graph</Button>
        <Button onClick={clearSvg} className="mr-2 text-md">Clear Graph</Button>
        <Button onClick={exportSvg} className="mr-2 text-md">Export Graph</Button>
        <input
          type="file"
          accept=".txt" // or the appropriate file types
          onChange={handleFileUpload}
          ref = {fileInputRef}
          style={{ display: 'none' }} // Hide the file input
        />
        </div>
          <div className="mb-4">
            <h1 className="font-bold mt-4 mb-2 text-lg">Sample Graphs</h1>
            <ToggleGroup type="single" defaultValue= {selectedValue} onValueChange={handleValueChange}>
              <ToggleGroupItem value="1" className ="text-lg font-medium">Small</ToggleGroupItem>
              <ToggleGroupItem value="2" className="text-lg font-semibold">Medium</ToggleGroupItem>
              <ToggleGroupItem value="3" className="text-lg font-extrabold">Large</ToggleGroupItem>
            </ToggleGroup>

        </div>
        <div>
              <h1 className="font-bold mt-4 mb-1 text-lg">Select K-Core Value</h1>
              <ToggleGroup type="single" defaultValue={selectedKCore} onValueChange={handleKCoreChange}>
            {kCoreValuesArray.map(value => (
                <ToggleGroupItem key={value} value={value} className="text-lg">
                    {value}-core
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
          </div>
    </div>
    </div>
        
    </div>

    <div className="flex-1 mr-1">
        <svg ref={svgRef} style={{ width: '300', height: '300' }} />
    </div>
  </div>

);
};



