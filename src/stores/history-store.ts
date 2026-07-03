import { create } from "zustand"
import type { Verse } from "@/types"

export interface HistoryItem {
  id: string
  verse: Verse
  translationId: number
  timestamp: number
}

interface HistoryState {
  items: HistoryItem[]
  addItem: (verse: Verse, translationId: number) => void
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  addItem: (verse, translationId) =>
    set((state) => {
      // Avoid adding the exact same verse consecutively
      const lastItem = state.items[0]
      if (
        lastItem &&
        lastItem.verse.book_number === verse.book_number &&
        lastItem.verse.chapter === verse.chapter &&
        lastItem.verse.verse === verse.verse &&
        lastItem.translationId === translationId
      ) {
        return state
      }

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        verse,
        translationId,
        timestamp: Date.now(),
      }
      return { items: [newItem, ...state.items] }
    }),
  clearHistory: () => set({ items: [] }),
}))
