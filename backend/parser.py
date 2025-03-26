def parse_graph_data(data):
    edge_lines = data.strip().split('\n')
    edges = [tuple(map(int, line.split())) for line in edge_lines]
    return edges

def generate_all_edges(edges):
    nodes = set()
    for edge in edges:
        nodes.update(edge)

    node_list = list(nodes)
    all_edges = []

    for i in range(len(node_list)):
        for j in range(i + 1, len(node_list)):
            all_edges.append((node_list[i], node_list[j]))

    return all_edges

# Example graph data
graph_data = """0 1
0 2
0 3
1 0
1 2
1 3
2 3
3 1
3 9
4 1
4 13
4 6
5 10
5 6
5 7
5 8
6 6
7 5
7 8
7 6
8 6
9 10
9 5
10 12
11 10
12 10
13 1
13 14
13 17
14 15
14 13
15 15
16 17
17 17
18 18
19 19
"""

# Parse the graph data
parsed_edges = parse_graph_data(graph_data)

# Generate formatted edges
formatted_edges = generate_all_edges(parsed_edges)

# Print the results
print(formatted_edges)
