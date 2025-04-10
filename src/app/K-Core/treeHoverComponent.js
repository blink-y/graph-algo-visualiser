import React, { memo } from 'react';

export const TreeHover = memo(({ nodeData }) => {
  if (!nodeData) return null;

  const source_node = nodeData.source_node || 'NULL';
  const target_node = nodeData.target_node || 'NULL';
  const edge = `${source_node} - ${target_node}`;

  const getEdgeActionDetails = (action) => {
    switch (action) {
      case 0: return { text: 'Delete edge:', color: 'text-red-600' };
      case 1: return { text: 'Add edge:', color: 'text-green-600' };
      default: return { text: 'Root Node:', color: 'text-gray-600' };
    }
  };

  const { text, color } = getEdgeActionDetails(nodeData.action);
  return (
    <div className="relative">
      <div className="w-80 bg-white p-4 rounded-md shadow-lg border border-gray-200">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Node ID: {nodeData.id}</h4>
          <p className={`text-sm ${color}`}>
            {text} {edge || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
});