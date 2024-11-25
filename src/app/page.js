'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ForceDirectedGraph from "./graph.jsx"
import DelaunayGraph from "./graph2.jsx"
import Menu from "./header"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"



export default function page() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <Menu />
      </div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4 ml-4 justify-self-center"> K-Core Algorithm Visualizer</h1>
        <div className="flex items-start mt-4">
          <div className="flex-auto ml-4">
            <ForceDirectedGraph />
          </div>
        </div>
      </div>
    </div>
  )
}