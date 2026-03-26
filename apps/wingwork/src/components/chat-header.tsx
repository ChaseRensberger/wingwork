import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth"
import { useRoomsStore } from "@/stores/rooms"

interface ChatHeaderProps {
  roomId: string
}

const actions = ["[search]", "[members]", "[settings]"] as const

export function ChatHeader({ roomId }: ChatHeaderProps) {
  const navigate = useNavigate()
  const client = useAuthStore((s) => s.client)
  const rooms = useRoomsStore((s) => s.rooms)
  const refreshRooms = useRoomsStore((s) => s.refreshRooms)
  const room = rooms.find((r) => r.id === roomId)

  const [leaving, setLeaving] = useState(false)

  async function handleLeave() {
    if (!client) return
    setLeaving(true)
    try {
      await client.leave(roomId)
      refreshRooms()
      void navigate({ to: "/" })
    } catch {
      // silently fail — room may already be left
    } finally {
      setLeaving(false)
    }
  }

  if (!room) return null

  return (
    <div className="h-12 border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {room.isDirect ? (
          <>
            <span className="size-2 rounded-full bg-muted-foreground" />
            <span className="font-medium">{room.name}</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">#</span>
            <span className="font-medium">{room.name}</span>
            {room.topic && (
              <>
                <span className="text-muted-foreground mx-2">|</span>
                <span className="text-sm text-muted-foreground">
                  {room.topic}
                </span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className="hover:text-foreground transition-colors"
          >
            {action}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void handleLeave()}
          disabled={leaving}
          className="hover:text-foreground transition-colors"
        >
          {leaving ? "[leaving...]" : "[leave]"}
        </button>
      </div>
    </div>
  )
}
