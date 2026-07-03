import { create } from "zustand"
import type { Verse } from "@/types"

export interface HistoryItem {
  id: string
  verses: Verse[]
  verse?: Verse // Legacy fallback
  translationId: number
  timestamp: number
}

interface HistoryState {
  items: HistoryItem[]
  addItem: (verses: Verse[], translationId: number) => void
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  addItem: (verses, translationId) =>
    set((state) => {
      if (!verses || verses.length === 0) return state
      
      const lastItem = state.items[0]
      const lastVerses = lastItem?.verses || (lastItem?.verse ? [lastItem.verse] : [])
      
      // Avoid adding the exact same verses consecutively
      if (
        lastItem &&
        lastItem.translationId === translationId &&
        lastVerses.length === verses.length &&
        lastVerses.every((v, i) => v.id === verses[i].id)
      ) {
        return state
      }

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        verses,
        translationId,
        timestamp: Date.now(),
      }
      return { items: [newItem, ...state.items] }
    }),
  clearHistory: () => set({ items: [] }),
}))
