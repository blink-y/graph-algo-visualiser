from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from graph_utils import run_all_kcores

app = FastAPI()

class EdgeList(BaseModel):
    edges: List[List[int]]

class CodeNodesResponse(BaseModel):
    core_nodes: Dict[int, List[int]]

@app.post("/calculate_k_cores", response_model=CodeNodesResponse)
async def calculate_k_cores(edge_list: EdgeList):
    edges = edge_list.edges
    if not edges:
        raise HTTPException(status_code=400, detail="Edge list cannot be empty")
    
    core_nodes = run_all_kcores(edges)
    
    return CodeNodesResponse(core_nodes=core_nodes)