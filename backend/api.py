from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Tuple, Union, Optional
import graph_utils
from timeline import TimeLine, TimeLineNode, find_node_by_id  # Import TimeLine and TimeLineNode

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# Global timeline object
TIMELINE = TimeLine()

class EdgeList(BaseModel):
    edges: List[List[int]]

class Value(BaseModel):
    value: int

class NodeOperation(BaseModel):
    node: int

class EdgeOperation(BaseModel):
    source: int
    target: int

class CoreStructure(BaseModel):
    nodes: List[int]
    edges: List[Union[List[int], Tuple[int, int]]]
    pruned_edges: List[Union[List[int], Tuple[int, int]]]  # New field for pruned edges
    
class AlgorithmsResponse(BaseModel):
    core_data: Dict[int, CoreStructure]
    timeline: Optional[Dict] = None  # Timeline tree to send to frontend

@app.post("/initialize_graph", response_model=AlgorithmsResponse)
async def initialize_graph(value: Value):
    global TIMELINE

    if value.value == 1:
        edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [0, 14], [0, 15], [0, 16], [0, 17], [0, 18], [0, 19], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1, 13], [1, 14], [1, 15], [1, 16], [1, 17], [1, 18], [1, 19], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11], [2, 12], [2, 13], [2, 14], [2, 15], [2, 16], [2, 17], [2, 18], [2, 19], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 11], [3, 12], [3, 13], [3, 14], [3, 15], [3, 16], [3, 17], [3, 18], [3, 19], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [4, 12], [4, 13], [4, 14], [4, 15], [4, 16], [4, 17], [4, 18], [4, 19], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12], [5, 13], [5, 14], [5, 15], [5, 16], [5, 17], [5, 18], [5, 19], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [6, 15], [6, 16], [6, 17], [6, 18], [6, 19], [7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13], [7, 14], [7, 15], [7, 16], [7, 17], [7, 18], [7, 19], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18], [8, 19], [9, 10], [9, 11], [9, 12], [9, 13], [9, 14], [9, 15], [9, 16], [9, 17], [9, 18], [9, 19], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15], [10, 16], [10, 17], [10, 18], [10, 19], [11, 12], [11, 13], [11, 14], [11, 15], [11, 16], [11, 17], [11, 18], [11, 19], [12, 13], [12, 14], [12, 15], [12, 16], [12, 17], [12, 18], [12, 19], [13, 14], [13, 15], [13, 16], [13, 17], [13, 18], [13, 19], [14, 15], [14, 16], [14, 17], [14, 18], [14, 19], [15, 16], [15, 17], [15, 18], [15, 19], [16, 17], [16, 18], [16, 19], [17, 18], [17, 19], [18, 19]]
        
    elif value.value == 2:
        edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], 
                [0, 10], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
                [1, 10], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10],
                [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [4, 5], [4, 6],
                [4, 7], [4, 8], [4, 9], [4, 10], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10],
                [6, 7], [6, 8], [6, 9], [6, 10], [7, 8], [7, 9], [7, 10], [8, 9], [8, 10], [9, 10], [10, 11], [11, 12], [11, 13], [11, 14], [11, 15], [12, 13], [12, 14], [12, 15], [12, 16], [13, 14], [13, 15], [13, 16], [13, 17], [14, 15], [14, 16], [14, 17], [14, 18], [15, 16], [15, 17], [15, 18], [15, 19], [16, 17], [16, 18], [16, 19], [16, 20], [17, 18], [17, 19], [17, 20], [18, 19], [18, 20], [19, 20], [20, 21], [21, 22], [21, 23], [21, 24], [21, 25], [22, 23], [22, 24], [22, 25], [23, 24], [23, 25], [24, 25], [25, 26], [26, 27], [26, 28], [26, 29], [27, 28], [27, 29], [27, 30], [28, 29], [28, 30], [29, 30], [30, 31], [31, 32], [31, 33], [31, 34], [32, 33], [32, 34], [32, 35], [33, 34], [33, 35], [34, 35], [35, 36], [36, 37], [36, 38], [36, 39], [37, 38], [37, 39], [37, 40], [38, 39], [38, 40], [39, 40], [40, 41], [41, 42], [41, 43], [41, 44], [42, 43], [42, 44], [42, 45], [43, 44], [43, 45], [44, 45], [45, 46], [46, 47], [46, 48], [46, 49], [47, 48], [47, 49], [47, 50], [48, 49], [48, 50], [49, 50], [50, 51], [51, 52], [51, 53], [51, 54], [52, 53], [52, 54], [52, 55], [53, 54], [53, 55], [54, 55], [55, 56], [56, 57], [56, 58], [56, 59], [57, 58], [57, 59], [57, 60], [58, 59], [58, 60], [59, 60], [60, 61], [61, 62], [61, 63], [61, 64], [62, 63], [62, 64], [62, 65], [63, 64], [63, 65], [64, 65], [65, 66], [66, 67], [66, 68], [66, 69], [67, 68], [67, 69], [67, 70], [68, 69], [68, 70], [69, 70], [70, 71], [71, 72], [71, 73], [71, 74], [72, 73], [72, 74], [72, 75], [73, 74], [73, 75], [74, 75], [75, 76], [76, 77], [76, 78], [76, 79], [77, 78], [77, 79], [77, 80], [78, 79], [78, 80], [79, 80], [80, 81], [81, 82], [81, 83], [81, 84], [82, 83], [82, 84], [82, 85], [83, 84], [83, 85], [84, 85], [85, 86], [86, 87], [86, 88], [86, 89], [87, 88], [87, 89], [87, 90], [88, 89], [88, 90], [89, 90], [90, 91], [91, 92], [91, 93], [91, 94], [92, 93], [92, 94], [92, 95], [93, 94], [93, 95], [94, 95], [95, 96], [96, 97], [96, 98], [96, 99], [97, 98], [97, 99], [98, 99], [0, 20], [0, 30], [0, 40], [0, 50], [0, 60], [0, 70], [0, 80], [0, 90], [10, 30], [10, 40], [10, 50], [10, 60], [10, 70], [10, 80], [10, 90], [20, 40], [20, 50], [20, 60], [20, 70], [20, 80], [20, 90], [30, 50], [30, 60], [30, 70], [30, 80], [30, 90], [40, 60], [40, 70], [40, 80], [40, 90], [50, 70], [50, 80], [50, 90], [60, 80], [60, 90], [70, 90]]
    elif value.value == 3:
        edges = [[3, 4]]
    else:
        raise HTTPException(status_code=400, detail="Invalid value. Please use 1, 2, or 3.")
    
    # Reset the timeline and initialize the graph
    TIMELINE = TimeLine()
    for edge in edges:
        TIMELINE.graph.add_edge(edge[0], edge[1])  # Add all edges to the graph
        TIMELINE.add_change(1, edge[0], edge[1])  # Add all edges to the timeline
    
    # Compute core data
    core_data = graph_utils.run_all_kcores(edges)
    return AlgorithmsResponse(core_data=core_data, timeline=TIMELINE.root.to_dict())

@app.post("/execute_algorithms", response_model=AlgorithmsResponse)
async def calculate_k_cores(edge_list: EdgeList):
    global TIMELINE

    edges = edge_list.edges
    if not edges:
        raise HTTPException(status_code=400, detail="Edge list cannot be empty")
    
    # Reset the timeline with the new graph
    TIMELINE = TimeLine()
    for edge in edges:
        TIMELINE.add_change(1, edge[0], edge[1])  # Add all edges to the timeline
    
    # Compute core data
    core_data = graph_utils.run_all_kcores(edges)
    return AlgorithmsResponse(core_data=core_data, timeline=TIMELINE.root.to_dict())

@app.post("/add_edge", response_model=AlgorithmsResponse)
async def add_edge(edge_op: EdgeOperation):
    global TIMELINE

    # Add the new edge to the timeline
    TIMELINE.add_change(1, edge_op.source, edge_op.target)
    
    # Get the affected region (neighboring nodes)
    G = graph_utils.generate_graph(list(TIMELINE.graph.edges()))
    affected_subgraph = graph_utils.get_affected_region(G, edge=(edge_op.source, edge_op.target))
    affected_nodes = set(affected_subgraph.nodes())
    
    # Recalculate k-core for the affected region
    local_edges = list(affected_subgraph.edges())
    local_core_data = graph_utils.run_all_kcores(local_edges)
    
    # Compute the global core data
    global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
    
    return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())

# @app.post("/remove_node", response_model=AlgorithmsResponse)
# async def remove_node(node_op: NodeOperation):
#     global TIMELINE

#     # Remove all edges connected to the node
#     edges_to_remove = [edge for edge in TIMELINE.graph.edges() if node_op.node in edge]
#     for edge in edges_to_remove:
#         TIMELINE.add_change(0, edge[0], edge[1])  # Remove each edge
    
    # Get the affected region (neighboring nodes)
    G = graph_utils.generate_graph(list(TIMELINE.graph.edges()))
    affected_nodes = set()
    for edge in edges_to_remove:
        affected_subgraph = graph_utils.get_affected_region(G, edge=edge)
        affected_nodes.update(set(affected_subgraph.nodes()))
    
    # Recalculate k-core for the affected region
    local_edges = list(G.subgraph(affected_nodes).edges())
    local_core_data = graph_utils.run_all_kcores(local_edges)
    
    # Compute the global core data
    global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
    
    return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())

@app.post("/remove_edge", response_model=AlgorithmsResponse)
async def remove_edge(edge_op: EdgeOperation):
    global TIMELINE

    # Remove the edge from the timeline
    TIMELINE.add_change(0, edge_op.source, edge_op.target)
    
    # Get the affected region (neighboring nodes)
    G = graph_utils.generate_graph(list(TIMELINE.graph.edges()))
    affected_subgraph = graph_utils.get_affected_region(G, edge=(edge_op.source, edge_op.target))
    affected_nodes = set(affected_subgraph.nodes())
    
    # Recalculate k-core for the affected region
    local_edges = list(affected_subgraph.edges())
    local_core_data = graph_utils.run_all_kcores(local_edges)
    
    # Compute the global core data
    global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
    
    return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())

@app.get("/get_current_graph", response_model=AlgorithmsResponse)
async def get_current_graph():
    global TIMELINE

    # Compute core data for the current graph
    core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
    return AlgorithmsResponse(core_data=core_data, timeline=TIMELINE.root.to_dict())

@app.post("/navigate_to_node", response_model=AlgorithmsResponse)
async def navigate_to_node(node_id: int):
    global TIMELINE

    # Find the target node in the timeline (this is a placeholder; you'll need to implement node lookup)
    target_node = find_node_by_id(TIMELINE.root, node_id)
    if not target_node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Navigate to the target node
    TIMELINE.navigate(target_node)
    
    # Compute core data for the graph at the target node
    core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
    return AlgorithmsResponse(core_data=core_data, timeline=TIMELINE.root.to_dict())