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
    G = generate_graph(edges)
    core_data = {}
    pruning_data = {}  # To store nodes and edges pruned at each k
    k = 1

    # Collect all k-cores
    while True:
        k_core = get_kcore(G, k)
        k_core_edges = k_core.edges()

        if not k_core_edges:  # If there are no edges, break the loop
            break

        # Get the nodes in the current k-core
        nodes_in_k_core = set(k_core.nodes())

        # If k > 1, calculate the nodes and edges pruned from the previous k-core
        if k > 1:
            nodes_in_previous_core = core_data[k - 1]['nodes']
            pruned_nodes = nodes_in_previous_core - nodes_in_k_core
            pruned_edges = []

            # Find edges that were removed during pruning
            for node in pruned_nodes:
                pruned_edges.extend([(node, neighbor) for neighbor in G.neighbors(node) if neighbor in nodes_in_previous_core])

            pruning_data[k - 1] = {
                'nodes': list(pruned_nodes),
                'edges': list(set(pruned_edges))  # Remove duplicate edges
            }

        # Store the current k-core data
        core_data[k] = {
            'nodes': nodes_in_k_core,
            'edges': set(frozenset((u, v)) for u, v in k_core_edges),
            'pruned_edges': pruning_data.get(k - 1, {'nodes': [], 'edges': []})  # Add pruned edges
        }
        k += 1

    # Handle pruning for the last k-core (no higher core to compare with)
    pruning_data[k - 1] = {'nodes': [], 'edges': []}  # No pruning for the highest k-core

    # Finalize core data
    final_core_data = {}
    highest_core = k - 1

    for current_k in range(highest_core, 0, -1):
        if current_k == highest_core:
            # For highest core, include all its nodes and edges
            final_core_data[current_k] = {
                'nodes': list(core_data[current_k]['nodes']),
                'edges': list(tuple(e) for e in core_data[current_k]['edges']),
                'pruned_edges': []  # No pruned edges for the highest core
            }
        else:
            # For other cores, only include nodes and edges unique to this core
            nodes_in_current = core_data[current_k]['nodes']
            nodes_in_higher = core_data[current_k + 1]['nodes']
            edges_in_current = core_data[current_k]['edges']
            edges_in_higher = core_data[current_k + 1]['edges']

            unique_nodes = nodes_in_current - nodes_in_higher
            unique_edges = edges_in_current - edges_in_higher

            if len(unique_nodes) == 0:
                pass
            else:
                final_core_data[current_k] = {
                    'nodes': list(unique_nodes),
                    'edges': list(tuple(e) for e in unique_edges),
                    'pruned_edges': pruning_data[current_k]['edges']  # Add pruned edges
                }

    # Return the final core data
    return final_core_data

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