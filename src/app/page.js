'use client'

import React, { useRef, useEffect, useState } from "react";
import ForceDirectedGraph from "./K-Core/FDGraph.jsx";
import ForceDirectedGraph2 from "./K-Core/DTGraph.jsx";
import SampleGraph from "./K-Core/sampleGraph.jsx";
import Menu from "./header";
import Tree from "./K-Core/SampleTree.jsx";

export default function Page() {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4 ml-4 justify-self-center">Graph Algorithm Visualizer</h1>
        <div className="flex items-start mt-4">
          <div className="flex flex-col">
            <div className="flex-1" style={{ border: "2px solid black", padding: "10px" }}>
              <SampleGraph />
            </div>
            <div
              className="flex-none"
              ref={containerRef}
              style={{ border: "2px solid black", padding: "10px" }}
            >
              <h2 className="text-l font-bold mb-4 ml-4 justify-self-center">HISTREE</h2>
              <div className="flex-1 justify-self-center overflow-auto max-h-[400px] max-w-100%">
                <Tree width={1500} height={200} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}