import { useBroadcastStore } from "@/stores/broadcast-store"
import type { VerseRenderData } from "@/types"
import type { Verse } from "@/types"

export function toVerseRenderData(verse: Verse, translation: string): VerseRenderData {
  let cleanText = verse.text.trim()
  const prefix = `${verse.verse} `
  if (cleanText.startsWith(prefix)) {
    cleanText = cleanText.substring(prefix.length).trim()
  } else if (cleanText.startsWith(`${verse.verse}\xa0`)) {
    // Handle non-breaking space as well
    cleanText = cleanText.substring(String(verse.verse).length + 1).trim()
  }

  return {
    reference: `${verse.book_name} ${verse.chapter}:${verse.verse} (${translation})`,
    segments: [{ verseNumber: verse.verse, text: cleanText }],
  }
}

export function deriveLiveVerse({
  isLive,
  selectedVerse,
  translation,
}: {
  isLive: boolean
  selectedVerse: Verse | null
  translation: string
}): VerseRenderData | null {
  if (!isLive || !selectedVerse) return null
  return toVerseRenderData(selectedVerse, translation)
}

export const broadcastActions = {
  setLiveVerse: (verse: VerseRenderData | null) =>
    useBroadcastStore.getState().setLiveVerse(verse),
  setLive: (live: boolean) =>
    useBroadcastStore.getState().setLive(live),
  getActiveTheme: () => {
    const s = useBroadcastStore.getState()
    return s.themes.find((t) => t.id === s.activeThemeId) ?? s.themes[0]
  },
}
