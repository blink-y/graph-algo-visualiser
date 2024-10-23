import networkx as nx
import matplotlib.pyplot as plt

def visualize_graph(edges, title):
    # Create an undirected graph
    G = nx.Graph()
    G.add_edges_from(edges)

    # Draw the graph
    pos = nx.spring_layout(G, seed=42)  # Fixed seed for consistent layout
    nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=500, font_size=10)

    # Display the graph
    plt.title(title)
    plt.show()

def get_kcore(edges, k):
    # Create an undirected graph
    G = nx.Graph()
    G.add_edges_from(edges)

    # Get the k-core of the graph
    k_core = nx.k_core(G, k)
    
    # Return the k-core graph
    return k_core

def visualize_kcore(k_core):
    # Draw the k-core
    pos = nx.spring_layout(k_core, seed=42)
    nx.draw(k_core, pos, with_labels=True, node_color='lightgreen', edge_color='black', node_size=500, font_size=10)

    # Display the graph
    plt.title("K-core of the Graph")
    plt.show()

def main():
    # Example usage with at least 30 vertices
    edges = [
        (1, 2), (1, 4), (1, 7), (1, 14), (1, 20), (2, 3), (2, 5), (2, 7), (2, 13),
        (3, 8), (3, 9), (4, 5), (4, 7), (5, 4), (5, 6), (5, 7), (6, 8), (6, 11),
        (6, 12), (7, 8), (8, 10), (15, 17), (16, 17), (17, 18), (17, 19), (18, 20), 
        (19, 20)
        ]
    k_core_edges = edges.copy()
    k = 0
    
    while len(k_core_edges) != 0:    
        k_core = get_kcore(edges, k)
        visualize_kcore(k_core)

        # Access and print the edge list of the k-core
        k_core_edges = k_core.edges()
        print(f"Edges {k}-core:", list(k_core_edges))
        k += 1

if __name__ == '__main__':
    main()