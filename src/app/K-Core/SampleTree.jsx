import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export default function Tree({ width, height }) {
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
        const treeLayout = d3.tree().size([height-400, width+200]);
        treeLayout(root);
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        svg.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            )
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2);

        const nodes = svg.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodes.append("circle")
            .attr("r", 1)
            .attr("fill", "#fff")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3);

        nodes.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? 13 : -13)
            .attr("text-anchor", d => d.children ? "start" : "end")
            .text(d => d.data.id)
            .attr("fill", "#333")
            .attr("font-size", "12px");

    }, [treeData, width, height]);

    return (
        <svg ref={svgRef} width={width} height={height}>
            <g />
        </svg>
    );
};