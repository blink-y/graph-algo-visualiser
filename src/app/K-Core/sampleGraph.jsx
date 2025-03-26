"use client";

import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

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
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = zoomableGroup.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => color(d.group))
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
      <div className="flex-1 mr-1">
        <svg ref={svgRef} style={{ width: '700px', height: '1000px', border: '1px solid black' }} />
      </div>
    </div>
  );
}