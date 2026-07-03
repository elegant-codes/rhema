export interface ItunesResult {
  trackId: number
  trackName: string
  artistName: string
}

export interface LrcLibResult {
  id: number
  name: string
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

export async function searchItunes(query: string): Promise<ItunesResult[]> {
  if (!query.trim()) return []
  
  try {
    const url = new URL("https://itunes.apple.com/search")
    url.searchParams.append("term", query)
    url.searchParams.append("entity", "song")
    url.searchParams.append("limit", "15")
    
    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Failed to search iTunes:", error)
    return []
  }
}

export async function getLyricsExact(artistName: string, trackName: string): Promise<LrcLibResult | null> {
  try {
    const url = new URL("https://lrclib.net/api/get")
    url.searchParams.append("artist_name", artistName)
    url.searchParams.append("track_name", trackName)
    
    const response = await fetch(url.toString())

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`LRCLIB API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch exact lyrics from LRCLIB:", error)
    return null
  }
}
