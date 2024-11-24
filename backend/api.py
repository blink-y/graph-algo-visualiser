from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Tuple, Union
import graph_utils
import networkx as nx

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

# Global variable to store the current graph
current_graph = {"edges": []}

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

class CoreResponse(BaseModel):
    core_data: Dict[int, CoreStructure]

@app.post("/calculate_k_cores", response_model=CoreResponse)
async def calculate_k_cores(edge_list: EdgeList):
    edges = edge_list.edges
    if not edges:
        raise HTTPException(status_code=400, detail="Edge list cannot be empty")
    
    # Store the current graph
    current_graph["edges"] = edges
    core_data = graph_utils.run_all_kcores(edges)
    
    return CoreResponse(core_data=core_data)

@app.post("/initialize_graph", response_model=CoreResponse)
async def initialize_graph(value: Value):
    if value.value == 1:
        edges = [[1,5], [1,2], [1,3], [1,4], [2,3], [2,4], [2,5], [3,4], [3,5], [4,5], 
                [6,7], [6,8], [6,9], [7,8], [7,9], [8,9], [1,9], [1,11], [2,11], [2,12], 
                [3,12], [3,13], [4,16], [5,9], [5,14], [5,15], [5,15], [6,10], [8,15], 
                [9,10], [10,11], [12,13], [14,15], [16,17], [16,18], [17,18], [7,23], 
                [10,24], [10,25], [11,26], [11,27], [12,28], [12,29], [13,30], [17,20], 
                [18,19], [15,21], [15,22]]
    elif value.value == 2:
        edges = [[2, 3]]
    elif value.value == 3:
        edges = [[3, 4]]
    else:
        raise HTTPException(status_code=400, detail="Invalid value. Please use 1, 2, or 3.")
    
    # Store the current graph
    current_graph["edges"] = edges
    core_data = graph_utils.run_all_kcores(edges)    
    return CoreResponse(core_data=core_data)

@app.post("/add_edge", response_model=CoreResponse)
async def add_edge(edge_op: EdgeOperation):
    if not current_graph["edges"]:
        current_graph["edges"] = []
    
    new_edge = [edge_op.source, edge_op.target]
    
    # Check if the edge already exists
    if new_edge not in current_graph["edges"] and [edge_op.target, edge_op.source] not in current_graph["edges"]:
        current_graph["edges"].append(new_edge)
    
    # Calculate new k-cores
    core_data = graph_utils.run_all_kcores(current_graph["edges"])
    return CoreResponse(core_data=core_data)

@app.post("/remove_node", response_model=CoreResponse)
async def remove_node(node_op: NodeOperation):
    if not current_graph["edges"]:
        raise HTTPException(status_code=400, detail="No graph exists")
    
    # Create a new edge list excluding edges that contain the node to be removed
    new_edges = [edge for edge in current_graph["edges"] 
                if node_op.node not in edge]
    
    # Update the current graph
    current_graph["edges"] = new_edges
    
    # Calculate new k-cores
    core_data = graph_utils.run_all_kcores(new_edges)
    return CoreResponse(core_data=core_data)

@app.post("/remove_edge", response_model=CoreResponse)
async def remove_edge(edge_op: EdgeOperation):
    if not current_graph["edges"]:
        raise HTTPException(status_code=400, detail="No graph exists")
    
    edge_to_remove = [edge_op.source, edge_op.target]
    reverse_edge = [edge_op.target, edge_op.source]
    
    # Remove the edge if it exists
    new_edges = [edge for edge in current_graph["edges"] 
                if edge != edge_to_remove and edge != reverse_edge]
    
    # Update the current graph
    current_graph["edges"] = new_edges
    
    # Calculate new k-cores
    core_data = graph_utils.run_all_kcores(new_edges)
    return CoreResponse(core_data=core_data)

@app.get("/get_current_graph", response_model=CoreResponse)
async def get_current_graph():
    if not current_graph["edges"]:
        raise HTTPException(status_code=400, detail="No graph exists")
    
    core_data = graph_utils.run_all_kcores(current_graph["edges"])
    return CoreResponse(core_data=core_data)