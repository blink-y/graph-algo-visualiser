import networkx as nx
from typing import Optional

class TimeLineNode:
    def __init__(self, action, source_node, target_node, parent=None):
        self.action = action  # 1 for add_edge, 0 for remove_edge
        self.source_node = source_node
        self.target_node = target_node
        self.parent = parent
        self.children = []
        self.id = id(self)  # Assign a unique ID to each node (using Python's built-in id function)
    
    def __repr__(self):
        action_str = "Add" if self.action == 1 else "Remove"
        return f"TimeLineNode({action_str} edge ({self.source_node}, {self.target_node}), ID: {self.id}"
    
    def to_dict(self):
        """
        Converts the node and its children into a dictionary format.
        """
        return {
            "id": self.id,  # Include the node ID in the dictionary
            "action": self.action,
            "source_node": self.source_node,
            "target_node": self.target_node,
            "children": [child.to_dict() for child in self.children]  # Recursively convert children
        }

class TimeLine:
    def __init__(self):
        self.root = TimeLineNode(None, None, None)
        self.current_node = self.root
        self.graph = nx.Graph()
        self.is_navigating = False
    
    def add_change(self, action, source_node, target_node):
        if self.is_navigating:
            raise RuntimeError("Cannot add changes while navigating the timeline")
        
        new_node = TimeLineNode(action, source_node, target_node, parent=self.current_node)
        self.current_node.children.append(new_node)
        self.current_node = new_node
        
        if action == 1:
            self.graph.add_edge(source_node, target_node)
        else:
            self.graph.remove_edge(source_node, target_node)
    
    def navigate(self, target_node):
        if target_node == self.current_node:
            return
        
        self.is_navigating = True
        
        path_to_common_ancestor = []
        node = self.current_node
        while node != target_node and node.parent is not None:
            path_to_common_ancestor.append(node)
            node = node.parent
        
        for node in reversed(path_to_common_ancestor):
            self._reverse_change(node)
        
        path_to_target = []
        node = target_node
        while node != self.current_node and node.parent is not None:
            path_to_target.append(node)
            node = node.parent
        
        for node in reversed(path_to_target):
            self._apply_change(node)
        
        self.current_node = target_node
        self.is_navigating = False
    
    def _reverse_change(self, node):
        if node.action == 1:
            self.graph.remove_edge(node.source_node, node.target_node)
        else:
            self.graph.add_edge(node.source_node, node.target_node)
    
    def _apply_change(self, node):
        if node.action == 1:
            self.graph.add_edge(node.source_node, node.target_node)
        else:
            self.graph.remove_edge(node.source_node, node.target_node)

def find_node_by_id(root: TimeLineNode, node_id: int) -> Optional[TimeLineNode]:
    """
    Finds a node in the timeline tree by its ID using depth-first search (DFS).
    """
    if root.id == node_id:
        return root
    
    for child in root.children:
        result = find_node_by_id(child, node_id)
        if result:
            return result
    
    return None  # Node not found