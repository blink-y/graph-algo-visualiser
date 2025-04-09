import * as d3 from 'd3';

export function flashEdge(source, target, color) {
    const edgeId = `${source}-${target}`;
    d3.select(`line[data-id="${edgeId}"]`)
    .transition().duration(100).style('stroke', color)
    .transition().duration(100).style('stroke', '#999')
    .transition().duration(100).style('stroke', color)
    .transition().duration(100).style('stroke', '#999');
}

export function flashNode(node, color, duration = 1000) {
    const nodeElement = d3.select(`circle[data-id="${node.id}"]`);

    if (nodeElement.empty()) {
        console.warn('Node is not found in DOM')
        return;
    }

    const flash = () => {
        nodeElement
            .transition()
            .attr('r', 7)
            .duration(100)
            .attr('fill', color)
            .transition()
            .duration(100)
            .attr('fill', 'black')
            .on('end', flash);
        
    };

    flash();

    setTimeout(() => {
        nodeElement
        .interrupt()
        .transition()
        .duration(500)
        .attr('r', 0)
        .style('opacity', 0)
        .remove();
    }, duration);
};