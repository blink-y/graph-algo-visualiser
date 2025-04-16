from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Tuple, Union, Optional
import graph_utils
from timeline import TimeLine, TimeLineNode, find_node_by_id  # Import TimeLine and TimeLineNode
import json
import time

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global timeline object
TIMELINE = TimeLine()

HIDDEN_TIMELINE = TimeLine()

class EdgeList(BaseModel):
    edges: List[List[int]]

class Value(BaseModel):
    value: int

class NodeOperation(BaseModel):
    node: int

class EdgeOperation(BaseModel):
    source: int
    target: int
    algo_running: int

class CoreStructure(BaseModel):
    nodes: List[int]
    edges: List[Union[List[int], Tuple[int, int]]]
    pruned_edges: List[Union[List[int], Tuple[int, int]]]  # New field for pruned edges
    
class AlgorithmsResponse(BaseModel):
    core_data: Dict[int, CoreStructure]
    timeline: Optional[Dict] = None  # This should be a plain dictionary

class NavigationRequest(BaseModel):
    node_id: int    
    
class NavigationStep(BaseModel):
    action: int  # 1=add, 0=remove
    source: int
    target: int

class NavigationResponse(BaseModel):
    action_sequence: List[NavigationStep]

@app.post("/initialize_graph", response_model=AlgorithmsResponse)
async def initialize_graph(value: Value):
    global TIMELINE, global_core_data

    if value.value == 1:
        with open("graphs/sample_graph1.json", "r") as f:
            edges = json.load(f)
    elif value.value == 2:
        with open("graphs/sample_graph2.json", "r") as f:
            edges = json.load(f)
    elif value.value == 3:
        # edges = [
        #         *[[i, i+1] for i in range(1, 1000)],
        #         *[[i, i+2] for i in range(1, 999)],
        #         *[[i, i+50] for i in range(1, 950)],
        #         *[[i+j, i+k] for i in [0, 100, 200, 300, 400, 500, 600, 700, 800, 900] 
        #                     for j in range(10) for k in range(j+1, 10)],
        #         [50,150], [150,250], [250,350], [350,450], [450,550], [550,650], [650,750], [750,850], [850,950],
        #         [25,125], [125,225], [225,325], [325,425], [425,525], [525,625], [625,725], [725,825], [825,925],
        #         *[[999, i] for i in range(1, 101)],
        #         *[[999, i] for i in range(200, 300) if i%7 == 0],
        #         *[[999, i] for i in range(400, 500) if i%5 == 0],
        #         [34, 567], [123, 432], [89, 678], [256, 765], [145, 654], [321, 876], [233, 589], [477, 888],
        #         [65, 345], [178, 567], [289, 712], [366, 944], [511, 823], [622, 155], [734, 299], [877, 411],
        #         *[[i, i+100] for i in range(1, 900) if i%20 == 0],
        #         *[[i, i+33] for i in range(50, 950) if i%15 == 0],
        #         *[[i, i+66] for i in range(25, 975) if i%25 == 0]
        #         ]
        edges = [[1,2], [2,3], [3,4], [3,5], [4,5]]
    else:
        raise HTTPException(status_code=400, detail="Invalid value. Please use 1, 2, or 3.")
    
    TIMELINE = TimeLine()
    
    # Add all edges directly to graph (no timeline recording)
    for u, v in edges:
        TIMELINE.graph.add_edge(u, v)
    
    # Compute core data
    global_core_data = graph_utils.run_all_kcores(edges)
    
    # Return response with empty timeline (root has no children)
    return AlgorithmsResponse(
        core_data=global_core_data,
        timeline=TIMELINE.root.to_dict()  # Will show empty root node
    )

@app.post("/execute_algorithms", response_model=AlgorithmsResponse)
async def calculate_k_cores(edge_list: EdgeList):
    global TIMELINE, global_core_data

    edges = edge_list.edges
    if not edges:
        raise HTTPException(status_code=400, detail="Edge list cannot be empty")
    
    # Reset the timeline with the new graph
    TIMELINE = TimeLine()
    for edge in edges:
        TIMELINE.add_change(1, edge[0], edge[1])  # Add all edges to the timeline
    
    # Compute core data
    global_core_data = graph_utils.run_all_kcores(edges)
    return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())

@app.post("/add_edge", response_model=AlgorithmsResponse)
async def add_edge(edge_op: EdgeOperation):
    global TIMELINE, global_core_data
    
    # Compute the global core data
    if edge_op.algo_running == 1:
        # Add the new edge to the timeline
        TIMELINE.add_change(1, edge_op.source, edge_op.target)
        return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())
    elif edge_op.algo_running == 0:
        # Add the new edge to the timeline
        TIMELINE.add_change(1, edge_op.source, edge_op.target)
        global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
        return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())
    else:
        TIMELINE.graph.add_edge(edge_op.source, edge_op.target)
        global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
        return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())

@app.post("/remove_edge", response_model=AlgorithmsResponse)
async def remove_edge(edge_op: EdgeOperation):
    global TIMELINE, global_core_data
    
    # Compute the global core data
    if edge_op.algo_running == 1:
        # Remove the edge from the timeline
        TIMELINE.add_change(0, edge_op.source, edge_op.target)
        return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())
    elif edge_op.algo_running == 0:
        # Remove the edge from the timeline
        TIMELINE.add_change(0, edge_op.source, edge_op.target)
        global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
        return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())
    else:
        TIMELINE.graph.remove_edge(edge_op.source, edge_op.target)
        global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
        return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())
        

@app.get("/get_current_graph", response_model=AlgorithmsResponse)
async def get_current_graph():
    global TIMELINE, global_core_data

    # Compute core data for the current graph
    global_core_data = graph_utils.run_all_kcores(list(TIMELINE.graph.edges()))
    return AlgorithmsResponse(core_data=global_core_data, timeline=TIMELINE.root.to_dict())

@app.post("/navigate_to_node", response_model=NavigationResponse)
async def navigate_to_node(node_id: NavigationRequest):
    global TIMELINE, global_core_data

    target_node = find_node_by_id(TIMELINE.root, node_id.node_id)
    if not target_node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Get the planned path (read-only)
    raw_sequence = TIMELINE.get_navigation_path(target_node)
    
    action_sequence = [
        NavigationStep(action=action, source=source, target=target)
        for action, source, target in raw_sequence
    ]
    
    # Execute the navigation (modifies state)
    # TIMELINE.navigate(target_node)
    
    # Return both results
    return NavigationResponse(
        action_sequence=action_sequence
    )

@app.post("/upload_graph", response_model=AlgorithmsResponse)
async def uploada_graph(edges: EdgeList):
    """
    Upload a graph and compute its k-core structure.
    """
    global TIMELINE, global_core_data

    TIMELINE = TimeLine()
    
    # Add all edges directly to graph (no timeline recording)
    for u, v in edges.edges:
        TIMELINE.graph.add_edge(u, v)
    
    # Compute core data
    global_core_data = graph_utils.run_all_kcores(edges)
    
    # Return response with empty timeline (root has no children)
    return AlgorithmsResponse(
        core_data=global_core_data,
        timeline=TIMELINE.root.to_dict()  # Will show empty root node
    )