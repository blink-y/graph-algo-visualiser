'use client';

import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTreeStore } from './store';

export default function SampleGraph() {

  const router = useRouter();
  const [currentDatasetIndex, setCurrentDatasetIndex] = useState(0);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const intervalRef = useRef(null);

  //Graph State Management
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [isAutoPruning, setIsAutoPruning] = useState(false);
  const [currentPruneStep, setCurrentPruneStep] = useState(0);
  const [pruneQueue, setPruneQueue] = useState([]);
  const [isPruning, setIsPruning] = useState(false);

  // Graph Manipulation States
  const [selectedValue, setSelectedValue] = useState('1');
  const [addEdgeSource, setAddEdgeSource] = useState('');
  const [addEdgeTarget, setAddEdgeTarget] = useState('');
  const [deleteEdgeSource, setDeleteEdgeSource] = useState('');
  const [deleteEdgeTarget, setDeleteEdgeTarget] = useState('');
  const [deleteNodeId, setDeleteNodeId] = useState('');
  const fileInputRef = useRef(null);

  // Managing Tree State
  const { setTreeData } = useTreeStore();

  const handleModifyTree = async (data) => {
    setTreeData(data);
  };

  // Initialize graph and prune queue
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('http://localhost:8000/initialize_graph', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: "1" })
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('Initial graph data:', data);

        const treeData = data.timeline;
        await handleModifyTree(treeData);
        
        const datasetOrder = Object.keys(data.core_data)
          .map(Number)
          .sort((a, b) => b - a)
          .map(String);
  
        const nodeDatasetMap = {};
        datasetOrder.forEach((key) => {
          data.core_data[key].nodes.forEach((id) => {
            if (!nodeDatasetMap[id]) {
              nodeDatasetMap[id] = key;
            }
          });
        });
  
        const allNodes = Object.entries(nodeDatasetMap).map(([id, dataset]) => ({
          id: id.toString(),
          group: parseInt(dataset),
          dataset,
        }));
  
        const allEdges = [];
        const allPruneSteps = [];
  
        datasetOrder.forEach((key) => {
          const dataset = data.core_data[key];
  
          dataset.edges.forEach(([source, target]) => {
            allEdges.push({
              source: source.toString(),
              target: target.toString(),
              id: `${source}-${target}`,
              dataset: key,
            });
          });
  
          (dataset.pruned_edges || []).forEach(([s, t]) => {
            allPruneSteps.push(`${s}-${t}`);
          });
        });
  
        setDatasets(data);
        setNodes(allNodes);
        setLinks(allEdges);
        setPruneQueue(allPruneSteps.reverse());
  
      } catch (error) {
        console.error('Error fetching initial graph data:', error);
        // Consider adding error state handling here
      }
    };

    loadData();
  }, []);

  // Add this early in your component
  useEffect(() => {
    console.log('Initial pruneQueue:', pruneQueue);
  }, []);

  const pruneNextEdge = useCallback(() => {
    console.log('--- Prune Start ---');
    if(isPruning) {
      console.log('Already pruning, skipping this step');
      return;
    };
    // setIsPruning(true);

    // Use functional update to get the most current state
    setCurrentPruneStep((currentStep) => {
      console.log('Current step:', currentStep);

      if (currentStep >= pruneQueue.length) {
        console.log('All edges pruned');
        setIsAutoPruning(false);
        return currentStep;
      }

      let edgeId = pruneQueue[currentStep];
      let edgeToRemove = links.find((link) => link.id === edgeId);

      // If not found, check reverse direction
      if (!edgeToRemove) {
        const [sourceId, targetId] = edgeId.split('-');
        const reverseEdgeId = `${targetId}-${sourceId}`;
        edgeToRemove = links.find((link) => link.id === reverseEdgeId);

        if (edgeToRemove) {
          console.log(`Found reversed edge: ${reverseEdgeId}`);
          edgeId = reverseEdgeId; // Update to use the reversed ID
        } else {
          console.log(`Edge ${edgeId} not found in either direction`);
          return currentStep + 1;
        }
      }

      const { source, target } = edgeToRemove;
      
      // Api Call for Tree
      deleteEdge(source, target)

      const newLinks = links.filter((link) => link.id !== edgeId);
      console.log('Pruning edge:', source.id, target.id, edgeId);

      // Check if nodes become orphans
      const isSourceOrphan = !newLinks.some(
        (link) => link.source.id === source.id || link.target.id === source.id
      );
      const isTargetOrphan = !newLinks.some(
        (link) => link.source.id === target.id || link.target.id === target.id
      );

      console.log('Orphan status:', { isSourceOrphan, isTargetOrphan });

      // Flash and remove function
      const flashThenRemove = (node, edgeId) => {
        const nodeElement = d3.select(`circle[data-id="${node.id}"]`);
        const edgeElement = d3.select(`line[data-id="${edgeId}"]`);

        // Flash animation
        const flash = () => {
          nodeElement
            .transition()
            .attr('r', 7)
            .duration(100)
            .attr('fill', 'red')
            .transition()
            .duration(100)
            .attr('fill', 'black')
            .on('end', flash);

          edgeElement
            .transition()
            .duration(100)
            .style('stroke', 'red')
            .transition()
            .duration(100)
            .style('stroke', 'black')
            .on('end', flash);
        };

        flash();

        setTimeout(() => {
          nodeElement
            .interrupt()
            .transition()
            .duration(500)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();

          edgeElement
            .interrupt()
            .transition()
            .duration(500)
            .style('stroke-opacity', 0)
            .remove();
        }, 1000);
      };

      // Create new nodes array
      let newNodes = [...nodes];

      if (isSourceOrphan) {
        flashThenRemove(source, edgeId);
        newNodes = newNodes.filter((node) => node.id !== source.id);
      }

      if (isTargetOrphan) {
        flashThenRemove(target, edgeId);
        newNodes = newNodes.filter((node) => node.id !== target.id);
      }

      // Edge removal animation
      d3.select(`line[data-id="${edgeId}"]`)
        .interrupt()
        .transition()
        .duration(500)
        .style('stroke', 'red')
        .style('stroke-width', '3px')
        .transition()
        .duration(300)
        .style('stroke-opacity', 0)
        .style('stroke-width', '0px')
        .remove();

      // Update state after animations complete
      setTimeout(() => {
        setLinks(newLinks);
        setNodes(newNodes);

        if (simulationRef.current) {
          simulationRef.current.nodes(newNodes).force('link').links(newLinks);
          simulationRef.current.alpha(0.5).restart();
          // setIsPruning[false];
        }
      }, 1500);

      return currentStep + 1;
    });
  }, [pruneQueue, links, nodes]);

  // Auto-prune effect
  useEffect(() => {
    let intervalId;

    if (isAutoPruning) {
      intervalId = setInterval(pruneNextEdge, 1750);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPruning, currentPruneStep, links, nodes, pruneQueue.length]);

  // Effect to render the graph when Nodes or Links change
  useEffect(() => {
    if (nodes.length === 0 || !svgRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    d3.select(svgRef.current).selectAll('*').remove();

    if (!simulationRef.current) {
      simulationRef.current = d3
        .forceSimulation()
        .force(
          'link',
          d3
            .forceLink()
            .id((d) => d.id)
            .strength((link) => {
              // Stronger connections for same-group nodes
              return link.source.group === link.target.group ? 1 : 0.4;
            })
        )
        .force('charge', d3.forceManyBody().strength(-75))
        .force('center', d3.forceCenter(width / 2, height / 2));
    }

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: auto; height: auto;')
      .attr('class', 'responsive-svg');

    svg.selectAll('*').remove();

    const zoomableGroup = svg.append('g');

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        zoomableGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    const link = zoomableGroup
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 1)
      .selectAll('line')
      // .data(links, d => `${d.source}-${d.target}`)
      // .attr('data-id', d =>`${d.source}-${d.target}`)
      .data(links, (d) => d.id)
      .attr('data-id', (d) => d.id)
      .join('line')
      .attr('stroke-width', 1.5)
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    const node = zoomableGroup
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d) => color(d.group))
      .attr('data-id', (d) => d.id)
      .call(
        d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    node.append('title').text((d) => d.id);

    const simulation = simulationRef.current;

    simulation.nodes(nodes).force('link').links(links);

    simulation.alpha(1).restart();

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
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
  }, [nodes, links]);

  const handlePruneClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Button clicked - step:', currentPruneStep);
      pruneNextEdge();
    },
    [pruneNextEdge]
  ); // Only depends on pruneNextEdge

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
      console.log('Edge added successfully.', data);
      console.log("Updating Tree State");
      await handleModifyTree();
    } catch (error) {
      alert(`Error adding edge: ${error.message}`);
    }
  };

  // Placeholder function for deleting an edge
  const deleteEdge = async (source, target) => {
    console.log(`Deleting edge from ${source.id} to ${target.id}`);
    const deleteEdgeData = { source: source.id, target: target.id };
    try {
      const response = await fetch('http://localhost:8000/remove_edge', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteEdgeData),
      });
      const data = await response.json();
      console.log('Edge deleted successfully.', data);
      console.log("Updating Tree State");
      const treeData = data.timeline;
      await handleModifyTree(treeData);

    } catch (error) {
      alert(`Error deleting edge: ${error.message}`);
    }

    // Find the source and target nodes in the nodes array
    const edgeElement = d3.select(`line[data-id="${source}-${target}"]`);

    // Debugging: Log the selected edge
    console.log('Selected Edge:', edgeElement);

    // Highlight the edge with a flashing effect
    if (!edgeElement.empty()) {
      const flash = () => {
        edgeElement
          .transition() // Start a transition
          .duration(200) // Duration of each flash
          .attr('stroke', 'red') // Change edge color to red
          .transition() // Start another transition
          .duration(200) // Duration of each flash
          .attr('stroke', 'black') // Change edge color to black
          .on('end', flash); // Repeat the flashing effect
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

          console.log('Edge deleted successfully.');
        } catch (error) {
          alert(`Error deleting edge: ${error.message}`);

          // Stop the flashing effect and restore original styles
          edgeElement.interrupt(); // Stop any ongoing transitions
          edgeElement
            .attr('stroke', '#999') // Restore original color
            .attr('stroke-width', 2); // Restore original thickness
        }
      }, 5000); // 2000ms (2 seconds) delay for flashing
    } else {
      console.error('Edge not found!');
    }
  };

  // Placeholder function for handling the "Upload Graph" button click
  const handleButtonClick = () => {
    console.log('Upload Graph button clicked');
    // TODO: Implement logic to trigger file upload
  };

  // Placeholder function for clearing the graph
  const clearSvg = () => {
    console.log('Clear Graph button clicked');
    d3.select(svgRef.current).selectAll('*').remove();
  };

  // Placeholder function for exporting the graph as an SVG
  const exportSvg = () => {
    console.log('Export Graph button clicked');

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
  const exportGraphData = async () => {
    console.log('Export Graph Data button clicked');

    try {
      const response = await fetch('http://localhost:8000/get_current_graph', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
    }
  };

  // Placeholder function for handling file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File uploaded:', file.name);
      // TODO: Implement logic to process the uploaded file
    }
  };

  // Placeholder function for handling ToggleGroup value change
  const handleValueChange = (value) => {
    console.log('Selected graph size:', value);
    // TODO: Implement logic to handle the selected graph size
  };
  //End of Placeholder functions

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
          onClick={() => setIsAutoPruning((prev) => !prev)} // Toggle auto-update
          className="mr-2 mb-2 text-md"
        >
          {isAutoPruning ? 'Stop Auto-Update' : 'Start Auto-Update'}
        </Button>
        <Button onClick={handlePruneClick} disabled={isAutoPruning}>
          Prune Next Edge
        </Button>
        <div>
          Progress: {currentPruneStep} / {pruneQueue.length} edges pruned
        </div>
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
        <span className="ml-2">
          {currentDatasetIndex + 1} / {datasets.length}
        </span>
      </div>
      <div className="flex flex-row">
        <div className="flex-[2] mr-1">
          <svg
            ref={svgRef}
            style={{ width: '100%', height: '100%', border: '1px solid black' }}
          />
        </div>
        {/* Sidebar for adding and deleting nodes and edges */}
        <div className="flex-[1] ml-1 place-content-center justify-items-start">
          <div className="flex flex-col mb-2 ">
            <div className="flex flex-row mb-2">
              <div className="mr-2">
                <Label htmlFor="addEdgeSource" className="ml-1 text-md">
                  Source Node:
                </Label>
                <Input
                  id="addEdgeSource"
                  type="text"
                  placeholder="Source node"
                  value={addEdgeSource}
                  style={{ width: '100%' }}
                  onChange={(e) => setAddEdgeSource(e.target.value)}
                />
              </div>
              <div className="mr-2 ">
                <Label htmlFor="addEdgeTarget" className="ml-1 text-md">
                  Edge Target:
                </Label>
                <Input
                  id="addEdgeTarget"
                  type="text"
                  placeholder="Target node"
                  value={addEdgeTarget}
                  style={{ width: '100%' }}
                  onChange={(e) => setAddEdgeTarget(e.target.value)}
                />
              </div>
              <div className="flex pt-4">
                <Button
                  onClick={() => addEdge(addEdgeSource, addEdgeTarget)}
                  className="mt-2 text-md"
                >
                  {' '}
                  Add Edge{' '}
                </Button>
              </div>
            </div>
            <div className="flex flex-row mb-2">
              <div className="mr-2">
                <Label htmlFor="deleteEdgeSource" className="ml-1 text-md">
                  Source Node:
                </Label>
                <Input
                  id="deleteEdgeSource"
                  type="text"
                  placeholder="Source node"
                  value={deleteEdgeSource}
                  style={{ width: '100%' }}
                  onChange={(e) => setDeleteEdgeSource(e.target.value)}
                />
              </div>
              <div className="mr-2">
                <Label htmlFor="deleteEdgeTarget" className="ml-1 text-md">
                  Edge Target:
                </Label>
                <Input
                  id="deleteEdgeTarget"
                  type="text"
                  placeholder="Target node"
                  value={deleteEdgeTarget}
                  style={{ width: '100%' }} // Set width to 100%
                  onChange={(e) => setDeleteEdgeTarget(e.target.value)}
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
              <Button onClick={handleButtonClick} className="mr-2 mb-2 text-md">
                Upload Graph
              </Button>
              <Button onClick={clearSvg} className="mr-2 mb-2 text-md">
                Clear Graph
              </Button>
              <Button onClick={exportSvg} className="mr-2 mb-2 text-md">
                Export Graph
              </Button>
              <Button onClick={exportGraphData} className="mr-2 mb-2 text-md">
                Export Graph Data
              </Button>
              <input
                type="file"
                accept=".txt" // or the appropriate file types
                onChange={handleFileUpload}
                ref={fileInputRef}
                style={{ display: 'none' }} // Hide the file input
              />
            </div>
            <div className="mb-4">
              <h1 className="font-bold mt-4 mb-2 text-lg">Sample Graphs</h1>
              <ToggleGroup
                type="single"
                defaultValue={selectedValue}
                onValueChange={handleValueChange}
              >
                <ToggleGroupItem value="1" className="text-lg font-medium">
                  Small
                </ToggleGroupItem>
                <ToggleGroupItem value="2" className="text-lg font-semibold">
                  Medium
                </ToggleGroupItem>
                <ToggleGroupItem value="3" className="text-lg font-extrabold">
                  Large
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
