import { create } from "zustand"
import { emitTo } from "@tauri-apps/api/event"
import { load, type Store } from "@tauri-apps/plugin-store"
import type { BroadcastTheme, VerseRenderData, Song } from "@/types"
import { BUILTIN_THEMES } from "@/lib/builtin-themes"

type SelectedElement = "verse" | "reference" | null

interface BroadcastState {
  themes: BroadcastTheme[]
  activeThemeId: string
  altActiveThemeId: string
  isLive: boolean
  liveVerse: VerseRenderData | null
  liveAlert: string | null

  // Image Library
  imageLibrary: string[]
  liveImage: string | null
  liveImageFit: "cover" | "contain" | "stretch"
  showVerseOnMedia: boolean

  // Lyrics Library
  songs: Song[]
  activeSongId: string | null
  activeSlideIndex: number | null

  // Designer state
  isDesignerOpen: boolean
  editingThemeId: string | null
  renamingThemeId: string | null
  draftTheme: BroadcastTheme | null
  selectedElement: SelectedElement

  // Theme management
  loadThemes: () => void
  saveTheme: (theme: BroadcastTheme) => void
  deleteTheme: (id: string) => void
  duplicateTheme: (id: string) => void
  createNewTheme: () => void
  renameTheme: (id: string, name: string) => void
  togglePinTheme: (id: string) => void
  setActiveTheme: (id: string) => void
  setAltActiveTheme: (id: string) => void
  setLive: (live: boolean) => void
  setLiveVerse: (verse: VerseRenderData | null) => void
  setLiveAlert: (text: string | null) => void
  syncBroadcastOutput: () => void
  syncBroadcastOutputFor: (outputId: string) => void

  // Image Library
  addImageToLibrary: (paths: string[]) => void
  removeImageFromLibrary: (path: string) => void
  setLiveImage: (url: string | null) => void
  setLiveImageFit: (fit: "cover" | "contain" | "stretch") => void
  setShowVerseOnMedia: (show: boolean) => void

  // Lyrics Actions
  addSong: (song: Omit<Song, "id" | "createdAt" | "updatedAt">) => void
  updateSong: (id: string, updates: Partial<Omit<Song, "id" | "createdAt" | "updatedAt">>) => void
  deleteSong: (id: string) => void
  setLiveSongSlide: (songId: string | null, slideIndex: number | null) => void

  // Designer actions
  setDesignerOpen: (open: boolean) => void
  startEditing: (themeId: string) => void
  stopEditing: () => void
  updateDraft: (updates: Partial<BroadcastTheme>) => void
  updateDraftNested: (path: string, value: unknown) => void
  saveDraft: () => void
  discardDraft: () => void
  setSelectedElement: (el: SelectedElement) => void
  setRenamingTheme: (id: string | null) => void
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split(".")
  const isIndex = (key: string) => /^\d+$/.test(key)
  const result: Record<string, unknown> = Array.isArray(obj) ? [...obj] as unknown as Record<string, unknown> : { ...obj }

  let current: Record<string, unknown> | unknown[] = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const currentIndex = isIndex(key) ? Number(key) : key
    const existing = (current as Record<string, unknown> | unknown[])[currentIndex as keyof typeof current]
    const nextContainer = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === "object"
        ? { ...(existing as Record<string, unknown>) }
        : isIndex(nextKey)
          ? []
          : {}

    ;(current as Record<string, unknown> | unknown[])[currentIndex as keyof typeof current] = nextContainer as never
    current = nextContainer as Record<string, unknown> | unknown[]
  }

  const lastKey = keys[keys.length - 1]
  const lastIndex = isIndex(lastKey) ? Number(lastKey) : lastKey
  ;(current as Record<string, unknown> | unknown[])[lastIndex as keyof typeof current] = value as never

  return result
}

function emitDraftToBroadcast(state: BroadcastState): void {
  if (!state.draftTheme) return
  const id = state.editingThemeId
  if (id === state.activeThemeId) {
    void emitTo("broadcast", "broadcast:verse-update", {
      theme: state.draftTheme,
      verse: state.liveVerse,
      alert: state.liveAlert,
    }).catch(() => {})
  }
  if (id === state.altActiveThemeId) {
    void emitTo("broadcast-alt", "broadcast:verse-update", {
      theme: state.draftTheme,
      verse: state.liveVerse,
      alert: state.liveAlert,
    }).catch(() => {})
  }
}

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
  themes: [...BUILTIN_THEMES],
  activeThemeId: BUILTIN_THEMES[0].id,
  altActiveThemeId: BUILTIN_THEMES[0].id,
  isLive: false,
  liveVerse: null,
  liveAlert: null,
  imageLibrary: [],
  liveImage: null,
  liveImageFit: "cover",
  showVerseOnMedia: true,
  songs: [],
  activeSongId: null,
  activeSlideIndex: null,
  isDesignerOpen: false,
  editingThemeId: null,
  renamingThemeId: null,
  draftTheme: null,
  selectedElement: null,

  loadThemes: () => {
    set({ themes: [...BUILTIN_THEMES] })
  },
  saveTheme: (theme) =>
    set((s) => ({
      themes: s.themes.some((t) => t.id === theme.id)
        ? s.themes.map((t) => (t.id === theme.id ? theme : t))
        : [...s.themes, theme],
    })),
  deleteTheme: (id) =>
    set((s) => ({ themes: s.themes.filter((t) => t.id !== id || t.builtin) })),
  duplicateTheme: (id) => {
    const s = get()
    const source = s.themes.find((t) => t.id === id)
    if (!source) return
    const newTheme: BroadcastTheme = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} Copy`,
      builtin: false,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set((s) => ({ themes: [...s.themes, newTheme] }))
  },
  createNewTheme: () => {
    const source = BUILTIN_THEMES[0]
    const newTheme: BroadcastTheme = {
      ...source,
      id: crypto.randomUUID(),
      name: "Untitled Theme",
      builtin: false,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      background: {
        type: "solid",
        color: "#000000",
        gradient: null,
        image: null,
      },
    }
    set((s) => ({ themes: [...s.themes, newTheme] }))
    get().startEditing(newTheme.id)
  },
  renameTheme: (id, name) =>
    set((s) => ({
      themes: s.themes.map((t) =>
        t.id === id && !t.builtin ? { ...t, name, updatedAt: Date.now() } : t
      ),
      draftTheme:
        s.draftTheme?.id === id ? { ...s.draftTheme, name, updatedAt: Date.now() } : s.draftTheme,
    })),
  togglePinTheme: (id) =>
    set((s) => ({
      themes: s.themes.map((t) =>
        t.id === id ? { ...t, pinned: !t.pinned, updatedAt: Date.now() } : t
      ),
    })),
  syncBroadcastOutputFor: (outputId: string) => {
    const s = get()
    const themeId = outputId === "alt" ? s.altActiveThemeId : s.activeThemeId
    const label = outputId === "alt" ? "broadcast-alt" : "broadcast"
    const theme = s.themes.find((t) => t.id === themeId) ?? s.themes[0]
    if (!theme) return

    // 1. Determine Content
    let content: VerseRenderData | null = null

    if (s.isLive) {
      if (s.activeSongId !== null && s.activeSlideIndex !== null) {
        const song = s.songs.find((sg) => sg.id === s.activeSongId)
        const slide = song?.slides[s.activeSlideIndex]
        if (slide) {
          content = {
            reference: song?.title || "",
            segments: [{ text: slide.text }],
          }
        }
      } else {
        content = s.liveVerse
      }
    }

    // 2. Determine Theme (Background)
    let activeTheme = theme
    if (s.liveImage) {
      activeTheme = {
        ...theme,
        background: {
          type: "image",
          image: { url: s.liveImage, fit: s.liveImageFit, blur: 0, brightness: 100, tint: null },
          color: "#000000",
          gradient: null,
        },
      }
      // If media is live, check overlay setting
      if (!s.showVerseOnMedia) {
        content = null
      }
    }

    void emitTo(label, "broadcast:verse-update", {
      theme: activeTheme,
      verse: content,
      alert: s.liveAlert,
    }).catch(() => {})
  },
  syncBroadcastOutput: () => {
    get().syncBroadcastOutputFor("main")
    get().syncBroadcastOutputFor("alt")
  },
  setActiveTheme: (activeThemeId) => {
    set({ activeThemeId })
    get().syncBroadcastOutputFor("main")
  },
  setAltActiveTheme: (altActiveThemeId) => {
    set({ altActiveThemeId })
    get().syncBroadcastOutputFor("alt")
  },
  setLive: (isLive) => {
    set({ isLive })
    get().syncBroadcastOutput()
  },
  setLiveVerse: (liveVerse) => {
    set({ liveVerse, activeSongId: null, activeSlideIndex: null })
    get().syncBroadcastOutput()
  },
  setLiveAlert: (text) => {
    set({ liveAlert: text })
    get().syncBroadcastOutput()
  },
  
  // Image Library
  addImageToLibrary: (paths) => set((s) => ({ imageLibrary: [...new Set([...s.imageLibrary, ...paths])] })),
  removeImageFromLibrary: (path) => set((s) => ({
    imageLibrary: s.imageLibrary.filter(p => p !== path),
    liveImage: s.liveImage === path ? null : s.liveImage
  })),
  setLiveImage: (liveImage) => {
    set({ liveImage })
    get().syncBroadcastOutput()
  },
  setLiveImageFit: (liveImageFit) => {
    set({ liveImageFit })
    get().syncBroadcastOutput()
  },
  setShowVerseOnMedia: (showVerseOnMedia) => {
    set({ showVerseOnMedia })
    get().syncBroadcastOutput()
  },

  // Lyrics Actions
  addSong: (songData) => {
    const newSong: Song = {
      ...songData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set((s) => ({ songs: [...s.songs, newSong] }))
  },
  updateSong: (id, updates) => {
    set((s) => ({
      songs: s.songs.map((song) =>
        song.id === id ? { ...song, ...updates, updatedAt: Date.now() } : song
      ),
    }))
    // If the active song is updated, we might need to sync
    if (get().activeSongId === id) get().syncBroadcastOutput()
  },
  deleteSong: (id) => {
    set((s) => ({
      songs: s.songs.filter((song) => song.id !== id),
      activeSongId: s.activeSongId === id ? null : s.activeSongId,
      activeSlideIndex: s.activeSongId === id ? null : s.activeSlideIndex,
    }))
    if (get().activeSongId === id) get().syncBroadcastOutput()
  },
  setLiveSongSlide: (songId, slideIndex) => {
    set({ activeSongId: songId, activeSlideIndex: slideIndex, liveVerse: null })
    get().syncBroadcastOutput()
  },

  // Designer
  setDesignerOpen: (isDesignerOpen) => {
    if (!isDesignerOpen) {
      set({ isDesignerOpen, editingThemeId: null, draftTheme: null, selectedElement: null })
    } else {
      set({ isDesignerOpen })
    }
  },
  startEditing: (themeId) => {
    const theme = get().themes.find((t) => t.id === themeId)
    if (!theme) return
    set({
      editingThemeId: themeId,
      draftTheme: { ...theme, updatedAt: Date.now() },
      selectedElement: null,
    })
  },
  stopEditing: () => {
    set({
      editingThemeId: null,
      draftTheme: null,
      selectedElement: null,
    })
  },
  updateDraft: (updates) => {
    set((s) => ({
      draftTheme: s.draftTheme ? { ...s.draftTheme, ...updates, updatedAt: Date.now() } : null,
    }))
    emitDraftToBroadcast(get())
  },
  updateDraftNested: (path, value) => {
    set((s) => ({
      draftTheme: s.draftTheme
        ? (setNestedValue(s.draftTheme as unknown as Record<string, unknown>, path, value) as unknown as BroadcastTheme)
        : null,
    }))
    emitDraftToBroadcast(get())
  },
  saveDraft: () => {
    const { draftTheme } = get()
    if (!draftTheme) return
    // If editing a builtin, save as a new custom theme
    if (draftTheme.builtin) {
      const customTheme = {
        ...draftTheme,
        id: crypto.randomUUID(),
        name: `${draftTheme.name} (Custom)`,
        builtin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      set((s) => ({
        themes: [...s.themes, customTheme],
        activeThemeId: customTheme.id,
        editingThemeId: customTheme.id,
        draftTheme: customTheme,
      }))
    } else {
      get().saveTheme(draftTheme)
    }
  },
  discardDraft: () => {
    const { editingThemeId } = get()
    if (editingThemeId) {
      get().startEditing(editingThemeId)
    }
  },
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  setRenamingTheme: (id) => set({ renamingThemeId: id }),
}))

// ── Theme persistence via tauri-plugin-store ──

let tauriStore: Store | null = null
let hydrationPromise: Promise<void> | null = null

async function getThemeStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await load("broadcast-themes.json", { autoSave: false, defaults: {} })
  }
  return tauriStore
}

export function hydrateBroadcastThemes(): Promise<void> {
  if (hydrationPromise) return hydrationPromise
  hydrationPromise = (async () => {
    try {
      const store = await getThemeStore()
      const customThemes = (await store.get("customThemes")) as BroadcastTheme[] | undefined
      const activeId = (await store.get("activeThemeId")) as string | undefined
      const altActiveId = (await store.get("altActiveThemeId")) as string | undefined
      const imageLibrary = (await store.get("imageLibrary")) as string[] | undefined
      const songs = (await store.get("songs")) as Song[] | undefined

      const patch: Partial<BroadcastState> = {}
      if (customThemes && Array.isArray(customThemes) && customThemes.length > 0) {
        patch.themes = [...BUILTIN_THEMES, ...customThemes]
      }
      if (activeId) patch.activeThemeId = activeId
      if (altActiveId) patch.altActiveThemeId = altActiveId
      if (imageLibrary && Array.isArray(imageLibrary)) patch.imageLibrary = imageLibrary
      if (songs && Array.isArray(songs)) patch.songs = songs

      if (Object.keys(patch).length > 0) {
        useBroadcastStore.setState(patch)
      }

      // Auto-persist on changes (debounced)
      useBroadcastStore.subscribe((state, prevState) => {
        const changed =
          state.themes !== prevState.themes ||
          state.activeThemeId !== prevState.activeThemeId ||
          state.altActiveThemeId !== prevState.altActiveThemeId ||
          state.imageLibrary !== prevState.imageLibrary ||
          state.songs !== prevState.songs
        if (!changed) return
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          saveTimer = null
          pendingSave = pendingSave.then(() =>
            persistBroadcastThemes(useBroadcastStore.getState())
          )
        }, SAVE_DEBOUNCE_MS)
      })
    } catch {
      console.warn("[broadcast] Failed to load persisted themes, using defaults")
    }
  })()
  return hydrationPromise
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingSave: Promise<void> = Promise.resolve()
const SAVE_DEBOUNCE_MS = 500

async function persistBroadcastThemes(state: BroadcastState): Promise<void> {
  try {
    const store = await getThemeStore()
    const customThemes = state.themes.filter((t) => !t.builtin)
    await store.set("customThemes", customThemes)
    await store.set("activeThemeId", state.activeThemeId)
    await store.set("altActiveThemeId", state.altActiveThemeId)
    await store.set("imageLibrary", state.imageLibrary)
    await store.set("songs", state.songs)
    await store.save()
  } catch {
    console.warn("[broadcast] Failed to persist themes")
  }
}
