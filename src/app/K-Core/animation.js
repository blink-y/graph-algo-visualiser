import * as d3 from 'd3';

export function flashEdge(link, color, duration = 1000) {
    const edgeElement = d3.select(`line[data-id="${link.id}"]`);

    if (edgeElement.empty()) {
        console.log('Edge not found:', link.id);
        return;
    } else {console.log('Edge found:', edgeElement);}

    const flash = () => {
        edgeElement
            .transition().duration(50)
            .style('stroke', color)
            .style('stroke-width', '1.5px')
            .transition().duration(50)
            .style('stroke', 'black')
            .style('stroke-width', '1.5px')
            .on('end', flash);
    };

    flash();

    setTimeout(() => {
        edgeElement.interrupt();
    }, duration);
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
            .duration(50)
            .attr('fill', color)
            .transition()
            .duration(50)
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