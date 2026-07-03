import { useState, useMemo, useEffect } from "react"
import { useBroadcastStore } from "@/stores"
import { splitSongIntoSlides } from "@/lib/lyrics-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { 
  PlusIcon, 
  SearchIcon, 
  Edit2Icon, 
  Trash2Icon, 
  PlayIcon, 
  ChevronLeftIcon,
  MusicIcon,
  XIcon,
  CheckIcon
} from "lucide-react"
import type { Song } from "@/types"

export function LyricsPanel() {
  const songs = useBroadcastStore((s) => s.songs)
  const addSong = useBroadcastStore((s) => s.addSong)
  const updateSong = useBroadcastStore((s) => s.updateSong)
  const deleteSong = useBroadcastStore((s) => s.deleteSong)
  const activeSongId = useBroadcastStore((s) => s.activeSongId)
  const activeSlideIndex = useBroadcastStore((s) => s.activeSlideIndex)
  const setLiveSongSlide = useBroadcastStore((s) => s.setLiveSongSlide)

  const [searchQuery, setSearchQuery] = useState("")
  const [editingSongId, setEditingSongId] = useState<string | null>(null)
  const [selectedSongId, setSelectedSongId] = useState<string | null>(
    () => useBroadcastStore.getState().activeSongId
  )

  // Form state for new/edit
  const [formTitle, setFormTitle] = useState("")
  const [formAuthor, setFormAuthor] = useState("")
  const [formContent, setFormContent] = useState("")

  const filteredSongs = useMemo(() => {
    return songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.author?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [songs, searchQuery])

  const selectedSong = useMemo(() => {
    return songs.find(s => s.id === selectedSongId) || null
  }, [songs, selectedSongId])

  const handleCreateNew = () => {
    setEditingSongId("new")
    setSelectedSongId(null)
    setFormTitle("")
    setFormAuthor("")
    setFormContent("")
  }

  const handleEdit = (song: Song) => {
    setEditingSongId(song.id)
    setFormTitle(song.title)
    setFormAuthor(song.author || "")
    setFormContent(song.content)
  }

  const handleSave = () => {
    const slides = splitSongIntoSlides(formContent)
    if (editingSongId === "new") {
      addSong({
        title: formTitle || "Untitled Song",
        author: formAuthor,
        content: formContent,
        slides,
      })
    } else if (editingSongId) {
      updateSong(editingSongId, {
        title: formTitle,
        author: formAuthor,
        content: formContent,
        slides,
      })
    }
    setEditingSongId(null)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this song?")) {
      deleteSong(id)
      if (selectedSongId === id) setSelectedSongId(null)
    }
  }

  const handleSelectSlide = (index: number) => {
    if (!selectedSongId) return
    if (activeSongId === selectedSongId && activeSlideIndex === index) {
      setLiveSongSlide(null, null)
    } else {
      setLiveSongSlide(selectedSongId, index)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only navigate if we have an active song and not typing in an input
      if (activeSongId === null || activeSlideIndex === null) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const song = songs.find(s => s.id === activeSongId)
      if (!song) return

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault()
        if (activeSlideIndex < song.slides.length - 1) {
          setLiveSongSlide(activeSongId, activeSlideIndex + 1)
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        if (activeSlideIndex > 0) {
          setLiveSongSlide(activeSongId, activeSlideIndex - 1)
        }
      } else if (e.key === "Escape") {
        setLiveSongSlide(null, null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeSongId, activeSlideIndex, songs, setLiveSongSlide])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background/50 backdrop-blur-sm">
      {/* Header with Search and Add */}
      <div className="p-4 border-b border-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MusicIcon className="size-5 text-emerald-500" />
            Lyrics Library
          </h2>
          <Button size="sm" onClick={handleCreateNew} className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <PlusIcon className="size-4" />
            Add New
          </Button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search songs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/50"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left List */}
        <div className={cn(
          "w-full md:w-64 border-r border-border overflow-y-auto shrink-0 transition-all",
          (selectedSongId || editingSongId) && "hidden md:block"
        )}>
          {filteredSongs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No songs found</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    setSelectedSongId(song.id)
                    setEditingSongId(null)
                  }}
                  className={cn(
                    "flex flex-col gap-0.5 p-3 text-left transition-colors border-b border-border/50 group",
                    selectedSongId === song.id ? "bg-emerald-500/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{song.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(song)
                        }}
                      >
                        <Edit2Icon className="size-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6 text-destructive"
                        onClick={(e) => handleDelete(song.id, e)}
                      >
                        <Trash2Icon className="size-3" />
                      </Button>
                    </div>
                  </div>
                  {song.author && (
                    <span className="text-xs text-muted-foreground truncate">{song.author}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/60">{song.slides.length} slides</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Detail / Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/30 overflow-hidden">
          {editingSongId ? (
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{editingSongId === "new" ? "New Song" : "Edit Song"}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSongId(null)}>
                    <XIcon className="size-4 mr-1.5" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckIcon className="size-4 mr-1.5" /> Save
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                    <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Song Title" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Author / Artist</label>
                    <Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Content (Use [Chorus] or Verse 1: to label slides. Split slides with double enter)</label>
                  <Textarea 
                    value={formContent} 
                    onChange={(e) => setFormContent(e.target.value)} 
                    placeholder="Enter lyrics here..."
                    className="flex-1 min-h-[300px] font-mono text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ) : selectedSong ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedSongId(null)}>
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <div className="flex flex-col overflow-hidden">
                    <h3 className="font-bold truncate">{selectedSong.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{selectedSong.author || "Unknown Author"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    import("@/stores").then(({ useQueueStore }) => {
                      useQueueStore.getState().addItem({
                        id: crypto.randomUUID(),
                        type: "song",
                        songId: selectedSong.id,
                        reference: selectedSong.title,
                        source: "manual",
                        added_at: Date.now(),
                      })
                    })
                  }}>
                    <PlusIcon className="size-3.5 mr-1.5" /> Queue
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(selectedSong)}>
                    <Edit2Icon className="size-3.5 mr-1.5" /> Edit
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSong.slides.map((slide, index) => {
                    const isLive = activeSongId === selectedSong.id && activeSlideIndex === index
                    return (
                      <button
                        key={slide.id || index}
                        onClick={() => handleSelectSlide(index)}
                        className={cn(
                          "relative flex flex-col p-4 rounded-lg border text-left transition-all group",
                          isLive 
                            ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20" 
                            : "border-border hover:border-emerald-500/50 bg-card hover:shadow-md"
                        )}
                      >
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <span className="text-[10px] font-mono text-muted-foreground/60">Slide {index + 1}</span>
                          {isLive && (
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {slide.label || `Slide ${index + 1}`}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1 line-clamp-4">
                          {slide.text}
                        </p>
                        <div className={cn(
                          "mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors",
                          isLive ? "text-emerald-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                        )}>
                          <PlayIcon className="size-3" />
                          {isLive ? "Live" : "Go Live"}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <MusicIcon className="size-12 mb-4 opacity-20" />
              <h3 className="font-medium">No song selected</h3>
              <p className="text-sm max-w-xs mt-1">
                Select a song from the list to start projecting lyrics slide by slide.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
