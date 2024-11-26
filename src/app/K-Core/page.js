'use client';

import Menu from '../header'; // Adjust the path if necessary
import FDGraph from './FDGraph.jsx'; // Import the FDGraph component
import DTGraph from './DTGraph.jsx'; // Import the DTGraph component

export default function KCorePage() {
    return (
        <div className="container mx-auto p-4">
            <Menu />
            <h1 className="text-2xl font-bold mb-4">K-Core Algorithm Visualizer</h1>
            <div className="mt-4">
                <FDGraph />
                <DTGraph />
            </div>
        </div>
    );
}