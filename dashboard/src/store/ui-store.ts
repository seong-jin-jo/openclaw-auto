"use client";

import { create } from "zustand";

interface UIState {
  subTab: string;
  queueFilter: string;
  sidebarCollapsed: Record<string, boolean>;
  editingPost: string | null;
  selectedIds: Set<string>;
  editingChannel: string | null;
  showDetail: string | null;
  imagePickerPostId: string | null;
  expandedFeature: string | null;
  expandedPopular: number | null;
  dismissedOnboarding: boolean;

  setSubTab: (tab: string) => void;
  setQueueFilter: (filter: string) => void;
  toggleSidebar: (key: string) => void;
  setEditingPost: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setEditingChannel: (ch: string | null) => void;
  setShowDetail: (key: string | null) => void;
  setImagePickerPostId: (id: string | null) => void;
  setExpandedFeature: (key: string | null) => void;
  setExpandedPopular: (idx: number | null) => void;
  dismissOnboarding: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  subTab: "queue",
  queueFilter: "all",
  sidebarCollapsed: {},
  editingPost: null,
  selectedIds: new Set(),
  editingChannel: null,
  showDetail: null,
  imagePickerPostId: null,
  expandedFeature: null,
  expandedPopular: null,
  dismissedOnboarding: false,

  setSubTab: (tab) => set({ subTab: tab }),
  setQueueFilter: (filter) => set({ queueFilter: filter }),
  toggleSidebar: (key) =>
    set((s) => ({
      sidebarCollapsed: { ...s.sidebarCollapsed, [key]: !s.sidebarCollapsed[key] },
    })),
  setEditingPost: (id) => set({ editingPost: id }),
  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),
  setEditingChannel: (ch) => set({ editingChannel: ch }),
  setShowDetail: (key) => set((s) => ({ showDetail: s.showDetail === key ? null : key })),
  setImagePickerPostId: (id) => set({ imagePickerPostId: id }),
  setExpandedFeature: (key) => set((s) => ({ expandedFeature: s.expandedFeature === key ? null : key })),
  setExpandedPopular: (idx) => set((s) => ({ expandedPopular: s.expandedPopular === idx ? null : idx })),
  dismissOnboarding: () => set({ dismissedOnboarding: true }),
}));
