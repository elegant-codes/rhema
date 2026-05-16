export function splitSongIntoSlides(content: string): string[] {
  if (!content) return []
  
  // Split by double newline or more
  // Also handle cases where there are trailing newlines
  return content
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
