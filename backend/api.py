from urllib import response
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
from graph_utils import run_all_kcores


app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class EdgeList(BaseModel):
    edges: List[List[int]]

stored_edges : List[List[int]] = []

class Value(BaseModel):
    value: int

class CodeNodesResponse(BaseModel):
    core_nodes: Dict[int, List[int]]

@app.post("/calculate_k_cores", response_model=CodeNodesResponse)
async def calculate_k_cores(edge_list: EdgeList):
    edges = edge_list.edges
    if not edges:
        raise HTTPException(status_code=400, detail="Edge list cannot be empty")
    
    core_nodes = run_all_kcores(edges)
    
    return CodeNodesResponse(core_nodes=core_nodes)

@app.post("/initialize_graph", response_model=CodeNodesResponse)
async def initialize_graph(value: Value):
    if value.value == 1:
        edges = [[1,5], [1,2], [1,3], [1,4], [2,3], [2,4], [2,5], [3,4], [3,5], [4,5], [6,7], [6,8], [6,9], [7,8], [7,9], [8,9], [1,9], [1,11], [2,11], [2,12], [3,12], [3,13], [4,16], [5,9], [5,14], [5,15], [5,15], [6,10], [8,15], [9,10], [10,11], [12,13], [14,15], [16,17], [16,18], [17,18], [7,23], [10,24], [10,25], [11,26], [11,27], [12,28], [12,29], [13,30], [17,20], [18,19], [15,21], [15,22]]
    elif value.value == 2:
        edges = [2, 3]
    elif value.value == 3:
        edges = [3, 4]
    else:
        raise HTTPException(status_code=400, detail="Invalid value. Please use 1, 2, or 3.")

    core_nodes = run_all_kcores(edges)    
    return CodeNodesResponse(core_nodes=core_nodes)