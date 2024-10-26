import networkx as nx
import matplotlib.pyplot as plt

def generate_graph(edges):
    G = nx.Graph()
    G.add_edges_from(edges)
    
    return G
    
def get_kcore(G, k):
    k_core = nx.k_core(G, k)
    
    return k_core

def visualize_graph(G):
    pos = nx.spring_layout(G, seed=42)
    nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=500, font_size=10)
    
    plt.title("K-core of the Graph")
    plt.show()

def run_all_kcores(edges):
    G = generate_graph(edges)
    k_core_edges = edges.copy()
    k = 1    

    core_nodes = {}
    
    while len(k_core_edges) != 0:
        k_core = get_kcore(G, k)
        
        k_core_edges = k_core.edges()
        
        core_nodes[k] = list(k_core.nodes())
        k += 1
        
    return core_nodes

def main():
    edges = [
    [1, 2], [1, 4], [1, 7], [1, 14], [1, 20], [2, 3], [2, 5], [2, 7], [2, 13],
    [3, 8], [3, 9], [4, 5], [4, 7], [5, 4], [5, 6], [5, 7], [6, 8], [6, 11],
    [6, 12], [7, 8], [8, 10], [15, 17], [16, 17], [17, 18], [17, 19], [18, 20], 
    [19, 20]
    ]
    
    core_nodes = run_all_kcores(edges)
    print(core_nodes)
    return core_nodes

if __name__ == '__main__':
    main()