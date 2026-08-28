import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Verse } from "@/types"
import { useBibleStore } from "@/stores/bible-store"
import { useBroadcastStore } from "@/stores/broadcast-store"
import { useHistoryStore } from "@/stores/history-store"
import { deriveLiveVerse, presentVerses, toVerseRenderData } from "./use-broadcast"

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockSave = vi.fn()
const mockLoad = vi.fn()
const mockInvoke = vi.fn()

vi.mock("@tauri-apps/plugin-store", () => ({
  load: (...args: unknown[]) => mockLoad(...args),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

vi.mock("@tauri-apps/api/event", () => ({
  emitTo: vi.fn(() => Promise.resolve()),
}))

const sampleVerse: Verse = {
  id: 1,
  translation_id: 1,
  book_number: 1,
  book_name: "Genesis",
  book_abbreviation: "Gen",
  chapter: 1,
  verse: 2,
  text: "The earth was without form and void.",
}

beforeEach(() => {
  mockGet.mockReset()
  mockSet.mockReset()
  mockSave.mockReset()
  mockLoad.mockReset()
  mockInvoke.mockReset()
  mockLoad.mockResolvedValue({
    get: mockGet,
    set: mockSet,
    save: mockSave,
  })
  mockInvoke.mockResolvedValue(undefined)

  useBibleStore.setState({
    translations: [{ id: 1, name: "King James Version", abbreviation: "KJV" }],
    activeTranslationId: 1,
    selectedVerses: [],
  })
  useBroadcastStore.setState({ liveVerse: null, isLive: false })
  useHistoryStore.setState({ items: [] })
})

describe("deriveLiveVerse", () => {
  it("returns null when live output is off", () => {
    const result = deriveLiveVerse({
      isLive: false,
      selectedVerses: [sampleVerse],
      translation: "NKJV",
    })

    expect(result).toBeNull()
  })

  it("returns verse render data when live output is on", () => {
    const result = deriveLiveVerse({
      isLive: true,
      selectedVerses: [sampleVerse],
      translation: "NKJV",
    })

    expect(result).toEqual(
      expect.objectContaining({
        reference: "Genesis 1:2 (NKJV)",
      }),
    )
  })
})

describe("presentVerses", () => {
  it("does nothing when given an empty array", async () => {
    await presentVerses([])

    expect(useBroadcastStore.getState().liveVerse).toBeNull()
    expect(useBroadcastStore.getState().isLive).toBe(false)
    expect(useHistoryStore.getState().items).toHaveLength(0)
  })

  it("sets the live verse, goes live, and records history", async () => {
    await presentVerses([sampleVerse])

    expect(useBroadcastStore.getState().isLive).toBe(true)
    expect(useBroadcastStore.getState().liveVerse).toEqual(
      toVerseRenderData([sampleVerse], "KJV"),
    )
    expect(useHistoryStore.getState().items).toHaveLength(1)
    expect(useHistoryStore.getState().items[0]).toEqual(
      expect.objectContaining({
        verses: [sampleVerse],
        translationId: 1,
      }),
    )
  })

  it("uses the active translation abbreviation", async () => {
    useBibleStore.setState({
      translations: [
        { id: 1, name: "King James Version", abbreviation: "KJV" },
        { id: 2, name: "New King James Version", abbreviation: "NKJV" },
      ],
      activeTranslationId: 2,
    })

    await presentVerses([sampleVerse])

    expect(useBroadcastStore.getState().liveVerse).toEqual(
      expect.objectContaining({ reference: "Genesis 1:2 (NKJV)" }),
    )
  })
})
