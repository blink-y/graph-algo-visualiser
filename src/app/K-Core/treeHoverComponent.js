import React, { memo } from 'react';

export const TreeHover = memo(({ nodeData }) => {
  if (!nodeData) return null;

  const source_node = nodeData.source_node || 'NULL';
  const target_node = nodeData.target_node || 'NULL';
  const edge = `${source_node} - ${target_node}`;

  const getEdgeActionDetails = (action) => {
    switch (action) {
      case 0: return { text: 'Delete edge:', color: 'text-red-500' };
      case 1: return { text: 'Add edge:', color: 'text-green-600' };
      default: return { text: 'Root Node:', color: 'text-white' };
    }
  };

  const { text, color } = getEdgeActionDetails(nodeData.action);
  return (
    <div className="relative">
  <div 
    className="w-80 p-4 rounded-md shadow-lg" 
    style={{
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(148, 163, 184, 0.2)'
    }}
  >
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-white">Node ID: {nodeData.id}</h4>
      <p className={`text-sm ${color}`}>
        {text} {edge || 'N/A'}
      </p>
    </div>
  </div>
</div>
  );
});