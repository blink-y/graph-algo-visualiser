import networkx as nx
import matplotlib.pyplot as plt
from collections import defaultdict

def generate_graph(edges):
    G = nx.Graph()
    G.add_edges_from(edges)
    
    return G

def get_core_number(G):
    degrees = dict(G.degree())
    # Sort nodes by degree.
    nodes = sorted(degrees, key=degrees.get)
    bin_boundaries = [0]
    curr_degree = 0
    for i, v in enumerate(nodes):
        if degrees[v] > curr_degree:
            bin_boundaries.extend([i] * (degrees[v] - curr_degree))
            curr_degree = degrees[v]
    node_pos = {v: pos for pos, v in enumerate(nodes)}
    # The initial guess for the core number of a node is its degree.
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

def visualize_graph(G):
    pos = nx.spring_layout(G, seed=42)
    nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=500, font_size=10)
    
    plt.title("K-core of the Graph")
    plt.show()

def run_all_kcores(edges):
    G = generate_graph(edges)
    core_data = {}
    k = 1    

    # Collect all k-cores
    while True:
        k_core = get_kcore(G, k)
        k_core_edges = k_core.edges()
        
        if not k_core_edges:  # If there are no edges, break the loop
            break
        
        core_data[k] = {
            'nodes': set(k_core.nodes()),
            'edges': set(frozenset((u,v)) for u,v in k_core_edges)
        }
        k += 1

    final_core_data = {}
    highest_core = k - 1

    for current_k in range(highest_core, 0, -1):
        if current_k == highest_core:
            # For highest core, include all its nodes and edges
            final_core_data[current_k] = {
                'nodes': list(core_data[current_k]['nodes']),
                'edges': list(tuple(e) for e in core_data[current_k]['edges'])
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
                    'edges': list(tuple(e) for e in unique_edges)
                }

    return final_core_data

def find_kclique_communities(graph, k, cliques=None):
    # Initialize or get cliques
    if cliques is None:
        cliques = list(nx.find_cliques(graph))
    
    # Create sets of nodes for each clique meeting size requirement
    clique_sets = {i: frozenset(c) for i, c in enumerate(cliques) if len(c) >= k}
    if not clique_sets:
        return
        
    # Build adjacency mapping of clique indices
    adjacency_map = defaultdict(set)
    clique_indices = list(clique_sets.keys())
    
    # Compare each pair of cliques only once
    for i in range(len(clique_indices)):
        for j in range(i + 1, len(clique_indices)):
            ci, cj = clique_indices[i], clique_indices[j]
            # Check if cliques share k-1 nodes
            if len(clique_sets[ci] & clique_sets[cj]) >= (k - 1):
                adjacency_map[ci].add(cj)
                adjacency_map[cj].add(ci)
    
    # Find connected components using DFS
    visited = set()
    for clique_idx in clique_indices:
        if clique_idx not in visited:
            component = set()
            stack = [clique_idx]
            
            while stack:
                current = stack.pop()
                if current not in visited:
                    visited.add(current)
                    component.add(current)
                    stack.extend(n for n in adjacency_map[current] if n not in visited)
            
            # Merge all cliques in the component
            merged = frozenset().union(*(clique_sets[idx] for idx in component))
            yield merged

def get_kclique(edges):
    G = generate_graph(edges)
    
    clique_nodes = {}
    k = 2    

    while True:
        c = list(find_kclique_communities(G, k))
        if not c:  # Check if c is empty
            break
            
        # Convert frozenset to list
        k_clique_nodes = list(c[0])
        k_clique_nodes.sort()  # Sort the list if needed
        
        clique_nodes[k] = k_clique_nodes
        k += 1
        
    return clique_nodes

def k_truss(G, k):
    # Create a working copy
    subgraph = G.copy()
    
    def count_triangles(u, v):
        # Count common neighbors (triangles) between two nodes
        u_neighbors = set(subgraph.neighbors(u))
        v_neighbors = set(subgraph.neighbors(v))
        return len(u_neighbors & v_neighbors)
    
    def find_weak_edges():
        # Find edges with insufficient triangle support
        weak_edges = []
        processed = set()
        
        for node in subgraph.nodes():
            processed.add(node)
            # Check only forward edges to avoid duplicates
            neighbors = set(subgraph.neighbors(node)) - processed
            
            for neighbor in neighbors:
                if count_triangles(node, neighbor) < (k - 2):
                    weak_edges.append((node, neighbor))
                    
        return weak_edges
    
    while True:
        # Find and remove edges with insufficient support
        edges_to_remove = find_weak_edges()
        if not edges_to_remove:
            break
            
        # Remove weak edges
        subgraph.remove_edges_from(edges_to_remove)
        
        # Clean up isolated nodes
        isolated_nodes = [n for n in subgraph.nodes() if subgraph.degree(n) == 0]
        subgraph.remove_nodes_from(isolated_nodes)
        
        # If graph is empty, break
        if not subgraph.edges():
            break
    
    return subgraph

def get_ktruss(edges):
    G = generate_graph(edges)
    
    truss_nodes = {}
    k = 1
    
    while True:
        k_truss_nodes = k_truss(G, k)
        
        if not k_truss_nodes:
            break
        
        truss_nodes[k] = list(k_truss_nodes)
        k += 1
    
    return truss_nodes

def main():
    edges = [
    [1, 2], [1, 4], [1, 7], [1, 14], [1, 20], [2, 3], [2, 5], [2, 7], [2, 13],
    [3, 8], [3, 9], [4, 5], [4, 7], [5, 4], [5, 6], [5, 7], [6, 8], [6, 11],
    [6, 12], [7, 8], [8, 10], [15, 17], [16, 17], [17, 18], [17, 19], [18, 20], 
    [19, 20]
    ]
    
    core_nodes = run_all_kcores(edges)
    print(core_nodes)
    
    clique_nodes = get_kclique(edges)
    print(clique_nodes)
    
    truss_nodes = get_ktruss(edges)
    print(truss_nodes)
    
    return core_nodes

if __name__ == '__main__':
    main()