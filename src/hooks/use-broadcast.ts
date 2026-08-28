import { useBroadcastStore } from "@/stores/broadcast-store"
import { useBibleStore } from "@/stores/bible-store"
import { useHistoryStore } from "@/stores/history-store"
import type { VerseRenderData } from "@/types"
import type { Verse } from "@/types"

export function toVerseRenderData(verses: Verse[], translation: string): VerseRenderData {
  if (verses.length === 0) {
    return { reference: "", segments: [] }
  }

  // Sort verses just in case they were selected out of order
  const sortedVerses = [...verses].sort((a, b) => 
    a.book_number !== b.book_number ? a.book_number - b.book_number :
    a.chapter !== b.chapter ? a.chapter - b.chapter :
    a.verse - b.verse
  )

  // Generate Reference String
  const first = sortedVerses[0]
  const last = sortedVerses[sortedVerses.length - 1]
  
  let reference = `${first.book_name} ${first.chapter}:${first.verse}`
  if (sortedVerses.length > 1) {
    // Check if continuous
    let isContinuous = true
    for (let i = 1; i < sortedVerses.length; i++) {
      if (
        sortedVerses[i].book_number !== sortedVerses[i-1].book_number ||
        sortedVerses[i].chapter !== sortedVerses[i-1].chapter ||
        sortedVerses[i].verse !== sortedVerses[i-1].verse + 1
      ) {
        isContinuous = false
        break
      }
    }

    if (isContinuous && first.chapter === last.chapter && first.book_number === last.book_number) {
      reference += `-${last.verse}`
    } else {
      // Disjoint or spanning chapters
      reference = sortedVerses.map(v => 
        v.book_number === first.book_number && v.chapter === first.chapter 
          ? `${v.verse}` 
          : `${v.book_name} ${v.chapter}:${v.verse}`
      ).join(", ")
      // Prepend book and chapter if the first item was just the verse (it was handled by map, but wait)
      // Actually, if we use map above, the first item will just be 'verse', which is wrong.
      const refs = sortedVerses.map((v, i) => {
        if (i === 0) return `${v.book_name} ${v.chapter}:${v.verse}`
        const prev = sortedVerses[i - 1]
        if (v.book_number === prev.book_number && v.chapter === prev.chapter) {
          return `${v.verse}`
        }
        if (v.book_number === prev.book_number) {
          return `${v.chapter}:${v.verse}`
        }
        return `${v.book_name} ${v.chapter}:${v.verse}`
      })
      reference = refs.join(", ")
    }
  }
  reference += ` (${translation})`

  // Generate Segments
  const segments = sortedVerses.map(verse => {
    let cleanText = verse.text.trim()
    const prefix = `${verse.verse} `
    if (cleanText.startsWith(prefix)) {
      cleanText = cleanText.substring(prefix.length).trim()
    } else if (cleanText.startsWith(`${verse.verse}\xa0`)) {
      cleanText = cleanText.substring(String(verse.verse).length + 1).trim()
    }
    return { verseNumber: verse.verse, text: cleanText }
  })

  return {
    reference,
    segments,
    rawVerses: sortedVerses,
    translationId: verses[0]?.translation_id,
  }
}

export function deriveLiveVerse({
  isLive,
  selectedVerses,
  translation,
}: {
  isLive: boolean
  selectedVerses: Verse[]
  translation: string
}): VerseRenderData | null {
  if (!isLive || selectedVerses.length === 0) return null
  return toVerseRenderData(selectedVerses, translation)
}

/**
 * Push a verse selection to the live output immediately. This is the multi-verse
 * equivalent of upstream's single-verse `presentVerse`; it reuses the same path
 * as the Preview panel's "Send to live" button.
 */
export async function presentVerses(verses: Verse[]): Promise<void> {
  if (verses.length === 0) return
  const bibleState = useBibleStore.getState()
  const translation =
    bibleState.translations.find((t) => t.id === bibleState.activeTranslationId)
      ?.abbreviation ?? "KJV"
  const verseData = toVerseRenderData(verses, translation)

  useBroadcastStore.getState().setLiveVerse(verseData)
  useBroadcastStore.getState().setLive(true)
  useHistoryStore.getState().addItem(verses, bibleState.activeTranslationId)
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
