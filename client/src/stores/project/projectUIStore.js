import { create } from "zustand";

const useProjectModalStore = create((set) => ({
  isOpen: false,

  open: () =>
    set({
      isOpen: true,
    }),

  close: () =>
    set({
      isOpen: false,
    }),
}));

export default useProjectModalStore;