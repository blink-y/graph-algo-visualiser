def main():
    edge_list = []
    with open("../Graphs/Graph.txt", "r") as f:
        for line in f:
            # Strip whitespace, split by comma, and convert to integers
            edge = list(map(int, line.strip().split(',')))
            edge_list.append(edge)
    
    print(edge_list)

if __name__ == "__main__":
    main()