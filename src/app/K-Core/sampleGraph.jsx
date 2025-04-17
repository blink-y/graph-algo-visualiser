'use client';

import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import React, { useState, useEffect, useRef, useCallback, act } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTreeStore, useActionStore } from './store';
import { processGraphData } from './processGraphData';
import { flashEdge, flashNode } from './animation';
import { createLegend } from './graphLegend';
import { updateDensityVisualization } from './densityGauge';
import LogPanel from './logPanel';

export default function SampleGraph() {
  const router = useRouter();
  const [currentDatasetIndex, setCurrentDatasetIndex] = useState(0);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [datasets, setDatasets] = useState([]);

  //Refs
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const intervalRef = useRef(null);
  const linksRef = useRef([]);
  const nodesRef = useRef([]);
  const actionProcessingRef = useRef(false);

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
  const fileInputRef = useRef(null);

  // Managing Tree State
  const { setTreeData } = useTreeStore();
  const { actionSequence, clearActionSequence } = useActionStore();

  // Graph Stats
  const [density, setDensity] = useState(0);

  // Logging
  const [edgeLogs, setEdgeLogs] = useState([]);

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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: selectedValue }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        //console.log('Initial graph data:', data);

        const treeData = data.timeline;
        await handleModifyTree(treeData);

        const processedData = processGraphData(data);
        //console.log('Processed graph data:', processedData);
        setDatasets(data);
        setNodes(processedData.nodes);
        setLinks(processedData.edges);
        setPruneQueue(processedData.pruneSteps);
      } catch (error) {
        console.error('Error fetching initial graph data:', error);
      }
    };

    loadData();
  }, [selectedValue]);

  const pruneNextEdge = useCallback(() => {
    if (isPruning) {
      //console.log('Already pruning, skipping this step');
      return;
    }

    setIsPruning(true);

    //console.log('--- Prune Start ---');

    // Use functional update to get the most current state
    setCurrentPruneStep((currentStep) => {
      const currentPruneQueue = pruneQueue;

      if (currentStep >= currentPruneQueue.length) {
        //console.log('All edges pruned');
        alert('All edges pruned');
        setIsAutoPruning(false);
        setIsPruning(false);
        return currentStep;
      }

      let edgeId = currentPruneQueue[currentStep];
      let edgeToRemove = links.find((link) => link.id === edgeId);

      if (!edgeToRemove) {
        //console.log('Edge not found in current links:', edgeId);
        setIsPruning(false);
        return currentStep + 1;
      }

      const { source, target } = edgeToRemove;
      // Api Call
      deleteEdge(source.id, target.id, '1');
      return currentStep + 1;
    });
  }, [pruneQueue, links, nodes, isPruning]);

  // Auto-prune effect
  useEffect(() => {
    let intervalId;

    if (isAutoPruning) {
      intervalId = setInterval(pruneNextEdge, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPruning, currentPruneStep, links, nodes, pruneQueue.length]);

  const calculateDensity = useCallback(() => {
    const n = nodes.length;
    if (n < 2) return 0;
    return (2 * links.length) / (n * (n - 1));
  }, [nodes, links]);

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
              return link.source.group === link.target.group ? 1 : 0.4;
            })
        )
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(width / 2, height / 2));
    }

    const svg = d3.select(svgRef.current)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .style('overflow', 'hidden');

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
      .data(links, (d) => d.id)
      .join('line')
      .attr('data-id', d => d.id)
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
    
    // After creating your nodes/links
    createLegend(zoomableGroup, nodes, color);
    
    const currentDensity = calculateDensity();
    setDensity(currentDensity);
    updateDensityVisualization(currentDensity);
    
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
    
  }, [nodes, links, calculateDensity]);
  
  const handlePruneClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Button clicked - step:', currentPruneStep);
      pruneNextEdge();
    },
    [pruneNextEdge]
  );

  //function for adding an edge
  const addEdge = async (source, target, algo_running, signal) => {
    if (signal?.aborted) throw new Error('Operation cancelled');
    logEdgeOperation('ADD_EDGE_START', { source, target });

    try {
      const newEdge = { source: source, target: target, algo_running: algo_running };
      const response = await fetch('http://localhost:8000/add_edge', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEdge),
      });

      const updatedData = await response.json();
      console.log('Post-Add Graph Data', updatedData);

      const {
        nodes: newNodes,
        edges: newEdges,
        pruneSteps,
        datasets,
      } = processGraphData(updatedData);

      console.log('Processed graph data after adding edge:', {
        nodes: newNodes,
        edges: newEdges,
        pruneSteps,
        datasets,
      });

      const animateNodes = () => {
        return new Promise((resolve) => {
          flashNode({ id: source }, 'white', 500);
          flashNode({ id: target }, 'white', 500);

          setTimeout(resolve, 500);
        });
      };
      await animateNodes();

      setTimeout(() => {
        setDatasets(datasets);
        setNodes((prevNodes) => {
          const nodeMap = new Map(prevNodes.map((node) => [node.id, node]));
          const updatedNodes = [];
          let nodesChanged = false;

          for (const newNode of newNodes) {
            const existingNode = nodeMap.get(newNode.id);
            if (!existingNode || existingNode.group !== newNode.group) {
              nodesChanged = true;
              if (existingNode) {
                console.log(
                  'Node changed:',
                  newNode.id,
                  'from',
                  existingNode?.group,
                  'to',
                  newNode.group
                );
                existingNode.group = newNode.group;
                updatedNodes.push(existingNode);
              } else {
                console.log('Node added:', newNode.id, 'group:', newNode.group);
                updatedNodes.push(newNode);
              }
            } else {
              updatedNodes.push(existingNode);
            }
          }

          //console.log('Updated nodes:', updatedNodes);

          if (prevNodes.length !== newNodes.length) {
            nodesChanged = true;
          }

          return nodesChanged ? updatedNodes : prevNodes;
        });

        setLinks((prevEdges) => {

          console.log('Previous edges in the Graph:', prevEdges);
          console.log('New edges from API:', newEdges);

          const existingKeys = new Set(
            prevEdges.map(edge => {
              const src = typeof edge.source == 'object' ? edge.source.id : edge.source;
              const tgt = typeof edge.target == 'object' ? edge.target.id : edge.target;
              return [src, tgt].sort().join('-');
            })
          );
        
          // Filter new edges
          const newEdgesToAdd = newEdges.filter(newEdge => {
            const src = typeof newEdge.source == 'object' ? newEdge.source.id : newEdge.source;
            const tgt = typeof newEdge.target == 'object' ? newEdge.target.id : newEdge.target;
            return !existingKeys.has([src, tgt].sort().join('-'));
          });
        
          // DEBUG: Log what's being added
          console.log('Adding new edges:', newEdgesToAdd.map(e => e.id));

          const updatedEdges = [...prevEdges, ...newEdgesToAdd];
          console.log('Total edges after addition:', updatedEdges.length); // Edge count
          console.log('All edges after addition:', updatedEdges); // All edges
          
          return updatedEdges;
        });

        setPruneQueue(pruneSteps);
        setCurrentPruneStep(0);
        setIsAutoPruning(false);
        setIsPruning(false);

        if (simulationRef.current) {
          // Get fresh references
          const currentNodes = nodesRef.current;
          const currentLinks = linksRef.current;
          
          // Rebind all forces with current data
          simulationRef.current
            .nodes(currentNodes)
            .force('link', d3.forceLink(currentLinks).id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-50))
            .alpha(1) // Reset alpha for strong restart
            .restart();
        }

        console.log('Final edge count after state update:', links.length);
        console.log('Final edges after state update:', links);
      }, 0);

      console.log('link after setting:', links);
      if (algo_running === '0' || algo_running === '1') {
        console.log('Updating Tree State');
        await handleModifyTree(updatedData.timeline);
      }

      console.log('Final edge count:', links.length);
      console.log('Final edges:', links);

      logEdgeOperation('ADD_EDGE_COMPLETE', {
        source,
        target,
        newEdgeId: `${source}-${target}`,
        nodeCount: nodes.length,
        edgeCount: links.length,
      });
    } catch (error) {
      alert(`Error adding edge: ${error.message}`);
      logEdgeOperation('ADD_EDGE_ERROR', {
        source,
        target,
        error: error.message,
      });
    }
  };

  useEffect(() => {
    linksRef.current = links;
    nodesRef.current = nodes;
    console.log('Ref: Current Links and Nodes', {
      links: linksRef.current,
      nodes: nodesRef.current,
    });
  }, [links, nodes]);

  //function for deleting an edge
  const deleteEdge = async (sourceId, targetId, algo_running, signal) => {
    if(signal?.aborted) throw new Error('Operation cancelled')
    
    const edgeId = `${sourceId}-${targetId}`;
    logEdgeOperation('DELETE_EDGE_START', {source: sourceId,target: targetId,algo_running,});

    try {

      const currentLinks = [...linksRef.current];
      const currentNodes = [...nodesRef.current];
      console.log('Current Links and Nodes before deletion:', {
        links: currentLinks,
        nodes: currentNodes,
      }
      )

      const edgeIndex = currentLinks.findIndex(link => link.id === edgeId);
      if (edgeIndex === -1) {
        console.warn('Edge not found for deletion:', edgeId);
        return;
      }

      const response = await fetch('http://localhost:8000/remove_edge', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceId,
          target: targetId,
          algo_running
        }),
      });
      const updatedData = await response.json();
      console.log('Edge deleted successfully.', updatedData);

      const {
        nodes: newNodes,
        edges: newEdges,
        pruneSteps,
        datasets,
      } = processGraphData(updatedData);

      setPruneQueue(pruneSteps);
      setDatasets(datasets);

      if (algo_running === '0') {
        setCurrentPruneStep(0);
        setIsAutoPruning(false);
      }
      setIsPruning(false);
      
      const newLinks = currentLinks.filter((link) => link.id !== edgeId);
      const isSourceOrphan = !newLinks.some(
        (link) => link.source.id == sourceId || link.target.id == sourceId
      );
      const isTargetOrphan = !newLinks.some(
        (link) => link.source.id == targetId || link.target.id == targetId
      );
      
      const sourceNode = currentNodes.find((node) => node.id == (sourceId));
      const targetNode = currentNodes.find((node) => node.id == (targetId));
      console.log('Current Nodes', currentNodes);
      console.log('Source Node:', sourceNode, 'Target Node:', targetNode);
      
      
      // const edgeToFlash = links.find(l => l.source.id === sourceId && l.target.id === targetId);
      const edgeToFlash = links.find(link => link.id === edgeId);
      console.log('Edge to flash:', edgeToFlash);
      console.log('Is Source Orphan:', isSourceOrphan, 'Is Target Orphan:', isTargetOrphan);
      console.log('Source Node:', sourceNode, 'Target Node:', targetNode);
      // Flash the edge and nodes if they are orphans
      
      if (edgeToFlash) flashEdge(edgeToFlash, 'red', 250);
      if (isSourceOrphan && sourceNode) flashNode(sourceNode, 'red', 250);
      if (isTargetOrphan && targetNode) flashNode(targetNode, 'red', 250);
      await new Promise(resolve => setTimeout(resolve, 250));
      
      setLinks(newLinks);
      setNodes(prevNodes => {
        let updatedNodes = prevNodes.filter(n => {
          if (isSourceOrphan && n.id == sourceId) return false;
          if (isTargetOrphan && n.id == targetId) return false;
          return true;
        })

       if(algo_running === '1') {
          return updatedNodes
        } else {
          const newNodesMap = new Map(newNodes.map((node) => [node.id, node]));
          let nodesChanged = false;

          const mergedNodes = updatedNodes.map(node => {
            const updatedNode = newNodesMap.get(node.id);

            if (updatedNode && updatedNode.group !== node.group) {
              console.log('Node group changed:', node.id,'from', node.group,'to', updatedNode.group);
              nodesChanged = true;
              const newNode = {...node};
              newNode.group = updatedNode.group;
              return newNode;
            }
            return node;
          })
          return nodesChanged ? mergedNodes : updatedNodes;
        }
      });

      if (algo_running === '0' || algo_running === '1') {
        await handleModifyTree(updatedData.timeline);
      }

      setTimeout(() => {
        if (simulationRef.current) {
          // Get fresh references
          const currentNodes = nodesRef.current;
          const currentLinks = linksRef.current;
          
          // Rebind all forces with current data
          simulationRef.current
            .nodes(currentNodes)
            .force('link', d3.forceLink(currentLinks).id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-50))
            .alpha(1) // Reset alpha for strong restart
            .restart();
        }

        logEdgeOperation('DELETE_EDGE_COMPLETE', {
          source: sourceId,
          target: targetId,
          edgeId: `${sourceId}-${targetId}`,
          nodeCount: nodes.length,
          edgeCount: links.length,
        });
      }, 0);

    } catch (error) {
      alert(`Error deleting edge: ${error.message}`);
      logEdgeOperation('DELETE_EDGE_ERROR', {
        source: sourceId,
        target: targetId,
        error: error.message,
      });
    }
  };

  //Needs useCallback to prevent re-renders
  useEffect(() => {
    const processActions = async () => {
      if (actionProcessingRef.current || !actionSequence?.length) return;
      
      actionProcessingRef.current = true;
      try {
        for (const { action, source, target } of actionSequence) {
          const controller = new AbortController();
          
          try {
            if (parseInt(action) === 1) {
              await addEdge(source, target, "2", controller.signal);
            } else if (parseInt(action) === 0) {
              await deleteEdge(source, target, 2, controller.signal);
            }
            await clearActionSequence();
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error(`Action failed:`, error);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } finally {
            controller.abort();
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } finally {
        actionProcessingRef.current = false;
      }
    };
  
    processActions();
  }, [actionSequence]);

  //for handling the "Upload Graph" button click
  const handleButtonClick = () => {
    console.log('Upload Graph button clicked');
    // TODO: Implement logic to trigger file upload
  };

  //for clearing the graph
  const clearSvg = () => {
    console.log('Clear Graph button clicked');
    d3.select(svgRef.current).selectAll('*').remove();
  };

  //for exporting the graph as an SVG
  const exportSvg = () => {
    console.log('Export Graph button clicked');

    const svgElement = svgRef.current;
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'graph.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  //for exporting the graph data
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
    setSelectedValue(value);
  };

  const handleDeleteEdge = async (source, target) => {
    console.log(`Deleting edge from ${source} to ${target}`);
    try {
      await deleteEdge(source, target, '0');
    } catch (error) {
      alert(`Error deleting edge: ${error.message}`);
    }
  };

  const logEdgeOperation = (action, details) => {
    const logEntry = { action, ...details };
    setEdgeLogs((prevLogs) => [...prevLogs, logEntry]);
    console.log(`[Edge Operation] ${action}:`, details);
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="flex flex-row mb-4 justify-center">
        <Button
          onClick={() => setIsAutoPruning((prev) => !prev)}
          className="mr-2 mb-1 text-md"
        >
          {isAutoPruning ? 'Stop Auto-Update' : 'Start Auto-Update'}
        </Button>
        <Button onClick={handlePruneClick} disabled={isAutoPruning}>
          Prune Next Edge
        </Button>
        <div className="ml-2 mt-1.5 text-md font-bold">
          Progress: {currentPruneStep} / {pruneQueue.length} edges pruned
        </div>
      </div>
      <div className="flex flex-row h-full w-full">
        
        {/* Graph Area */}
        <div className="flex-[2] mr-1 min-h-0 min-w-0 relative" style={{ border: '2px solid black' }}>
          <svg
            ref={svgRef}
            className="absolute w-full h-full"
          />
        </div>

        {/* Sidebar */}
        <div className="flex-[1] ml-1 place-content-center justify-items-start">
          <div className="flex flex-col mb-4">
            <h1 className="font-bold mt-4 text-md">Graph Stats</h1>
            <span> No. of Nodes: {nodes.length}</span>
            <span> No. of Edges: {links.length}</span>
            <div className="density-meter">
              <div
                id="density-gauge"
                className="gauge-fill"
                style={{ width: `${density * 100}%` }}
              />
              <span className="density-text">
                Graph Density: {(density * 100).toFixed(1)}%
              </span>
            </div>
          </div>
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
                  onClick={() => addEdge(addEdgeSource, addEdgeTarget, '0')}
                  className="mt-2 text-md"
                  disabled={isAutoPruning}
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
                  style={{ width: '100%' }}
                  onChange={(e) => setDeleteEdgeTarget(e.target.value)}
                />
              </div>
              <div className="flex pt-4">
                <Button
                  disabled={isAutoPruning}
                  onClick={() =>
                    handleDeleteEdge(deleteEdgeSource, deleteEdgeTarget)
                  }
                  className="mt-2 text-md"
                >
                  Delete Edge
                </Button>
              </div>
            </div>
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
          <div className="mt-4 w-full">
            <LogPanel logs={edgeLogs} onClear={() => setEdgeLogs([])} />
          </div>
        </div>
      </div>
    </div>
  );
}
