import networkx as nx
import matplotlib.pyplot as plt
from networkx.algorithms.community import k_clique_communities

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
    core_nodes = {}
    k = 1    

    # Collect all k-cores
    while True:
        k_core = get_kcore(G, k)
        k_core_edges = k_core.edges()
        
        if not k_core_edges:  # If there are no edges, break the loop
            break
        
        core_nodes[k] = set(k_core.nodes())
        k += 1

    final_core_nodes = {}
    
    highest_core = k - 1  # Highest core collected
    for current_k in range(highest_core, 0, -1):
        if current_k == highest_core:  # For the highest core, add as is
            final_core_nodes[current_k] = list(core_nodes[current_k])
        else:
            # Exclude nodes from the previous higher core
            unique_nodes = core_nodes[current_k] - core_nodes[current_k + 1]
            final_core_nodes[current_k] = list(unique_nodes)

    return final_core_nodes

def get_kclique(edges):
    G = generate_graph(edges)
    
    clique_nodes = {}
    k = 2    

    while True:
        c = list(k_clique_communities(G, k))
        if not c:  # Check if c is empty
            break
            
        # Convert frozenset to list
        k_clique_nodes = list(c[0])
        k_clique_nodes.sort()  # Sort the list if needed
        
        clique_nodes[k] = k_clique_nodes
        k += 1
        
    return clique_nodes

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
    
    return core_nodes

if __name__ == '__main__':
    main()