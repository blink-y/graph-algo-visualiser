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
        TimeLineNode.reset_ids()
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
        
        # Check if target is in current branch (either ancestor or descendant)
        if self._is_in_branch(target_node):
            # Same branch navigation
            if self._is_ancestor(target_node):
                # Moving up to ancestor - just reverse changes
                path = self._get_path_to_node(target_node)
                for node in path:
                    self._reverse_change(node)
            else:
                # Moving down to descendant - just apply changes
                path = self._get_path_from_node(target_node)
                for node in path:
                    self._apply_change(node)
        else:
            # Original cross-branch navigation
            path_to_common_ancestor = []
            node = self.current_node
            while node != target_node and node.parent is not None:
                path_to_common_ancestor.append(node)
                node = node.parent
            
            for node in path_to_common_ancestor:
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

    def _is_in_branch(self, target_node):
        """Check if target is in current branch (ancestor or descendant)"""
        return (self._is_ancestor(target_node) or 
                self._is_descendant(target_node))

    def _is_ancestor(self, node):
        """Check if node is ancestor of current node"""
        current = self.current_node
        while current.parent is not None:
            if current.parent == node:
                return True
            current = current.parent
        return False

    def _is_descendant(self, node):
        """Check if node is descendant of current node"""
        return self._is_ancestor_of(node, self.current_node)

    def _is_ancestor_of(self, ancestor, node):
        """Helper to check if ancestor is ancestor of node"""
        while node.parent is not None:
            if node.parent == ancestor:
                return True
            node = node.parent
        return False

    def _get_path_to_node(self, target):
        """Get path from current node to target (ancestor)"""
        path = []
        node = self.current_node
        while node != target and node.parent is not None:
            path.append(node)
            node = node.parent
        return path

    def _get_path_from_node(self, target):
        """Get path from target to current node (descendant)"""
        path = []
        node = target
        while node != self.current_node and node.parent is not None:
            path.append(node)
            node = node.parent
        return reversed(path)
    
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
    
    def get_navigation_path(self, target_node: TimeLineNode):
        """
        Returns the sequence of actions needed to navigate to target_node
        Format: [[action, source, target], ...]
        Does NOT modify any state - purely read-only
        """
        if target_node == self.current_node:
            return []

        action_sequence = []
        
        if self._is_in_branch(target_node):
            # Same branch navigation
            if self._is_ancestor(target_node):
                # Moving up to ancestor
                path = self._get_path_to_node(target_node)
                for node in reversed(path):
                    action_sequence.append([
                        1 if node.action == 0 else 0,  # Inverse action
                        node.source_node,
                        node.target_node
                    ])
            else:
                # Moving down to descendant
                path = self._get_path_from_node(target_node)
                for node in path:
                    action_sequence.append([
                        node.action,
                        node.source_node,
                        node.target_node
                    ])
        else:
            # Find the lowest common ancestor
            current_ancestors = {}  # Map node to its depth
            depth = 0
            node = self.current_node
            while node is not None:
                current_ancestors[node] = depth
                depth += 1
                node = node.parent
                
            # Find the lowest common ancestor by walking up from target_node
            target_path = []
            node = target_node
            lca = None
            while node is not None:
                if node in current_ancestors:
                    lca = node
                    break
                target_path.append(node)
                node = node.parent
                
            if lca is None:
                raise ValueError("No common ancestor found, which should not happen")
                
            # Path from current node to LCA
            current_path = []
            node = self.current_node
            while node != lca:
                current_path.append(node)
                node = node.parent
            
            # Generate actions for upward path (current to LCA)
            for node in current_path:
                action_sequence.append([
                    1 if node.action == 0 else 0,  # Inverse action
                    node.source_node,
                    node.target_node
                ])
            
            # Generate actions for downward path (LCA to target)
            for node in reversed(target_path):
                action_sequence.append([
                    node.action,
                    node.source_node,
                    node.target_node
                ])
            # # Phase 1: Walk up to common ancestor (exactly matching navigate()'s logic)
            # up_path = []
            # while current != target_node and current.parent is not None:
            #     up_path.append(current)
            #     current = current.parent
            
            # # Phase 2: Walk down to target (matching navigate()'s logic)
            # down_path = []
            # temp = target_node
            # while temp != current and temp.parent is not None:
            #     down_path.append(temp)
            #     temp = temp.parent
            # down_path.reverse()  # Because we built it from target up

            # # Generate actions without executing anything
            # for node in reversed(up_path):  # Same order as navigate()'s reversal
            #     action_sequence.append([
            #         1 if node.action == 0 else 0,  # Inverse action
            #         node.source_node,
            #         node.target_node
            #     ])
            
            # for node in down_path:  # Same order as navigate()'s application
            #     action_sequence.append([
            #         node.action,
            #         node.source_node,
            #         node.target_node
            #     ])
        
        return action_sequence

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