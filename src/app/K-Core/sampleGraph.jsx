"use client";

import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function SampleGraph() {
  const router = useRouter();
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [currentDatasetIndex, setCurrentDatasetIndex] = useState(0);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const simulationRef = useRef(null);
  const intervalRef = useRef(null);

  // Graph Manipulation States
  const [selectedValue, setSelectedValue] = useState("1");
  const [addEdgeSource, setAddEdgeSource] = useState("");
  const [addEdgeTarget, setAddEdgeTarget] = useState("");
  const [deleteEdgeSource, setDeleteEdgeSource] = useState("");
  const [deleteEdgeTarget, setDeleteEdgeTarget] = useState("");
  const [deleteNodeId, setDeleteNodeId] = useState("");
  const fileInputRef = useRef(null);

  //Placeholder functions
  // Placeholder function for adding an edge
  const addEdge = async (source, target) => {
    console.log(`Adding edge from ${source} to ${target}`);

    try {

      const newEdge = { source, target };
      const response = await fetch('http://localhost:8000/add_edge', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEdge),
      });
      const data = await response.json();
  } catch (error) {
      alert(`Error adding edge: ${error.message}`);
  }
  };

  // Placeholder function for deleting an edge
  const deleteEdge = async (source, target) => {
    console.log(`Deleting edge from ${source} to ${target}`);

  // Find the source and target nodes in the nodes array
  const edgeElement = d3.select(`line[data-id="${source}-${target}"]`);

  // Debugging: Log the selected edge
  console.log("Selected Edge:", edgeElement);

    // Highlight the edge with a flashing effect
    if (!edgeElement.empty()) {
        const flash = () => {
            edgeElement
                .transition() // Start a transition
                .duration(200) // Duration of each flash
                .attr("stroke", "red") // Change edge color to red
                .transition() // Start another transition
                .duration(200) // Duration of each flash
                .attr("stroke", "black") // Change edge color to black
                .on("end", flash); // Repeat the flashing effect
        };

        // Start the flashing effect
        flash();

        // Add a delay before deletion
        setTimeout(async () => {
            try {
                const deleteEdgeData = { source, target };
                const response = await fetch('http://localhost:8000/delete_edge', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(deleteEdgeData),
                });
                const data = await response.json();

                // Stop the flashing effect and remove the edge
                edgeElement.interrupt(); // Stop any ongoing transitions
                edgeElement.remove();

                console.log("Edge deleted successfully.");
            } catch (error) {
                alert(`Error deleting edge: ${error.message}`);

                // Stop the flashing effect and restore original styles
                edgeElement.interrupt(); // Stop any ongoing transitions
                edgeElement
                    .attr("stroke", "#999") // Restore original color
                    .attr("stroke-width", 2); // Restore original thickness
            }
        }, 5000); // 2000ms (2 seconds) delay for flashing
    } else {
        console.error("Edge not found!");
    }
  };

  // Placeholder function for deleting a node
  // const deleteNode = async (nodeId) => {
  //   console.log(`Deleting node with ID: ${nodeId}`);

  //   // Select the node (circle element)
  //   const nodeElement = d3.select(`circle[data-id="${nodeId}"]`);

  //   // Debugging: Log the selected elements
  //   console.log("Selected Node:", nodeElement);

  //   // Highlight the node with a flashing effect
  //   if (!nodeElement.empty()) {
  //       const flash = () => {
  //           nodeElement
  //               .transition() // Start a transition
  //               .duration(200) // Duration of each flash
  //               .attr("fill", "red") // Change node color to red
  //               .attr("r", 10) // Increase node size
  //               .transition() // Start another transition
  //               .duration(200) // Duration of each flash
  //               .attr("fill", "black") // Restore original color
  //               .attr("r", 10) // Restore original size
  //               .on("end", flash); // Repeat the flashing effect
  //       };

  //       // Start the flashing effect
  //       flash();

  //       // Add a delay before deletion
  //       setTimeout(async () => {
  //           try {
  //               const nodeData = { id: nodeId };
  //               const response = await fetch('http://localhost:8000/delete_node', {
  //                   method: 'DELETE',
  //                   headers: {
  //                       'Content-Type': 'application/json',
  //                   },
  //                   body: JSON.stringify(nodeData),
  //               });
  //               const data = await response.json();

  //               // Stop the flashing effect and remove the node
  //               nodeElement.interrupt(); // Stop any ongoing transitions
  //               nodeElement.remove();

  //               console.log("Node deleted successfully.");
  //           } catch (error) {
  //               alert(`Error deleting node: ${error.message}`);
  //           }
  //       }, 5000); // 2000ms (2 seconds) delay for flashing
  //   } else {
  //       console.error("Node not found!");
  //   }
  // };

  // Placeholder function for handling the "Upload Graph" button click
  const handleButtonClick = () => {
    console.log("Upload Graph button clicked");
    // TODO: Implement logic to trigger file upload
  };

  // Placeholder function for clearing the graph
  const clearSvg = () => {
    console.log("Clear Graph button clicked");
    d3.select(svgRef.current).selectAll("*").remove();
  };

  // Placeholder function for exporting the graph as an SVG
  const exportSvg = () => {
    console.log("Export Graph button clicked");
    
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
  };

  // Placeholder function for exporting the graph data
  const exportGraphData = async() => {
    console.log("Export Graph Data button clicked");
    
      try {
          const response = await fetch('http://localhost:8000/get_current_graph', {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json'
              },
          });
  
          if (!response.ok) {
              throw new Error(`Failed to fetch graph data: ${response.status}`);
          }
  
          const data = await response.json();

          const fileData = JSON.stringify(data, null, 2);
          const blob = new Blob([fileData], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'graph_data.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
  
      } catch (error) {
          console.error('Failed to fetch graph data:', error);
          alert('Failed to fetch graph data. See console for details.');
      };
  };

  // Placeholder function for handling file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        console.log("File uploaded:", file.name);
        // TODO: Implement logic to process the uploaded file
    }
  };

  // Placeholder function for handling ToggleGroup value change
  const handleValueChange = (value) => {
    console.log("Selected graph size:", value);
    // TODO: Implement logic to handle the selected graph size
  };
  //End of Placeholder functions

  useEffect(() => {
    const loadData = async () => {
      const response = await fetch('./dataset.json');
      const data = await response.json();
      setDatasets(data);
      console.log("Datasets loaded:", data);
    };

    loadData();
  }, []);

  useEffect(() => {
    console.log("Datasets loaded:", datasets);
    if (datasets.length > 0) {
      const { nodes: newNodes, links: newLinks } = datasets[currentDatasetIndex];
      setNodes(newNodes);
      setLinks(newLinks);
    }
  }, [datasets]);

  const updateGraph = (index) => {
    if (datasets.length === 0 || !datasets[index]) {
      console.error("No dataset available at index:", index);
      return;
    }

    console.log("Updating graph with dataset index:", index);
    const { nodes: newNodes, links: newLinks } = datasets[index];
    console.log("New nodes:", newNodes);
    console.log("New links:", newLinks);

    // Create maps for quick lookup
    const currentNodesMap = new Map(nodes.map(node => [node.id, node]));
    const newNodesMap = new Map(newNodes.map(node => [node.id, node]));

    const currentLinksMap = new Map(links.map(link => [`${link.source.id}-${link.target.id}`, link]));
    const newLinksMap = new Map(newLinks.map(link => [`${link.source}-${link.target}`, link]));

    // Determine nodes to add and remove
    const nodesToAdd = [];
    const nodesToRemove = [];

    // Check for nodes to add
    for (const newNode of newNodes) {
      if (!currentNodesMap.has(newNode.id)) {
        nodesToAdd.push(newNode);
      }
    }

    // Check for nodes to remove
    for (const currentNode of nodes) {
      if (!newNodesMap.has(currentNode.id)) {
        nodesToRemove.push(currentNode);
      }
    }

    // Determine links to add and remove
    const linksToAdd = [];
    const linksToRemove = [];

    // Check for links to add
    for (const newLink of newLinks) {
      const linkKey = `${newLink.source}-${newLink.target}`;
      if (!currentLinksMap.has(linkKey)) {
        // Ensure source and target are node objects, not just IDs
        const sourceNode = newNodes.find(node => node.id === newLink.source);
        const targetNode = newNodes.find(node => node.id === newLink.target);
        if (sourceNode && targetNode) {
          linksToAdd.push({ source: sourceNode, target: targetNode });
        }
      }
    }

    // Check for links to remove
    for (const currentLink of links) {
      const linkKey = `${currentLink.source.id}-${currentLink.target.id}`;
      if (!newLinksMap.has(linkKey)) {
        linksToRemove.push(currentLink);
      }
    }

    // Function to update nodes and links one at a time
    const updateGraphElements = () => {
      if (nodesToAdd.length > 0) {
        // Add one node at a time
        const nodeToAdd = nodesToAdd.shift();
        setNodes(prevNodes => [...prevNodes, nodeToAdd]);
        setTimeout(updateGraphElements, 500); // Delay between adding nodes (500ms)
      } else if (nodesToRemove.length > 0) {
        // Remove one node at a time
        const nodeToRemove = nodesToRemove.shift();
        setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeToRemove.id));

        // Remove any links connected to the removed node
        setLinks(prevLinks => prevLinks.filter(link => 
          link.source.id !== nodeToRemove.id && link.target.id !== nodeToRemove.id
        ));

        setTimeout(updateGraphElements, 500); // Delay between removing nodes (500ms)
      } else if (linksToAdd.length > 0) {
        // Add one link at a time
        const linkToAdd = linksToAdd.shift();
        setLinks(prevLinks => [...prevLinks, linkToAdd]);
        setTimeout(updateGraphElements, 500); // Delay between adding links (500ms)
      } else if (linksToRemove.length > 0) {
        // Remove one link at a time
        const linkToRemove = linksToRemove.shift();
        setLinks(prevLinks => prevLinks.filter(link => 
          link.source.id !== linkToRemove.source.id || link.target.id !== linkToRemove.target.id
        ));
        setTimeout(updateGraphElements, 500); // Delay between removing links (500ms)
      }
    };

    // Start the update process
    updateGraphElements();
  };

  // Effect to handle auto-updating the graph
  useEffect(() => {
    if (isAutoUpdating) {
      console.log("Auto-update started"); // Log when auto-update starts
      // Start auto-update
      intervalRef.current = setInterval(() => {
        setCurrentDatasetIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % datasets.length;
          updateGraph(nextIndex);
          return nextIndex;
        });
      }, 5000); // Update every 5 seconds
    } else {
      console.log("Auto-update stopped"); // Log when auto-update stops
      // Stop auto-update
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoUpdating, datasets]);

  // Effect to render the graph when Nodes or Links change
  useEffect(() => {
    if (datasets.length === 0) return; // Ensure datasets are loaded

    const   width = window.innerWidth;
    const height = window.innerHeight;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2));
    }

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: auto; height: auto;')
      .attr('class', 'responsive-svg');

    svg.selectAll('*').remove();

    const zoomableGroup = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        zoomableGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    const link = zoomableGroup.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links, d => `${d.source}-${d.target}`)
    .join('line')
    .attr('stroke-width', 2)
    .attr('data-id', d =>`${d.source}-${d.target}`)
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

    const node = zoomableGroup.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => color(d.group))
      .attr('data-id', d => d.id)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('title').text(d => d.id);

    const simulation = simulationRef.current;

    simulation
      .nodes(nodes)
      .force('link').links(links);

    simulation.alpha(1).restart();

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

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
  }, [nodes, links, datasets]);

  const handleSliderChange = (event) => {
    const index = parseInt(event.target.value, 10);
    setCurrentDatasetIndex(index);
    if (isAutoUpdating) {
      updateGraph(index); // Only update if auto-update is enabled
    } else {
      // Render the new dataset without incremental updates
      const { nodes: newNodes, links: newLinks } = datasets[index];
      setNodes(newNodes);
      setLinks(newLinks);
    }
  };

  return (
    <div>
      <div className="flex flex-row mb-4 justify-center">
        <Button
          onClick={() => setIsAutoUpdating(prev => !prev)} // Toggle auto-update
          className="mr-2 mb-2 text-md"
        >
          {isAutoUpdating ? 'Stop Auto-Update' : 'Start Auto-Update'}
        </Button>
      </div>
      <div className="flex flex-row mb-4 justify-center">
        <input
          type="range"
          min="0"
          max={datasets.length - 1}
          value={currentDatasetIndex}
          onChange={handleSliderChange}
          className="w-64"
        />
        <span className="ml-2">{currentDatasetIndex + 1} / {datasets.length}</span>
      </div>
      <div className = "flex flex-row">
      <div className="flex-[2] mr-1">
        <svg ref={svgRef} style={{ width: '100%', height: '100%', border: '1px solid black' }} />
      </div>
      {/* Sidebar for adding and deleting nodes and edges */}
      <div className="flex-[1] ml-1 place-content-center justify-items-start">
              <div className="flex flex-col mb-2 ">
                    <div className="flex flex-row mb-2">
                        <div className="mr-2">
                            <Label htmlFor="addEdgeSource" className="ml-1 text-md">Source Node:</Label>
                            <Input
                                id="addEdgeSource"
                                type="text"
                                placeholder="Source node"
                                value={addEdgeSource}
                                style={{ width: '100%' }}
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
                                style={{ width: '100%' }}
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
                                style={{ width: '100%' }}
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
                    {/* <div className="flex flex-col">
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
                                style={{ width: '50%' }} 
                                className="mr-2" 
                              />
                              <Button className="text-md" onClick={() => deleteNode(deleteNodeId)}>Delete Node</Button>
                        </div>  
                    </div> */}
              </div>
              <div className="flex-1 ">
                      <div className="mt-3 mb-2">
                      <Button onClick={handleButtonClick} className="mr-2 mb-2 text-md">Upload Graph</Button>
                      <Button onClick={clearSvg} className="mr-2 mb-2 text-md">Clear Graph</Button>
                      <Button onClick={exportSvg} className="mr-2 mb-2 text-md">Export Graph</Button>
                      <Button onClick={exportGraphData} className="mr-2 mb-2 text-md">Export Graph Data</Button>
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
                      </div>
      </div>
      </div>
    </div>
  );
}