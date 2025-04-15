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
  // Store only the action sequence
  actionSequence: [],
  isProcessing: false,

  setActionSequence: (sequence) => {
    if (Array.isArray(sequence)) {
      set({ actionSequence: sequence, isProcessing: true });
      console.log("Action sequence updated:", sequence);
    }
  },

  // Clear the sequence
  clearActionSequence: () => {
    set({ actionSequence: [], isProcessing: false });
    console.log("Action sequence cleared");
  },
}));