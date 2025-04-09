import networkx as nx
from typing import Optional

class TimeLineNode:
    _next_id = 1  # Class variable to track IDs
    
    def __init__(self, action, source_node, target_node, parent=None):
        self.action = action  # 1 for add_edge, 0 for remove_edge
        self.source_node = source_node
        self.target_node = target_node
        self.parent = parent
        self.children = []
        self.id = TimeLineNode._next_id
        TimeLineNode._next_id += 1
    
    def __repr__(self):
        action_str = "Add" if self.action == 1 else "Remove"
        return f"TimeLineNode({action_str} edge ({self.source_node}, {self.target_node}), ID: {self.id}"
    
    def to_dict(self):
        """
        Converts the node and its children into a dictionary format.
        """
        return {
            "id": self.id,
            "action": self.action,
            "source_node": self.source_node,
            "target_node": self.target_node,
            "children": [child.to_dict() for child in self.children]
        }

    @classmethod
    def reset_ids(cls):
        """Reset ID counter (useful for testing)"""
        cls._next_id = 1

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

def get_navigation_path(self, target_node: TimeLineNode):
    """
    Returns the sequence of actions needed to navigate to target_node
    Format: [[action, source, target], ...]
    Does NOT modify any state - purely read-only
    """
    if target_node == self.current_node:
        return []

    action_sequence = []
    current = self.current_node
    
    # Phase 1: Walk up to common ancestor (exactly matching navigate()'s logic)
    up_path = []
    while current != target_node and current.parent is not None:
        up_path.append(current)
        current = current.parent
    
    # Phase 2: Walk down to target (matching navigate()'s logic)
    down_path = []
    temp = target_node
    while temp != current and temp.parent is not None:
        down_path.append(temp)
        temp = temp.parent
    down_path.reverse()  # Because we built it from target up

    # Generate actions without executing anything
    for node in reversed(up_path):  # Same order as navigate()'s reversal
        action_sequence.append([
            1 if node.action == 0 else 0,  # Inverse action
            node.source_node,
            node.target_node
        ])
    
    for node in down_path:  # Same order as navigate()'s application
        action_sequence.append([
            node.action,
            node.source_node,
            node.target_node
        ])
    
    return action_sequence