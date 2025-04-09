import { create } from 'zustand';

export const useTreeStore = create((set) => ({
  treeData: null,
  
  // Simple setter function to update the tree data
  setTreeData: (newData) => {
    // Optional validation - ensure newData has expected structure
    if (newData && typeof newData === 'object') {
      set({ treeData: newData });
    } else {
      console.warn('Invalid tree data format:', newData);
    }
  },
}));