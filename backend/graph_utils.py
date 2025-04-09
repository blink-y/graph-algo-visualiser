import networkx as nx
from collections import defaultdict

def generate_graph(edges):
    G = nx.Graph()
    G.add_edges_from(edges)
    return G

def get_core_number(G):
    degrees = dict(G.degree())
    nodes = sorted(degrees, key=degrees.get)
    bin_boundaries = [0]
    curr_degree = 0
    for i, v in enumerate(nodes):
        if degrees[v] > curr_degree:
            bin_boundaries.extend([i] * (degrees[v] - curr_degree))
            curr_degree = degrees[v]
    node_pos = {v: pos for pos, v in enumerate(nodes)}
    core = degrees
    nbrs = {v: list(nx.all_neighbors(G, v)) for v in G}
    for v in nodes:
        for u in nbrs[v]:
            if core[u] > core[v]:
                nbrs[u].remove(v)
                pos = node_pos[u]
                bin_start = bin_boundaries[core[u]]
                node_pos[u] = bin_start
                node_pos[nodes[bin_start]] = pos
                nodes[bin_start], nodes[pos] = nodes[pos], nodes[bin_start]
                bin_boundaries[core[u]] += 1
                core[u] -= 1
    return core

def get_core_subgraph(G, k_filter, k=None, core=None):
    if core is None:
        core = get_core_number(G)
    if k is None:
        k = max(core.values())
    nodes = (v for v in core if k_filter(v, k, core))
    return G.subgraph(nodes).copy()

def get_kcore(G, k=None, core_number=None):
    def k_filter(v, k, core):
        return core[v] >= k

    return get_core_subgraph(G, k_filter, k, core_number)

def run_all_kcores(edges):
    # Step 1: Initialize with original edge directions
    G = generate_graph(edges)
    original_edges = set((u, v) for u, v in edges)  # Store original directions
    
    all_cores = {}
    k = 1
    
    # Step 2-12: Compute all k-cores while preserving edge directions
    while True:
        k_core = get_kcore(G, k)
        edges_in_core = list(k_core.edges())
        
        if not edges_in_core:
            break
            
        # Preserve original edge directions
        directed_edges = set()
        for u, v in edges_in_core:
            if (u, v) in original_edges:
                directed_edges.add((u, v))
            else:
                directed_edges.add((v, u))
        
        all_cores[k] = {
            'nodes': set(k_core.nodes()),
            'edges': directed_edges  # Now using ordered tuples
        }
        k += 1
    
    if not all_cores:
        return {}
    
    # Step 13-21: Process cores with consistent edge directions
    final_cores = {}
    max_k = max(all_cores.keys())
    pruning_data = {k: {'nodes': set(), 'edges': set()} for k in all_cores}
    
    # Highest core
    final_cores[max_k] = {
        'nodes': list(all_cores[max_k]['nodes']),
        'edges': list(all_cores[max_k]['edges']),  # Already ordered
        'pruned_edges': []
    }
    
    # Lower cores
    for k in range(max_k-1, 0, -1):
        current_nodes = all_cores[k]['nodes']
        current_edges = all_cores[k]['edges']
        higher_nodes = all_cores[k+1]['nodes']
        higher_edges = all_cores[k+1]['edges']
        
        unique_nodes = current_nodes - higher_nodes
        unique_edges = current_edges - higher_edges
        
        pruned_nodes = current_nodes - higher_nodes
        pruned_edges = set()
        
        for node in pruned_nodes:
            for neighbor in G.neighbors(node):
                if neighbor in current_nodes:
                    # Check original edge direction
                    if (node, neighbor) in original_edges:
                        pruned_edges.add((node, neighbor))
                    elif (neighbor, node) in original_edges:
                        pruned_edges.add((neighbor, node))
        
        for u, v in current_edges:
            if u in pruned_nodes and v in pruned_nodes:
                # Maintain original direction
                if (u, v) in original_edges:
                    pruned_edges.add((u, v))
                else:
                    pruned_edges.add((v, u))
        
        pruning_data[k]['nodes'] = pruned_nodes
        pruning_data[k]['edges'] = pruned_edges
        
        if unique_nodes:
            final_cores[k] = {
                'nodes': list(unique_nodes),
                'edges': list(unique_edges),
                'pruned_edges': list(pruned_edges)
            }
    
    return final_cores

def get_affected_region(G, node=None, edge=None, radius=2):
    affected_nodes = set()
    
    if node is not None:
        affected_nodes.update(nx.single_source_shortest_path_length(G, node, cutoff=radius))
    
    elif edge is not None:
        source, target = edge
        affected_nodes.update(nx.single_source_shortest_path_length(G, source, cutoff=radius))
        affected_nodes.update(nx.single_source_shortest_path_length(G, target, cutoff=radius))
    
    return G.subgraph(affected_nodes)

def update_core_data(old_core_data, affected_nodes, new_local_core_data):
    updated_core_data = dict(old_core_data)
    
    for k, data in updated_core_data.items():
        data['nodes'] = [n for n in data['nodes'] if n not in affected_nodes]
        data['edges'] = [e for e in data['edges'] if e[0] not in affected_nodes and e[1] not in affected_nodes]
    
    for k, data in new_local_core_data.items():
        if k not in updated_core_data:
            updated_core_data[k] = data
        else:
            updated_core_data[k]['nodes'].extend(data['nodes'])
            updated_core_data[k]['edges'].extend(data['edges'])
    
    return updated_core_data