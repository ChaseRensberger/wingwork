import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"
import { useAuthStore } from "@/stores/auth"
import { useRoomsStore } from "@/stores/rooms"
import { usePresenceStore } from "@/stores/presence"
import { useThemeStore } from "@/stores/theme"
import type { PresenceStatus } from "@/stores/presence"
import { RoomActions } from "@/components/room-actions"

function extractLocalpart(userId: string | null): string {
  if (!userId) return "unknown"
  // "@chase:matrix.org" → "chase"
  const match = userId.match(/^@([^:]+)/)
  return match ? match[1] : userId
}

function presenceDotClass(status: PresenceStatus | undefined): string {
  switch (status) {
    case "online":
      return "bg-online"
    case "unavailable":
      return "bg-muted-foreground"
    default:
      return "bg-muted"
  }
}

export function ChatSidebar() {
  const navigate = useNavigate()
  const [activeAction, setActiveAction] = useState<"join" | "create" | "dm" | null>(null)

  const userId = useAuthStore((s) => s.userId)
  const logout = useAuthStore((s) => s.logout)

  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const rooms = useRoomsStore((s) => s.rooms)
  const activeRoomId = useRoomsStore((s) => s.activeRoomId)
  const setActiveRoom = useRoomsStore((s) => s.setActiveRoom)
  const initialize = useRoomsStore((s) => s.initialize)
  const cleanup = useRoomsStore((s) => s.cleanup)

  const presenceMap = usePresenceStore((s) => s.presence)

  useEffect(() => {
    const { client } = useAuthStore.getState()
    if (client) {
      initialize(client)
      usePresenceStore.getState().initialize(client)
    }
    return () => {
      cleanup()
      usePresenceStore.getState().cleanup()
    }
  }, [initialize, cleanup])

  const { channels, dms } = useMemo(() => {
    const channels = rooms.filter((r) => !r.isDirect)
    const dms = rooms.filter((r) => r.isDirect)
    return { channels, dms }
  }, [rooms])

  function handleRoomClick(roomId: string) {
    setActiveRoom(roomId)
    void navigate({ to: "/room/$roomId", params: { roomId } })
  }

  return (
    <aside className="w-56 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-full">
      {/* workspace header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="text-sm font-medium">wingwork</div>
        <div className="text-xs text-muted-foreground">matrix client</div>
      </div>

      {/* action buttons */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-sidebar-border text-xs text-muted-foreground">
        <button type="button" onClick={() => setActiveAction(activeAction === "join" ? null : "join")} className="hover:text-foreground transition-colors">[join]</button>
        <button type="button" onClick={() => setActiveAction(activeAction === "create" ? null : "create")} className="hover:text-foreground transition-colors">[new]</button>
        <button type="button" onClick={() => setActiveAction(activeAction === "dm" ? null : "dm")} className="hover:text-foreground transition-colors">[dm]</button>
      </div>

      <RoomActions activeAction={activeAction} onClose={() => setActiveAction(null)} />

      {/* scrollable room list */}
      <div className="flex-1 overflow-y-auto">
        {/* channels section */}
        <div className="pt-2">
          <div className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-wider">
            channels
          </div>
          {channels.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => handleRoomClick(room.id)}
              className={cn(
                "w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-sidebar-accent transition-colors",
                activeRoomId === room.id && "bg-sidebar-accent",
              )}
            >
              <span className="text-muted-foreground">#</span>
              <span className="flex-1 truncate">{room.name.toLowerCase()}</span>
              {room.unreadCount > 0 && (
                <span className="text-xs bg-foreground text-background px-1">
                  {room.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* dms section */}
        <div className="pt-2">
          <div className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-wider">
            direct msgs
          </div>
          {dms.map((room) => {
            const partnerPresence = room.dmPartnerUserId
              ? presenceMap[room.dmPartnerUserId]?.presence
              : undefined
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => handleRoomClick(room.id)}
                className={cn(
                  "w-full text-left px-2 py-1 text-sm flex items-center gap-2 hover:bg-sidebar-accent transition-colors",
                  activeRoomId === room.id && "bg-sidebar-accent",
                )}
              >
                <span className={cn("size-2 rounded-full", presenceDotClass(partnerPresence))} />
                <span className="flex-1 truncate">{room.name.toLowerCase()}</span>
                {room.unreadCount > 0 && (
                  <span className="text-xs bg-foreground text-background px-1">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* user footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="size-2 bg-online rounded-full" />
          <span className="text-xs">{extractLocalpart(userId)}</span>
          <span className="text-xs text-muted-foreground ml-auto">online</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const next =
              theme === "light"
                ? "dark"
                : theme === "dark"
                  ? "system"
                  : "light"
            setTheme(next)
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-1"
        >
          [{theme === "light" ? "dark" : theme === "dark" ? "system" : "light"}]
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-1"
        >
          [logout]
        </button>
      </div>
    </aside>
  )
}
