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
    # edges = [
    # [1, 2], [1, 4], [1, 7], [1, 14], [1, 20], [2, 3], [2, 5], [2, 7], [2, 13],
    # [3, 8], [3, 9], [4, 5], [4, 7], [5, 4], [5, 6], [5, 7], [6, 8], [6, 11],
    # [6, 12], [7, 8], [8, 10], [15, 17], [16, 17], [17, 18], [17, 19], [18, 20], 
    # [19, 20]
    # ]
    
    edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], 
                [0, 10], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
                [1, 10], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10],
                [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [4, 5], [4, 6],
                [4, 7], [4, 8], [4, 9], [4, 10], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10],
                [6, 7], [6, 8], [6, 9], [6, 10], [7, 8], [7, 9], [7, 10], [8, 9], [8, 10], [9, 10], [10, 11], [11, 12], [11, 13], [11, 14], [11, 15], [12, 13], [12, 14], [12, 15], [12, 16], [13, 14], [13, 15], [13, 16], [13, 17], [14, 15], [14, 16], [14, 17], [14, 18], [15, 16], [15, 17], [15, 18], [15, 19], [16, 17], [16, 18], [16, 19], [16, 20], [17, 18], [17, 19], [17, 20], [18, 19], [18, 20], [19, 20], [20, 21], [21, 22], [21, 23], [21, 24], [21, 25], [22, 23], [22, 24], [22, 25], [23, 24], [23, 25], [24, 25], [25, 26], [26, 27], [26, 28], [26, 29], [27, 28], [27, 29], [27, 30], [28, 29], [28, 30], [29, 30], [30, 31], [31, 32], [31, 33], [31, 34], [32, 33], [32, 34], [32, 35], [33, 34], [33, 35], [34, 35], [35, 36], [36, 37], [36, 38], [36, 39], [37, 38], [37, 39], [37, 40], [38, 39], [38, 40], [39, 40], [40, 41], [41, 42], [41, 43], [41, 44], [42, 43], [42, 44], [42, 45], [43, 44], [43, 45], [44, 45], [45, 46], [46, 47], [46, 48], [46, 49], [47, 48], [47, 49], [47, 50], [48, 49], [48, 50], [49, 50], [50, 51], [51, 52], [51, 53], [51, 54], [52, 53], [52, 54], [52, 55], [53, 54], [53, 55], [54, 55], [55, 56], [56, 57], [56, 58], [56, 59], [57, 58], [57, 59], [57, 60], [58, 59], [58, 60], [59, 60], [60, 61], [61, 62], [61, 63], [61, 64], [62, 63], [62, 64], [62, 65], [63, 64], [63, 65], [64, 65], [65, 66], [66, 67], [66, 68], [66, 69], [67, 68], [67, 69], [67, 70], [68, 69], [68, 70], [69, 70], [70, 71], [71, 72], [71, 73], [71, 74], [72, 73], [72, 74], [72, 75], [73, 74], [73, 75], [74, 75], [75, 76], [76, 77], [76, 78], [76, 79], [77, 78], [77, 79], [77, 80], [78, 79], [78, 80], [79, 80], [80, 81], [81, 82], [81, 83], [81, 84], [82, 83], [82, 84], [82, 85], [83, 84], [83, 85], [84, 85], [85, 86], [86, 87], [86, 88], [86, 89], [87, 88], [87, 89], [87, 90], [88, 89], [88, 90], [89, 90], [90, 91], [91, 92], [91, 93], [91, 94], [92, 93], [92, 94], [92, 95], [93, 94], [93, 95], [94, 95], [95, 96], [96, 97], [96, 98], [96, 99], [97, 98], [97, 99], [98, 99], [0, 20], [0, 30], [0, 40], [0, 50], [0, 60], [0, 70], [0, 80], [0, 90], [10, 30], [10, 40], [10, 50], [10, 60], [10, 70], [10, 80], [10, 90], [20, 40], [20, 50], [20, 60], [20, 70], [20, 80], [20, 90], [30, 50], [30, 60], [30, 70], [30, 80], [30, 90], [40, 60], [40, 70], [40, 80], [40, 90], [50, 70], [50, 80], [50, 90], [60, 80], [60, 90], [70, 90]]

    
    core_nodes = run_all_kcores(edges)
    print(core_nodes)
    
    clique_nodes = get_kclique(edges)
    print(clique_nodes)
    
    truss_nodes = get_ktruss(edges)
    print(truss_nodes)
    
    return core_nodes

if __name__ == '__main__':
    main()