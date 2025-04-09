
export function processGraphData(data) {
    // Process dataset order
    const datasetOrder = Object.keys(data.core_data)
      .map(Number)
      .sort((a, b) => b - a)
      .map(String);
  
    // Map nodes to their highest dataset
    const nodeDatasetMap = {};
    datasetOrder.forEach((key) => {
      data.core_data[key].nodes.forEach((id) => {
        if (!nodeDatasetMap[id]) {
          nodeDatasetMap[id] = key;
        }
      });
    });
  
    // Create nodes array
    const allNodes = Object.entries(nodeDatasetMap).map(([id, dataset]) => ({
      id: id.toString(),
      group: parseInt(dataset),
      dataset,
    }));
  
    // Process edges and pruning steps
    const allEdges = [];
    const allPruneSteps = [];
  
    datasetOrder.forEach((key) => {
      const dataset = data.core_data[key];
  
      // Add regular edges
      dataset.edges.forEach(([source, target]) => {
        allEdges.push({
          source: source.toString(),
          target: target.toString(),
          id: `${source}-${target}`,
          dataset: key,
        });
      });
  
      // Add pruned edges
      (dataset.pruned_edges || []).forEach(([s, t]) => {
        allPruneSteps.push(`${s}-${t}`);
      });
    });
  
    return {
      nodes: allNodes,
      edges: allEdges,
      pruneSteps: allPruneSteps.reverse(),
      datasets: data
    };
  }