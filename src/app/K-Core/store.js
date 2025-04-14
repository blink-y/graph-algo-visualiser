import { create } from 'zustand';

export const useTreeStore = create((set) => ({
  treeData: null,
  
  setTreeData: (newData) => {
    if (newData && typeof newData === 'object') {
      set({ treeData: newData });
    } else {
      console.warn('Invalid tree data format:', newData);
    }
  },
}));

export const useActionStore = create((set) => ({
  actionData: null,
  
  setActionData: (newData) => {
    if (newData && typeof newData === 'object') {
      set({ actionData: newData });
    } else {
      console.warn('Invalid action data format:', newData);
    }
  },
}));