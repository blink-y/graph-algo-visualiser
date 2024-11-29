'use client'

import ForceDirectedGraph from "./K-Core/FDGraph.jsx"
import ForceDirectedGraph2 from "./K-Core/DTGraph.jsx"
import Menu from "./header"


export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4 ml-4 justify-self-center">Graph Algorithm Visualizer</h1>
        <div className="flex items-start mt-4">
          <div className="flex-auto ml-4">
            <ForceDirectedGraph />

          </div>
        </div>
      </div>
    </div>
  )
}