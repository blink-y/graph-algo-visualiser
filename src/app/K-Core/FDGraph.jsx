"use-client";

import { useRouter } from 'next/navigation'
import * as d3 from "d3";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"; 

export default function ForceDirectedGraph() {
  const router = useRouter();
  const svgRef = useRef(null);
  const [Nodes, setNodes] = useState([]);
  const [Links, setLinks] = useState([]);
  const [addEdgeSource, setAddEdgeSource] = useState('');
  const [addEdgeTarget, setAddEdgeTarget] = useState('');
  const [deleteEdgeSource, setDeleteEdgeSource] = useState('');
  const [deleteEdgeTarget, setDeleteEdgeTarget] = useState('');
  const [deleteNodeId, setDeleteNodeId] = useState("");
  const [kCoreValues, setKCoreValues] = useState({});
  const [selectedValue, setSelectedValue] = useState('1');
  const [selectedKCore, setSelectedKCore] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [maxKCore, setMaxKCore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visualizationState, setVisualizationState] = useState('');
  const [kCliqueValues, setKCliqueValues] = useState({});
  const [kTrussValues, setKTrussValues] = useState({});
  const [maxKclique, setMaxKclique] = useState(0);
  const [maxKtruss, setMaxKtruss] = useState(0);
  const [selectedKclique, setSelectedKclique] = useState('1');
  const [selectedKtruss, setSelectedKtruss] = useState('1');
  const [kclickState, setKclickState] = useState(0);
  const [kTrussState, setKTrussState] = useState(0);

  // Upload Graph data
  const postGraphData = async (edges) => {
    try {
      const response = await fetch('http://localhost:8000/execute_algorithms', {
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
      return data.core_data;

    } catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
  };
  
  // Process K-Core Data
  const processKCoreData = (kCoreData) => {
    const nodeCoreMap = new Map();
    const nodesSet = new Set(); 
    const nodeKCoreValue = {}; 

    Object.entries(kCoreData).forEach(([kCoreValue, { nodes: nodeIds, edges }]) => {
        const numericKCoreValue = Number(kCoreValue);
        nodeIds.forEach(id => {
          nodeKCoreValue[id] = numericKCoreValue;
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
        return colorMapping[kCoreValue] || '#FFFFFF';
    };

    const nodes = Array.from(nodesSet).map(id => {
        const kCoreValue = nodeCoreMap.get(id) || 0;
        return {
            id: String(id),
            group: String.fromCharCode(65 + Math.min(kCoreValue, 4)),
            color: getColorForKCoreValue(kCoreValue) 
        };
    });

    const edgesToUpload = [];
    Object.values(kCoreData).forEach(({ edges }) => {
        edges.forEach(([source, target]) => {
            edgesToUpload.push({ source: String(source), target: String(target), value: 1 });
        });
    });

    setKCoreValues(nodeKCoreValue);
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
        const kCoreData = data.core_data;
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
        const kCoreData = data.core_data;
        processKCoreData(kCoreData)
    } catch (error) {
        alert(`Error adding edge: ${error.message}`);
    }
  };

  // Delete Node
  const deleteNode = async (nodeId) => {
    const nodeData = { node: nodeId };

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
        const kCoreData = data.core_data;
        processKCoreData(kCoreData)
    } catch (error) {
        alert(`Error deleting node: ${error.message}`);
      }
    };
  
  // Generating Sample Graphs
  const handleValueChange = async (value) => {
    setSelectedValue(value);
    sampleGraph(value);
    // console.log('Selected Value:', value);
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
      return data.core_data;
  
    } catch (error) {
      console.error('Failed to post graph data:', error);
      alert('Failed to post graph data. See console for details.');
    }
  };
  //Initial Graph
  const generateInitialGraph = async (value) => {
    const data = await initialGraphData(value);
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
      setGraphData(data.core_data);
      const maxKCore = Math.max(...Object.keys(data.core_data).map(Number));
      const maxKclique = Math.max(...Object.keys(data.clique_data).map(Number));
      const maxKtruss = Math.max(...Object.keys(data.truss_data).map(Number));

      setMaxKtruss(maxKtruss);
      setMaxKclique(maxKclique);
      console.log('Max K-Clique:', maxKclique);
      console.log('Max K-Truss:', maxKtruss);
      setMaxKCore(maxKCore);
      setKCliqueValues(data.clique_data);
      setKTrussValues(data.truss_data);
      
  
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
    console.log('Refreshing Graph');
  };

  const kCoreValuesArray = Array.from({ length: maxKCore }, (_, i) => (i + 1).toString());
  const kCliqueValuesArray = Array.from({ length: maxKclique }, (_, i) => (i + 1).toString());
  const kTrussValuesArray = Array.from({ length: maxKclique }, (_, i) => (i + 1).toString());
  
  const handleKCoreChange = async (value) => {
    setVisualizationState('k-core');
    if (value){
    // currentGraphData();
    setSelectedKCore(value);
    // console.log('Selected K-Core:', value);
    dynamicGraph(value);}
  }

  const formatKCliqueData = (kCoreValues) => {
    const formattedData = {};
    Object.entries(kCoreValues).forEach(([kCliqueValue, nodeIds]) => {
        const numericKCliqueValue = Number(kCliqueValue);
        console.log(`Processing kCliqueValue: ${kCliqueValue}`, nodeIds);
        if (Array.isArray(nodeIds)) {
            nodeIds.forEach(id => {
                if (!formattedData[id] || formattedData[id] < numericKCliqueValue) {
                    formattedData[id] = numericKCliqueValue;
                }
            });
        } else {
            console.warn(`Warning: nodeIds is not an array for kCliqueValue ${kCliqueValue}`, nodeIds);
        }
      });
    return formattedData;
  };
  const formatKTrussData = (kCoreValues) => {
    const formattedData = {};
    Object.entries(kCoreValues).forEach(([kTrussValue, nodeIds]) => {
        const numericKTrussValue = Number(kTrussValue);
        console.log(`Processing kTrussValue: ${kTrussValue}`, nodeIds);
        if (Array.isArray(nodeIds)) {
            nodeIds.forEach(id => {
                if (!formattedData[id] || formattedData[id] < numericKTrussValue) {
                    formattedData[id] = numericKTrussValue;
                }
            });
        } else {
            console.warn(`Warning: nodeIds is not an array for kCliqueValue ${kCliqueValue}`, nodeIds);
        }
      });
    return formattedData;
  };
  
  const kCliqueValueChange = async (value) => {
    const filterData = (data, threshold) => {
      console.log('Filtering data:', data);
      return Object.fromEntries(
        Object.entries(data).filter(([key, val]) => val >= threshold)
      );
      
    };
    console.log('K-Clique Values to be formatted: ', kCliqueValues);
    const formattedkCliqueData = formatKCliqueData(kCliqueValues);
    console.log('Formatted K-Clique Values:', formattedkCliqueData);
    const filteredValues = filterData(formattedkCliqueData, value); 
    console.log('filtered K-Clique Values:', filteredValues);
    setKCliqueValues(filteredValues);
    if(kclickState == 1){
    setKclickState(0);}else{setKclickState(1);}
  }

  const handleKCliqueChange = async (value) => {
    console.log('Selected K-Clique:', value);
    setVisualizationState('k-clique');
    if (value){
    setSelectedKclique(value);
    console.log('Selected K-Clique:', value);
  
    //refreshGraph();
    kCliqueValueChange(value);}
   
    // console.log('Selected K-Clique visualization:', visualizationState);


  }

  
  const handleKTrussChange = async (value) => {
    setVisualizationState('k-truss'); 
    if (value){
    setSelectedKtruss(value);
    console.log('Selected K-Truss:', value);
    kTrussValueChange(value);}
  }

  const kTrussValueChange = async (value) => {
    const filterData = (data, kTrussValue) => {
      return Object.fromEntries(
          Object.entries(data).filter(([key, value]) => value <= kTrussValue)
        );
      
      };
      console.log('K-Truss Values to be formatted: ', kTrussState);
      const formattedkTrussData = formatKTrussData(kCliqueValues);
      console.log('Formatted K-Truss Values:', formattedkTrussData);
      const filteredValues = filterData(formattedkTrussData, value); 
      console.log('filtered K-Clique Values:', filteredValues);
      setKTrussValues(filteredValues);
      if(kTrussState == 1){
      setKTrussState(0);}else{setKTrussState(1);}
  }

  const processKCorePolygonData = (value) =>{
    const kCoreGroups = {};
    for (const [nodeId, kCoreValue] of Object.entries(value)) {
      if (!kCoreGroups[kCoreValue]) {
          kCoreGroups[kCoreValue] = [];
      }
      kCoreGroups[kCoreValue].push(nodeId);
    }
    return kCoreGroups;
  }

  const dynamicGraph = async (value) => {
    if (!graphData) {
        console.error('No graph data available. Cannot generate graph.');
        return; 
    }

    // console.log('Graph Data:', graphData);
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

    // console.log('Filtered Data:', filteredData);
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
            const edges = newParseGraphData(content);
            console.log('Parsed Uploaded Graph Data:', edges);
            // Send the uploaded graph data to the backend
            const kCoreData = await postGraphData(edges);
            console.log('Problem K-Core Data:', kCoreData);
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

    const newParseGraphData = (data) => {
      const edgeLines = data.split('\n').filter(line => line.trim() !== '');
      const edges = edgeLines.map(line => {
        const [source, target] = line.split(' ').map(node => node.trim()); // Split by space instead of comma
        return [Number(source), Number(target)]; // Convert to numbers and return as an array
      });
      return edges;
    };

  useEffect(() => {
    // Dimensions of the graph.
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation = d3.forceSimulation(Nodes)
      .force("link", d3.forceLink(Links)
        .id(d => d.id)
        .strength(0.1)
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(0, 0)); 

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: auto; height: auto;")
      .attr("class", "responsive-svg");
  
    svg.selectAll("*").remove();
  
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

    simulation.on("end", () => {
      const finalPositions = Nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
      console.log("Final node positions:", finalPositions);
      drawPolygons(finalPositions);
    });

    const drawPolygons = () => {
      refreshGraph();
      let polyData = {};
      console.log('K-Core Values:', kCoreValues);
      console.log('K-Clique Values:', kCliqueValues);
      console.log('K-Truss Values:', kTrussValues);
      console.log('Visualization State: polygon', visualizationState);
      switch (visualizationState) {
        case 'k-core':
            polyData = processKCorePolygonData(kCoreValues);
            console.log('Polygon k-core');
            break;
    
        case 'k-clique':
            polyData = processKCorePolygonData(kCliqueValues);
            break;
    
        case 'k-truss':
            polyData = processKCorePolygonData(kTrussValues);
            break;

        default:
            polyData = processKCorePolygonData(kCoreValues);
            break
    }
      //Remove any previous Polygons
      svg.selectAll("polygon").remove();
      
      // Polygon for each k group
      for (const [kValue, nodeIds] of Object.entries(polyData)) {
        const finalPositions = nodeIds.map(id => {
              const node = Nodes.find(n => n.id === id);
              return node ? { x: node.x, y: node.y } : null;
          }).filter(Boolean);

          if (finalPositions.length > 2) {
              const points = finalPositions.map(node => [node.x, node.y]);
              const hull = d3.polygonHull(points);
              
              if (hull) {
                  // hardcoding colors for now
                  const colorMapping = {
                    1: 'rgba(255, 204, 204, 0.5)', // Very light pink
                    2: 'rgba(255, 153, 204, 0.5)', // Light pink
                    3: 'rgba(255, 102, 204, 0.5)', // Medium pink
                    4: 'rgba(255, 51, 204, 0.5)',  // Bright pink
                    5: 'rgba(255, 0, 204, 0.5)',   // Vivid pink
                    6: 'rgba(204, 0, 204, 0.5)',   // Deep pink
                    7: 'rgba(153, 0, 204, 0.5)',   // Violet pink
                    8: 'rgba(102, 0, 204, 0.5)',   // Purple pink
                    9: 'rgba(51, 0, 204, 0.5)',    // Bluish pink
                    10: 'rgba(255, 0, 153, 0.5)',  // Bright rose
                    11: 'rgba(255, 51, 102, 0.5)'   // Dark rose
                  };

                  const fillColor = colorMapping[kValue];
                  svg.append("polygon")
                      .datum(hull)
                      .attr("points", d => d.map(point => point.join(",")).join(" "))
                      .attr("fill", fillColor)
                      .attr("stroke", fillColor)
                      .attr("stroke-width", 1)
                      .attr("pointer-events", "none");
              }
          }
      }
  }
  
    function dragstarted(event) {
      console.log('Drag started', visualizationState);
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

    return () => {
      simulation.stop();
    };
  }, [Nodes, Links, visualizationState, kclickState, kTrussState]);

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

    const exportKCore = async () => {
      setLoading(true);
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
      } finally {
          setLoading(false);
      }
  };

  return (
    <div>
      <div className="flex flex-row mb-4 justify-center">
      <div className="flex justify-center">
      <div className="flex justify-center">
      <Menubar className="bg-white">
      <MenubarMenu>
          <MenubarTrigger
            className="hover:bg-gray-200 transition-colors duration-200"
            onClick={() => setVisualizationState('k-core')}
          >
            K-Core
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            className="hover:bg-gray-200 transition-colors duration-200"
            onClick={() => setVisualizationState('k-clique')}
          >
            K Clique
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            className="hover:bg-gray-200 transition-colors duration-200"
            onClick={() => setVisualizationState('k-truss')}
          >
            K Truss
          </MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    </div>
    </div>
        </div>
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
                        style={{ width: '100%' }} 
                        className="mr-2" 
                      />
                      <Button className="text-md" onClick={() => deleteNode(deleteNodeId)}>Delete Node</Button>
                </div>  
            </div>
      </div>

      <div className="flex flex-col ml-20 mt-3">
      <div className="flex-1 ">
        <div className="mt-3 mb-2">
        <Button onClick={handleButtonClick} className="mr-2 mb-2 text-md">Upload Graph</Button>
        <Button onClick={clearSvg} className="mr-2 mb-2 text-md">Clear Graph</Button>
        <Button onClick={exportSvg} className="mr-2 mb-2 text-md">Export Graph</Button>
        <Button onClick={exportKCore} className="mr-2 mb-2 text-md">Export Graph Data</Button>
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
        <div>
        {visualizationState === 'k-core' && (
          <>
            <h1 className="font-bold mt-4 mb-1 text-lg">Select K-Core Value</h1>
            <ToggleGroup type="single" defaultValue={selectedKCore} onValueChange={handleKCoreChange}>
              {kCoreValuesArray.map(value => (
                <ToggleGroupItem key={value} value={value} className="text-lg">
                  {value}-core
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}

        {visualizationState === 'k-clique' && (
                <>
                  <h1 className="font-bold mt-4 mb-1 text-lg">Select K-Clique Value</h1>
                  <ToggleGroup type="single" defaultValue={selectedKclique} onValueChange={handleKCliqueChange}>
                    {kCliqueValuesArray.map(value => (
                      <ToggleGroupItem key={value} value={value} className="text-lg">
                        {value}-Clique
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </>
              )}

        {visualizationState === 'k-truss' && (
                <>
                  <h1 className="font-bold mt-4 mb-1 text-lg">Select K-Truss Value</h1>
                  <ToggleGroup type="single" defaultValue={selectedKtruss} onValueChange={handleKTrussChange}>
                    {kTrussValuesArray.map(value => (
                      <ToggleGroupItem key={value} value={value} className="text-lg">
                        {value}-Truss
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </>
              )}
              </div>
        </div>
    </div>
    </div>
        
    </div>

    <div className="flex-1 mr-1">
        <svg ref={svgRef} style={{ width: '300', height: '300' }} />
    </div>
  </div>
  );
}
