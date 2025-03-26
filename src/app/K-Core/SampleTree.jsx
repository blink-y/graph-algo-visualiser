import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export default function Tree({ height, width }) {
    const svgRef = useRef();
    const [treeData, setTreeData] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch("./tree.json");
                const data = await response.json();
                setTreeData(data);
                console.log("Tree data loaded:", data);
            } catch (error) {
                console.error("Failed to load tree data:", error);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!treeData) return; 

        const rootData = treeData.timeline;
        const root = d3.hierarchy(rootData);
        
        const treeLayout = d3.tree()
        .size([height, width])
        .nodeSize([40, 30]);
        
        treeLayout(root);
        
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        svg.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical()
                .x(d => d.y + 20)
                .y(d => d.x + 100)
            )
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2);
            

        const nodes = svg.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y + 20},${d.x + 100})`);

        nodes.append("circle")
            .attr("r", 3.5)
            .attr("fill", "#fff")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .on("click", handleNodeClick)
            .on("mouseover", function() {
                d3.select(this).attr("fill", "orange");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "#fff");
            });

        // nodes.append("text")
        //     .attr("dy", d => (d.depth % 2 === 0 ? -10 : 15))
        //     .attr("text-anchor", "middle")
        //     .text(d => d.data.id)
        //     .attr("fill", "#333")
        //     .attr("font-size", "10px");

    }, [treeData, width, height]);

    const handleNodeClick = (event, d) => {
        console.log("Node clicked:", d.data);
        alert(`Node clicked: ${d.data.id}`);
        
    };

    return (
        <svg ref={svgRef} width={width} height={height}>
            <g />
        </svg>
    );
};