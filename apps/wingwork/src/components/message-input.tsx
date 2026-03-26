import { useState } from "react"
import { useMessagesStore } from "@/stores/messages"
import { useRoomsStore } from "@/stores/rooms"

interface MessageInputProps {
  roomId: string
}

export function MessageInput({ roomId }: MessageInputProps) {
  const [value, setValue] = useState("")
  const sendMessage = useMessagesStore((s) => s.sendMessage)
  const rooms = useRoomsStore((s) => s.rooms)
  const room = rooms.find((r) => r.id === roomId)

  const placeholder = room?.isDirect
    ? `message ${room.name}`
    : `message #${room?.name ?? "unknown"}`

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        sendMessage(roomId, value.trim())
        setValue("")
      }
    }
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="border border-border bg-input">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent p-3 text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex gap-2 text-xs text-muted-foreground">
            <button type="button" className="hover:text-foreground transition-colors">+</button>
            <button type="button" className="hover:text-foreground transition-colors">@</button>
            <button type="button" className="hover:text-foreground transition-colors">:</button>
          </div>
          <div className="text-xs text-muted-foreground">
            <kbd className="px-1 border border-border">enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  )
}
