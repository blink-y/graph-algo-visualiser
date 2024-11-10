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

class CodeNodesResponse(BaseModel):
    core_nodes: Dict[int, List[int]]

@app.post("/calculate_k_cores", response_model=CodeNodesResponse)
async def calculate_k_cores(edge_list: EdgeList):
    edges = edge_list.edges
    if not edges:
        raise HTTPException(status_code=400, detail="Edge list cannot be empty")
    
    core_nodes = run_all_kcores(edges)
    
    return CodeNodesResponse(core_nodes=core_nodes)