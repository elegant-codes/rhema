import { useState } from "react"
import { useBroadcastStore } from "@/stores/broadcast-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlayIcon, SquareIcon, BellRingIcon } from "lucide-react"

export function AlertsPanel() {
  const [alertText, setAlertText] = useState("")
  const liveAlert = useBroadcastStore((s) => s.liveAlert)
  const setLiveAlert = useBroadcastStore((s) => s.setLiveAlert)

  const presetMessages = [
    "Nursery worker needed in Room 1",
    "Parent of child # needed in nursery",
    "Please turn off mobile phones",
    "Service will begin in 5 minutes",
  ]

  const handleShowAlert = () => {
    if (alertText.trim()) {
      setLiveAlert(alertText.trim())
    }
  }

  const handleClearAlert = () => {
    setLiveAlert(null)
    setAlertText("")
  }

  return (
    <div className="flex h-full flex-col bg-background/50 backdrop-blur-sm overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 bg-muted/20">
        <BellRingIcon className="size-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-foreground">Live Alerts</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Custom Message</label>
          <div className="flex gap-2">
            <Input
              value={alertText}
              onChange={(e) => setAlertText(e.target.value)}
              placeholder="Enter alert message..."
              className="bg-background/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleShowAlert()
              }}
            />
            {liveAlert ? (
              <Button onClick={handleClearAlert} variant="destructive" className="shrink-0 gap-1.5">
                <SquareIcon className="size-4" fill="currentColor" />
                Clear
              </Button>
            ) : (
              <Button onClick={handleShowAlert} className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <PlayIcon className="size-4" fill="currentColor" />
                Show
              </Button>
            )}
          </div>
          {liveAlert && (
            <p className="text-sm text-emerald-500 font-medium">
              Currently showing: "{liveAlert}"
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Quick Presets</label>
          <div className="flex flex-col gap-2">
            {presetMessages.map((msg) => (
              <Button
                key={msg}
                variant="outline"
                className="justify-start font-normal h-auto py-2 px-3 text-left"
                onClick={() => setAlertText(msg)}
              >
                {msg}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
