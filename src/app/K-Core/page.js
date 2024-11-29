'use client';
import FDGraph from './FDGraph.jsx';

export default function KCorePage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">K-Core Algorithm Visualizer</h1>
            <div className="mt-4">
                <FDGraph />
            </div>
        </div>
    );
}